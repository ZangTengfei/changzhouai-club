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
    eventSectionTitle: "近期活动",
    eventSectionHint: "查看全部活动",
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
      const catalog = await loadEvents();
      const showingHistory = catalog.upcoming.length === 0;
      const events = showingHistory ? catalog.history : catalog.upcoming;
      this.setData({
        events: events.slice(0, 3).map((event) => ({
          ...event,
          dateLabel: formatEventDate(event.event_at),
          locationLabel: event.venue || event.city || "常州",
        })),
        eventSectionTitle: showingHistory ? "最近回顾" : "近期活动",
        eventSectionHint: showingHistory
          ? `查看全部 ${catalog.counts.history} 场`
          : "查看全部活动",
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
