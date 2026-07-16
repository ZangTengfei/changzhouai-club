import { apiRequest } from "./api";

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
  status: "scheduled" | "completed";
  statusLabel: string;
};

export type EventCatalog = {
  upcoming: EventSummary[];
  history: EventSummary[];
  counts: {
    upcoming: number;
    history: number;
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
  imageUrl: string | null;
  imageThumbnailUrl: string | null;
  descriptionParagraphs: string[];
  agendaItems: string[];
  speakerItems: string[];
  registrationNote: string | null;
  registrationUrl: string | null;
  status: string;
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

export async function loadEvents() {
  return apiRequest<EventCatalog>({
    path: "/api/miniapp/events",
  });
}

export async function loadEventDetail(slug: string) {
  const response = await apiRequest<{ event: EventDetail }>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}`,
  });
  return response.event;
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
