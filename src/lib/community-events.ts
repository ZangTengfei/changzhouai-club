import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type EventPhotoRow = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

type CompletedEventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
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

function mapCompletedEvent(row: CompletedEventRow): PublicEventRecap {
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
  const photoCount = gallery.length;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary:
      row.summary ??
      row.description ??
      "这场活动已经完成，后续可以继续补充现场主题、分享内容和回顾摘要。",
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

export async function getCompletedEventRecaps() {
  if (!hasSupabaseEnv()) {
    return [] as PublicEventRecap[];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, slug, title, summary, description, event_at, venue, city, cover_image_url, event_photos(id, image_url, caption, sort_order)",
    )
    .eq("status", "completed")
    .order("event_at", { ascending: false, nullsFirst: false });

  if (!data || data.length === 0) {
    return [] as PublicEventRecap[];
  }

  return (data as CompletedEventRow[]).map(mapCompletedEvent);
}

export async function getScheduledEvents() {
  if (!hasSupabaseEnv()) {
    return [] as PublicScheduledEvent[];
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, summary, event_at, venue, city, slug, cover_image_url")
    .eq("status", "scheduled")
    .order("event_at", { ascending: true, nullsFirst: false });

  return (data ?? []) as PublicScheduledEvent[];
}
