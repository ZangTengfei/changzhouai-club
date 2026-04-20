import { unstable_cache } from "next/cache";

import { hasSupabaseEnv } from "@/lib/env";
import { createPublicServerClient } from "@/lib/supabase/public-server";

type EventPhotoRow = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

type EventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
  agenda: string | null;
  speaker_lineup: string | null;
  registration_note: string | null;
  recap: string | null;
  status: string;
  event_photos: EventPhotoRow[] | null;
};

export type PublicScheduledEvent = {
  id: string;
  title: string;
  summary: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  slug: string;
  cover_image_url: string | null;
  registration_note?: string | null;
};

export type PublicGalleryImage = {
  id: string;
  imageUrl: string;
  caption: string | null;
};

export type PublicEventRecap = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  dateLabel: string;
  isoDate: string;
  locationLabel: string;
  imageUrl: string | null;
  highlights: string[];
  gallery: PublicGalleryImage[];
};

export type PublicEventDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  eventAt: string | null;
  dateLabel: string;
  dateTimeLabel: string;
  status: string;
  statusLabel: string;
  city: string | null;
  venue: string | null;
  locationLabel: string;
  imageUrl: string | null;
  descriptionParagraphs: string[];
  agendaItems: string[];
  speakerItems: string[];
  registrationNote: string | null;
  recapParagraphs: string[];
  gallery: PublicGalleryImage[];
};

const PUBLIC_EVENTS_REVALIDATE_SECONDS = 60;

const publicEventStatusLabelMap: Record<string, string> = {
  draft: "草稿",
  scheduled: "开放报名",
  completed: "已结束",
  cancelled: "已取消",
};

function formatEventDateLabel(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function buildLocationLabel(city: string | null, venue: string | null) {
  if (venue) {
    return `${city ?? "常州"} · ${venue}`;
  }

  return city ?? "常州";
}

function parseLineList(value: string | null) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split("\n")
    .map((item) => item.trim().replace(/^[\s\-*•\d.、]+/, ""))
    .filter(Boolean);
}

function parseParagraphs(value: string | null) {
  if (!value) {
    return [] as string[];
  }

  return value
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupeGalleryItems(items: PublicGalleryImage[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.imageUrl)) {
      return false;
    }

    seen.add(item.imageUrl);
    return true;
  });
}

function buildEventGallery(row: EventRow) {
  const photos = (row.event_photos ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((photo) => ({
      id: photo.id,
      imageUrl: photo.image_url,
      caption: photo.caption,
    }));

  const coverImage = row.cover_image_url
    ? [
        {
          id: `${row.id}-cover`,
          imageUrl: row.cover_image_url,
          caption: row.title,
        },
      ]
    : [];

  const gallery = dedupeGalleryItems([...coverImage, ...photos]);
  return gallery;
}

function formatEventDateTimeLabel(value: string | null) {
  if (!value) {
    return "时间待定";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPublicEventStatus(status: string) {
  return publicEventStatusLabelMap[status] ?? status;
}

function mapCompletedEvent(row: EventRow): PublicEventRecap {
  const gallery = buildEventGallery(row);
  const photoCount = gallery.length;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary:
      row.summary ??
      row.description ??
      "这场活动已经完成，欢迎通过活动记录了解现场主题、分享内容与交流氛围。",
    dateLabel: row.event_at ? formatEventDateLabel(row.event_at) : "时间待定",
    isoDate: row.event_at ? row.event_at.slice(0, 10) : row.id,
    locationLabel: buildLocationLabel(row.city, row.venue),
    imageUrl: row.cover_image_url ?? gallery[0]?.imageUrl ?? null,
    highlights: [
      row.city ?? "常州",
      row.venue ?? "线下交流",
      photoCount > 0 ? `${photoCount} 张活动照片` : "活动已归档",
    ],
    gallery,
  };
}

function mapPublicEventDetail(row: EventRow): PublicEventDetail {
  const gallery = buildEventGallery(row);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary:
      row.summary ??
      row.description ??
      "这是一场常州 AI Club 的线下活动，欢迎查看时间、地点与活动介绍。",
    eventAt: row.event_at,
    dateLabel: row.event_at ? formatEventDateLabel(row.event_at) : "时间待定",
    dateTimeLabel: formatEventDateTimeLabel(row.event_at),
    status: row.status,
    statusLabel: formatPublicEventStatus(row.status),
    city: row.city,
    venue: row.venue,
    locationLabel: buildLocationLabel(row.city, row.venue),
    imageUrl: row.cover_image_url ?? gallery[0]?.imageUrl ?? null,
    descriptionParagraphs: parseParagraphs(row.description),
    agendaItems: parseLineList(row.agenda),
    speakerItems: parseLineList(row.speaker_lineup),
    registrationNote: row.registration_note,
    recapParagraphs: parseParagraphs(row.recap),
    gallery,
  };
}

export async function getCompletedEventRecaps() {
  if (!hasSupabaseEnv()) {
    return [] as PublicEventRecap[];
  }

  return getCachedCompletedEventRecaps();
}

export async function getScheduledEvents() {
  if (!hasSupabaseEnv()) {
    return [] as PublicScheduledEvent[];
  }

  return getCachedScheduledEvents();
}

export async function getPublicEventBySlug(slug: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return getCachedPublicEventBySlug(slug);
}

const getCachedCompletedEventRecaps = unstable_cache(
  async () => {
    const supabase = createPublicServerClient();
    const { data } = await supabase
      .from("events")
      .select(
        "id, slug, title, summary, description, event_at, venue, city, cover_image_url, agenda, speaker_lineup, registration_note, recap, status, event_photos(id, image_url, caption, sort_order)",
      )
      .eq("status", "completed")
      .order("event_at", { ascending: false, nullsFirst: false });

    if (!data || data.length === 0) {
      return [] as PublicEventRecap[];
    }

    return (data as EventRow[]).map(mapCompletedEvent);
  },
  ["public-completed-event-recaps"],
  { revalidate: PUBLIC_EVENTS_REVALIDATE_SECONDS },
);

const getCachedScheduledEvents = unstable_cache(
  async () => {
    const supabase = createPublicServerClient();
    const { data } = await supabase
      .from("events")
      .select(
        "id, title, summary, event_at, venue, city, slug, cover_image_url, registration_note",
      )
      .eq("status", "scheduled")
      .order("event_at", { ascending: true, nullsFirst: false });

    return (data ?? []) as PublicScheduledEvent[];
  },
  ["public-scheduled-events"],
  { revalidate: PUBLIC_EVENTS_REVALIDATE_SECONDS },
);

const getCachedPublicEventBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicServerClient();
    const { data } = await supabase
      .from("events")
      .select(
        "id, slug, title, summary, description, event_at, venue, city, cover_image_url, agenda, speaker_lineup, registration_note, recap, status, event_photos(id, image_url, caption, sort_order)",
      )
      .eq("slug", slug)
      .in("status", ["scheduled", "completed", "cancelled"])
      .maybeSingle();

    if (!data) {
      return null;
    }

    return mapPublicEventDetail(data as EventRow);
  },
  ["public-event-detail-by-slug"],
  { revalidate: PUBLIC_EVENTS_REVALIDATE_SECONDS },
);
