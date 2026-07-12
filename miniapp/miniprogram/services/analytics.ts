import { apiRequest } from "./api";

export function trackEvent(
  eventName: string,
  pagePath: string,
  eventData: WechatMiniprogram.IAnyObject = {},
) {
  void apiRequest<{ tracked: boolean }>({
    path: "/api/miniapp/analytics",
    method: "POST",
    authenticated: true,
    data: { eventName, pagePath, eventData },
  }).catch(() => undefined);
}
