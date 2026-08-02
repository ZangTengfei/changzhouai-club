import { apiRequest, getStoredSessionToken } from "./api";

export function loadCommunitySpace(startsAt: string, endsAt: string) {
  const search = [
    `startsAt=${encodeURIComponent(startsAt)}`,
    `endsAt=${encodeURIComponent(endsAt)}`,
  ].join("&");
  return apiRequest<MiniappCommunitySpaceSnapshot>({
    path: `/api/miniapp/community?${search}`,
    authenticated: Boolean(getStoredSessionToken()),
  });
}

export function submitCommunityBooking(input: {
  resourceId: string;
  startsAt: string;
  endsAt: string;
  purpose: string;
  attendeeCount: number;
}) {
  return apiRequest<{ booking: MiniappCommunitySpaceBooking }>({
    path: "/api/miniapp/community/bookings",
    method: "POST",
    authenticated: true,
    data: input,
  });
}

export function cancelCommunityBooking(bookingId: string) {
  return apiRequest<{ booking: { id: string; status: "cancelled" } }>({
    path: `/api/miniapp/community/bookings/${encodeURIComponent(bookingId)}`,
    method: "DELETE",
    authenticated: true,
  });
}

export function submitCommunityAccessRequest(input: {
  contact: string;
  note: string;
}) {
  return apiRequest<{ accessRequest: MiniappCommunityAccessRequest }>({
    path: "/api/miniapp/community/access-requests",
    method: "POST",
    authenticated: true,
    data: input,
  });
}
