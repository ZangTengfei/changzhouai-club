import { formatEventDate, loadEvents, type EventSummary } from "../../services/events";
import { trackEvent } from "../../services/analytics";
import { ensureSession } from "../../services/auth";

type HomeEvent = EventSummary & {
  dateLabel: string;
  locationLabel: string;
};

Page({
  data: {
    events: [] as HomeEvent[],
    loading: true,
    loadFailed: false,
  },

  onLoad() {
    void ensureSession().then(() =>
      trackEvent("home_view", "/pages/home/index"),
    ).catch(() => undefined);
    void this.loadPage();
  },

  onPullDownRefresh() {
    void this.loadPage().finally(() => wx.stopPullDownRefresh());
  },

  async loadPage() {
    this.setData({ loading: true, loadFailed: false });

    try {
      const events = await loadEvents();
      this.setData({
        events: events.slice(0, 3).map((event) => ({
          ...event,
          dateLabel: formatEventDate(event.event_at),
          locationLabel: event.venue || event.city || "常州",
        })),
        loading: false,
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (slug) {
      void wx.navigateTo({ url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}` });
    }
  },

  openEvents() {
    void wx.switchTab({ url: "/pages/events/index" });
  },
});
