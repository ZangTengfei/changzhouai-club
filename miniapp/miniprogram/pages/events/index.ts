import { formatEventDate, loadEvents, type EventSummary } from "../../services/events";
import { trackEvent } from "../../services/analytics";
import { ensureSession } from "../../services/auth";

type EventListItem = EventSummary & {
  dateLabel: string;
  locationLabel: string;
};

type EventMode = "upcoming" | "history";

Page({
  data: {
    upcoming: [] as EventListItem[],
    history: [] as EventListItem[],
    visibleEvents: [] as EventListItem[],
    activeMode: "history" as EventMode,
    counts: { upcoming: 0, history: 0 },
    loading: true,
    loadFailed: false,
  },

  onShow() {
    void ensureSession().then(() =>
      trackEvent("event_list_view", "/pages/events/index"),
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
      const mapEvent = (event: EventSummary): EventListItem => ({
        ...event,
        dateLabel: formatEventDate(event.event_at),
        locationLabel: event.venue || event.city || "常州",
      });
      const upcoming = catalog.upcoming.map(mapEvent);
      const history = catalog.history.map(mapEvent);
      const activeMode: EventMode = upcoming.length > 0 ? "upcoming" : "history";
      this.setData({
        upcoming,
        history,
        visibleEvents: activeMode === "upcoming" ? upcoming : history,
        activeMode,
        counts: catalog.counts,
        loading: false,
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  switchMode(event: WechatMiniprogram.TouchEvent) {
    const mode = String(event.currentTarget.dataset.mode ?? "") as EventMode;
    if (mode !== "upcoming" && mode !== "history") return;
    this.setData({
      activeMode: mode,
      visibleEvents: mode === "upcoming" ? this.data.upcoming : this.data.history,
    });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (slug) {
      void wx.navigateTo({ url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}` });
    }
  },
});
