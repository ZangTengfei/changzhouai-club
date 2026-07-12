import { apiRequest } from "./api";

type SubscriptionState = {
  status: "accepted" | "rejected" | "sent" | "failed" | "cancelled";
  send_at: string | null;
  sent_at: string | null;
};

export type ReminderConfig = {
  available: boolean;
  templateId?: string;
  subscription: SubscriptionState | null;
};

export function loadReminderConfig(slug: string) {
  return apiRequest<ReminderConfig>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/subscription`,
    authenticated: true,
  });
}

export function saveReminderStatus(
  slug: string,
  status: "accepted" | "rejected",
) {
  return apiRequest<{ subscription: SubscriptionState }>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/subscription`,
    method: "POST",
    authenticated: true,
    data: { status },
  });
}

export function requestReminderAuthorization(templateId: string) {
  return new Promise<"accepted" | "rejected">((resolve, reject) => {
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success(result) {
        resolve(result[templateId] === "accept" ? "accepted" : "rejected");
      },
      fail: reject,
    });
  });
}
