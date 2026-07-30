import { apiRequest } from "./api";

export type EventParticipantPreview = {
  shareHandle: string;
  displayName: string;
  avatarUrl: string | null;
  avatarInitial: string;
};

export type EventSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
  event_type: string;
  eventTypeLabel: string;
  registration_mode: "instant" | "review";
  registration_capacity: number | null;
  status: "draft" | "scheduled" | "completed";
  statusLabel: string;
  visibility: "public" | "admin_only";
  confirmed_count: number;
  participant_preview: EventParticipantPreview[];
};

export type EventMode = "upcoming" | "history" | "draft";
export type EventFilter = "all" | "community" | "external";

export type EventRegistrationTag = {
  label: string;
  tone: "mode" | "success" | "capacity";
};

export type EventCatalog = {
  events: EventSummary[];
  mode: EventMode;
  filter: EventFilter;
  canPreviewDrafts: boolean;
  counts: {
    upcoming: number;
    history: number;
    draft: number;
  };
  categoryCounts: {
    all: number;
    community: number;
    external: number;
  };
  pagination: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type EventDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  dateTimeLabel: string;
  statusLabel: string;
  eventTypeLabel: string;
  locationLabel: string;
  locationLatitude: number | null;
  locationLongitude: number | null;
  imageUrl: string | null;
  imageThumbnailUrl: string | null;
  descriptionParagraphs: string[];
  agendaItems: string[];
  speakerItems: string[];
  registrationNote: string | null;
  registrationUrl: string | null;
  registrationMode: "instant" | "review";
  registrationCapacity: number | null;
  confirmedCount: number;
  participants: EventParticipantPreview[];
  status: string;
  visibility: "public" | "admin_only";
  eventType: string;
  recapParagraphs: string[];
  docsUrl: string | null;
  video: {
    url: string;
    title: string | null;
    coverUrl: string | null;
  } | null;
  gallery: Array<{
    id: string;
    imageUrl: string;
    thumbnailUrl: string;
    caption: string | null;
  }>;
};

export async function loadEvents(options: {
  mode?: EventMode;
  filter?: EventFilter;
  offset?: number;
  limit?: number;
} = {}) {
  const search = [
    options.mode ? `mode=${options.mode}` : "",
    options.filter && options.filter !== "all" ? `filter=${options.filter}` : "",
    `offset=${options.offset ?? 0}`,
    `limit=${options.limit ?? 5}`,
  ].filter(Boolean).join("&");

  return apiRequest<EventCatalog>({
    path: `/api/miniapp/events?${search}`,
    authenticated: true,
  });
}

export async function loadEventDetail(slug: string) {
  const response = await apiRequest<{ event: EventDetail }>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}`,
    authenticated: true,
  });
  return response.event;
}

export function getEventRegistrationTags(
  event: Pick<
    EventSummary,
    "registration_capacity" | "registration_mode" | "status"
  >,
): EventRegistrationTag[] {
  if (event.status === "completed") return [];

  return [
    {
      label: event.registration_mode === "review" ? "需申请" : "无需申请",
      tone: "mode",
    },
    {
      label:
        event.registration_mode === "review" ? "审核后确认" : "报名即成功",
      tone: "success",
    },
    {
      label: event.registration_capacity
        ? `限 ${event.registration_capacity} 人`
        : "不限人数",
      tone: "capacity",
    },
  ];
}

export function formatEventDate(value: string | null) {
  if (!value) return "时间待定";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待定";

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hour}:${minute}`;
}
