import { apiRequest } from "./api";

export type EventGroupQr = {
  imageUrl: string;
  note: string | null;
  expiresAt: string | null;
};

export async function loadEventGroupQr(slug: string) {
  const response = await apiRequest<{ groupQr: EventGroupQr }>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/group-qr`,
    authenticated: true,
  });
  return response.groupQr;
}
