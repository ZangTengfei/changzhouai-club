import {
  loadEvents,
  type EventFilter,
  type EventMode,
  type EventSummary,
} from "../../services/events";
import { trackEvent } from "../../services/analytics";
import { ensureSession } from "../../services/auth";

type EventListItem = EventSummary & {
  coverMode: "aspectFill" | "aspectFit";
  dateDayLabel: string;
  dateTimeLabel: string;
  locationLabel: string;
  monthKey: string;
  monthLabel: string;
  typeClass: string;
  yearLabel: string;
};

type EventGroup = {
  key: string;
  monthLabel: string;
  yearLabel: string;
  countLabel: string;
  events: EventListItem[];
};

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const pageSize = 5;
let requestVersion = 0;

function getCoverMode(url: string | null): "aspectFill" | "aspectFit" {
  return url && /poster|layout|challenge|registration/i.test(url)
    ? "aspectFit"
    : "aspectFill";
}

function mapEvent(event: EventSummary): EventListItem {
  const date = event.event_at ? new Date(event.event_at) : null;
  const validDate = date && !Number.isNaN(date.getTime()) ? date : null;
  const year = validDate?.getFullYear() ?? 0;
  const month = validDate ? validDate.getMonth() + 1 : 0;
  const day = validDate?.getDate() ?? 0;
  const hour = validDate ? String(validDate.getHours()).padStart(2, "0") : "";
  const minute = validDate ? String(validDate.getMinutes()).padStart(2, "0") : "";

  return {
    ...event,
    coverMode: getCoverMode(event.cover_image_url),
    dateDayLabel: validDate ? `${month}月${day}日` : "时间待定",
    dateTimeLabel: validDate
      ? `${weekdayLabels[validDate.getDay()]} ${hour}:${minute}`
      : "",
    locationLabel: event.venue || event.city || "常州",
    monthKey: validDate ? `${year}-${String(month).padStart(2, "0")}` : "pending",
    monthLabel: validDate ? `${month}月` : "待定",
    typeClass: event.event_type === "external" ? "event-type-external" : "",
    yearLabel: validDate ? String(year) : "",
  };
}

function groupEvents(events: EventListItem[]) {
  const groups = new Map<string, EventGroup>();

  for (const event of events) {
    const group = groups.get(event.monthKey);
    if (group) {
      group.events.push(event);
      group.countLabel = `${group.events.length} 场活动`;
      continue;
    }

    groups.set(event.monthKey, {
      key: event.monthKey,
      monthLabel: event.monthLabel,
      yearLabel: event.yearLabel,
      countLabel: "1 场活动",
      events: [event],
    });
  }

  return Array.from(groups.values());
}

Page({
  data: {
    visibleEvents: [] as EventListItem[],
    eventGroups: [] as EventGroup[],
    activeMode: "history" as EventMode,
    activeFilter: "all" as EventFilter,
    counts: { upcoming: 0, history: 0 },
    categoryCounts: { all: 0, community: 0, external: 0 },
    loading: true,
    loadingMore: false,
    hasMore: false,
    loadFailed: false,
  },

  onLoad() {
    void this.loadFirstPage();
  },

  onShow() {
    void ensureSession().then(() =>
      trackEvent("event_list_view", "/pages/events/index"),
    ).catch(() => undefined);
  },

  onPullDownRefresh() {
    const mode = this.data.counts.upcoming || this.data.counts.history
      ? this.data.activeMode
      : undefined;
    void this.loadFirstPage(
      mode,
      this.data.activeFilter,
      true,
    ).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    void this.loadMore();
  },

  retryLoad() {
    const mode = this.data.counts.upcoming || this.data.counts.history
      ? this.data.activeMode
      : undefined;
    void this.loadFirstPage(mode, this.data.activeFilter);
  },

  async loadFirstPage(
    mode?: EventMode,
    filter: EventFilter = "all",
    preserveContent = false,
  ) {
    const currentRequest = ++requestVersion;
    this.setData({
      loading: !preserveContent,
      loadFailed: false,
      loadingMore: false,
      ...(preserveContent ? {} : {
        visibleEvents: [],
        eventGroups: [],
        hasMore: false,
      }),
    });

    try {
      const catalog = await loadEvents({ mode, filter, limit: pageSize });
      if (currentRequest !== requestVersion) return;
      const visibleEvents = catalog.events.map(mapEvent);
      this.setData({
        visibleEvents,
        eventGroups: groupEvents(visibleEvents),
        activeMode: catalog.mode,
        activeFilter: catalog.filter,
        counts: catalog.counts,
        categoryCounts: catalog.categoryCounts,
        hasMore: catalog.pagination.hasMore,
        loading: false,
      });
    } catch {
      if (currentRequest !== requestVersion) return;
      if (preserveContent) {
        this.setData({ loading: false });
        void wx.showToast({ title: "刷新失败，请稍后重试", icon: "none" });
        return;
      }
      this.setData({
        visibleEvents: [],
        eventGroups: [],
        loading: false,
        loadFailed: true,
      });
    }
  },

  async loadMore() {
    if (this.data.loading || this.data.loadingMore || !this.data.hasMore) return;
    const currentRequest = requestVersion;
    this.setData({ loadingMore: true });

    try {
      const catalog = await loadEvents({
        mode: this.data.activeMode,
        filter: this.data.activeFilter,
        offset: this.data.visibleEvents.length,
        limit: pageSize,
      });
      if (currentRequest !== requestVersion) return;
      const visibleEvents = [
        ...this.data.visibleEvents,
        ...catalog.events.map(mapEvent),
      ];
      this.setData({
        visibleEvents,
        eventGroups: groupEvents(visibleEvents),
        hasMore: catalog.pagination.hasMore,
        loadingMore: false,
      });
    } catch {
      if (currentRequest !== requestVersion) return;
      this.setData({ loadingMore: false });
      void wx.showToast({ title: "加载更多失败，请稍后重试", icon: "none" });
    }
  },

  switchMode(event: WechatMiniprogram.TouchEvent) {
    const mode = String(event.currentTarget.dataset.mode ?? "") as EventMode;
    if (mode !== "upcoming" && mode !== "history") return;
    if (mode === this.data.activeMode) return;
    void this.loadFirstPage(mode, this.data.activeFilter);
  },

  switchFilter(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter ?? "") as EventFilter;
    if (filter !== "all" && filter !== "community" && filter !== "external") return;
    if (filter === this.data.activeFilter) return;
    void this.loadFirstPage(this.data.activeMode, filter);
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (slug) {
      void wx.navigateTo({ url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}` });
    }
  },
});
