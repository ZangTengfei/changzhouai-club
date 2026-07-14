import { formatEventDate, loadEvents, type EventSummary } from "../../services/events";
import { trackEvent } from "../../services/analytics";
import { ensureSession } from "../../services/auth";

type HomeEvent = EventSummary & {
  coverMode: "aspectFill" | "aspectFit";
  dateLabel: string;
  indexLabel: string;
  locationLabel: string;
};

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function formatBriefDate() {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weekdayLabels[now.getDay()]}`;
}

function getCoverMode(url: string | null): "aspectFill" | "aspectFit" {
  return url && /poster|layout|challenge|registration/i.test(url)
    ? "aspectFit"
    : "aspectFill";
}

Page({
  data: {
    featuredEvent: null as HomeEvent | null,
    events: [] as HomeEvent[],
    briefDate: formatBriefDate(),
    eventSectionTitle: "最近记录",
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
      const mappedEvents = events.slice(0, 4).map((event, index) => ({
        ...event,
        coverMode: getCoverMode(event.cover_image_url),
        dateLabel: formatEventDate(event.event_at),
        indexLabel: String(index + 1).padStart(2, "0"),
        locationLabel: event.venue || event.city || "常州",
      }));
      this.setData({
        featuredEvent: mappedEvents[0] ?? null,
        events: mappedEvents.slice(1),
        eventSectionTitle: showingHistory ? "最近回顾" : "接下来发生",
        eventSectionHint: showingHistory
          ? `查看全部 ${catalog.counts.history} 场`
          : "查看全部活动",
        loading: false,
      });
    } catch {
      this.setData({ featuredEvent: null, events: [], loading: false, loadFailed: true });
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
