import { loadEvents, type EventSummary } from "../../services/events";
import { trackEvent } from "../../services/analytics";
import { ensureSession } from "../../services/auth";

type EventMode = "upcoming" | "history";
type EventFilter = "all" | "community" | "external";

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

function filterEvents(events: EventListItem[], filter: EventFilter) {
  if (filter === "all") return events;
  return events.filter((event) => event.event_type === filter);
}

function getCategoryCounts(events: EventListItem[]) {
  return {
    all: events.length,
    community: events.filter((event) => event.event_type === "community").length,
    external: events.filter((event) => event.event_type === "external").length,
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
    upcoming: [] as EventListItem[],
    history: [] as EventListItem[],
    visibleEvents: [] as EventListItem[],
    eventGroups: [] as EventGroup[],
    activeMode: "history" as EventMode,
    activeFilter: "all" as EventFilter,
    counts: { upcoming: 0, history: 0 },
    categoryCounts: { all: 0, community: 0, external: 0 },
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
      const upcoming = catalog.upcoming.map(mapEvent);
      const history = catalog.history.map(mapEvent);
      const activeMode: EventMode = upcoming.length > 0 ? "upcoming" : "history";
      const sourceEvents = activeMode === "upcoming" ? upcoming : history;
      this.setData({
        upcoming,
        history,
        visibleEvents: sourceEvents,
        eventGroups: groupEvents(sourceEvents),
        activeMode,
        activeFilter: "all",
        counts: catalog.counts,
        categoryCounts: getCategoryCounts(sourceEvents),
        loading: false,
      });
    } catch {
      this.setData({
        visibleEvents: [],
        eventGroups: [],
        loading: false,
        loadFailed: true,
      });
    }
  },

  switchMode(event: WechatMiniprogram.TouchEvent) {
    const mode = String(event.currentTarget.dataset.mode ?? "") as EventMode;
    if (mode !== "upcoming" && mode !== "history") return;
    const sourceEvents = mode === "upcoming" ? this.data.upcoming : this.data.history;
    const visibleEvents = filterEvents(sourceEvents, this.data.activeFilter);
    this.setData({
      activeMode: mode,
      visibleEvents,
      eventGroups: groupEvents(visibleEvents),
      categoryCounts: getCategoryCounts(sourceEvents),
    });
  },

  switchFilter(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter ?? "") as EventFilter;
    if (filter !== "all" && filter !== "community" && filter !== "external") return;
    const sourceEvents = this.data.activeMode === "upcoming" ? this.data.upcoming : this.data.history;
    const visibleEvents = filterEvents(sourceEvents, filter);
    this.setData({
      activeFilter: filter,
      visibleEvents,
      eventGroups: groupEvents(visibleEvents),
    });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (slug) {
      void wx.navigateTo({ url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}` });
    }
  },
});
