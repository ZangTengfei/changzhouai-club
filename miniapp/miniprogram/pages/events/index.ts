import {
  getEventRegistrationTags,
  loadEvents,
  type EventCatalog,
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
  registrationTags: ReturnType<typeof getEventRegistrationTags>;
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

type EventModePanel = {
  mode: EventMode;
  visibleEvents: EventListItem[];
  eventGroups: EventGroup[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadFailed: boolean;
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
    registrationTags: getEventRegistrationTags(event),
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

function createModePanel(
  mode: EventMode,
  options: Partial<EventModePanel> = {},
): EventModePanel {
  return {
    mode,
    visibleEvents: [],
    eventGroups: [],
    loading: true,
    loadingMore: false,
    hasMore: false,
    loadFailed: false,
    ...options,
  };
}

function buildLoadedPanel(mode: EventMode, catalog: EventCatalog) {
  const visibleEvents = catalog.events.map(mapEvent);
  return createModePanel(mode, {
    visibleEvents,
    eventGroups: groupEvents(visibleEvents),
    loading: false,
    hasMore: catalog.pagination.hasMore,
  });
}

function getAvailableModes(canPreviewDrafts: boolean): EventMode[] {
  return canPreviewDrafts
    ? ["upcoming", "history", "draft"]
    : ["upcoming", "history"];
}

Page({
  data: {
    modePanels: [
      createModePanel("upcoming"),
      createModePanel("history"),
    ] as EventModePanel[],
    activeMode: "history" as EventMode,
    activeModeIndex: 1,
    activeFilter: "all" as EventFilter,
    counts: { upcoming: 0, history: 0, draft: 0 },
    canPreviewDrafts: false,
    swiperHeight: 260,
    loading: true,
    loadFailed: false,
  },

  onLoad() {
    void this.loadInitialPage();
  },

  onShow() {
    void ensureSession().then(() =>
      trackEvent("event_list_view", "/pages/events/index"),
    ).catch(() => undefined);
  },

  onPullDownRefresh() {
    void this.refreshMode(
      this.data.activeMode,
      this.data.activeFilter,
      true,
    ).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    void this.loadMore();
  },

  retryLoad() {
    void this.loadInitialPage();
  },

  async loadInitialPage() {
    const currentRequest = ++requestVersion;
    this.setData({
      loading: true,
      loadFailed: false,
    });

    try {
      const catalog = await loadEvents({
        filter: this.data.activeFilter,
        limit: pageSize,
      });
      if (currentRequest !== requestVersion) return;

      const modes = getAvailableModes(catalog.canPreviewDrafts);
      const modePanels = modes.map((mode) =>
        mode === catalog.mode
          ? buildLoadedPanel(mode, catalog)
          : createModePanel(mode),
      );
      const activeModeIndex = modes.indexOf(catalog.mode);
      this.setData(
        {
          modePanels,
          activeModeIndex,
          activeMode: catalog.mode,
          activeFilter: catalog.filter,
          counts: catalog.counts,
          canPreviewDrafts: catalog.canPreviewDrafts,
          loading: false,
        },
        () => this.measureActivePanel(),
      );

      void this.preloadModePanels(
        modes.filter((mode) => mode !== catalog.mode),
        catalog.filter,
        currentRequest,
      );
    } catch {
      if (currentRequest !== requestVersion) return;
      this.setData({ loading: false, loadFailed: true });
    }
  },

  async preloadModePanels(
    modes: EventMode[],
    filter: EventFilter,
    currentRequest: number,
  ) {
    const results = await Promise.all(
      modes.map(async (mode) => {
        try {
          return {
            mode,
            catalog: await loadEvents({ mode, filter, limit: pageSize }),
          };
        } catch {
          return { mode, catalog: null };
        }
      }),
    );
    if (currentRequest !== requestVersion) return;

    const resultsByMode = new Map(results.map((result) => [result.mode, result]));
    const modePanels = this.data.modePanels.map((panel) => {
      const result = resultsByMode.get(panel.mode);
      if (!result) return panel;
      return result.catalog
        ? buildLoadedPanel(panel.mode, result.catalog)
        : createModePanel(panel.mode, { loading: false, loadFailed: true });
    });
    this.setData({ modePanels }, () => this.measureActivePanel());
  },

  updateModePanel(mode: EventMode, panel: EventModePanel) {
    const modePanels = this.data.modePanels.map((item) =>
      item.mode === mode ? panel : item,
    );
    this.setData({ modePanels }, () => {
      if (mode === this.data.activeMode) this.measureActivePanel();
    });
  },

  async refreshMode(
    mode: EventMode,
    filter: EventFilter,
    preserveContent = false,
  ) {
    const currentRequest = requestVersion;
    const currentPanel = this.data.modePanels.find((panel) => panel.mode === mode);
    if (!currentPanel) return;

    this.updateModePanel(
      mode,
      preserveContent
        ? { ...currentPanel, loadFailed: false }
        : createModePanel(mode),
    );

    try {
      const catalog = await loadEvents({ mode, filter, limit: pageSize });
      if (currentRequest !== requestVersion) return;
      this.setData({
        activeMode: catalog.mode,
        activeFilter: catalog.filter,
        counts: catalog.counts,
        canPreviewDrafts: catalog.canPreviewDrafts,
      });
      this.updateModePanel(mode, buildLoadedPanel(mode, catalog));
    } catch {
      if (currentRequest !== requestVersion) return;
      if (preserveContent) {
        this.updateModePanel(mode, currentPanel);
        void wx.showToast({ title: "刷新失败，请稍后重试", icon: "none" });
        return;
      }
      this.updateModePanel(
        mode,
        createModePanel(mode, { loading: false, loadFailed: true }),
      );
    }
  },

  async loadAllModePanels(filter: EventFilter) {
    const currentRequest = ++requestVersion;
    const modes = this.data.modePanels.map((panel) => panel.mode);
    this.setData({
      activeFilter: filter,
      modePanels: modes.map((mode) => createModePanel(mode)),
    }, () => this.measureActivePanel());

    const results = await Promise.all(
      modes.map(async (mode) => {
        try {
          return {
            mode,
            catalog: await loadEvents({ mode, filter, limit: pageSize }),
          };
        } catch {
          return { mode, catalog: null };
        }
      }),
    );
    if (currentRequest !== requestVersion) return;

    const successfulCatalog = results.find((result) => result.catalog)?.catalog;
    const modePanels = results.map((result) =>
      result.catalog
        ? buildLoadedPanel(result.mode, result.catalog)
        : createModePanel(result.mode, { loading: false, loadFailed: true }),
    );
    this.setData(
      {
        modePanels,
        ...(successfulCatalog ? { counts: successfulCatalog.counts } : {}),
      },
      () => this.measureActivePanel(),
    );
  },

  async loadMore() {
    const panel = this.data.modePanels.find(
      (item) => item.mode === this.data.activeMode,
    );
    if (!panel || panel.loading || panel.loadingMore || !panel.hasMore) return;
    const currentRequest = requestVersion;
    this.updateModePanel(this.data.activeMode, {
      ...panel,
      loadingMore: true,
    });

    try {
      const catalog = await loadEvents({
        mode: this.data.activeMode,
        filter: this.data.activeFilter,
        offset: panel.visibleEvents.length,
        limit: pageSize,
      });
      if (currentRequest !== requestVersion) return;
      const visibleEvents = [
        ...panel.visibleEvents,
        ...catalog.events.map(mapEvent),
      ];
      this.updateModePanel(panel.mode, {
        ...panel,
        visibleEvents,
        eventGroups: groupEvents(visibleEvents),
        hasMore: catalog.pagination.hasMore,
        loadingMore: false,
      });
    } catch {
      if (currentRequest !== requestVersion) return;
      this.updateModePanel(panel.mode, { ...panel, loadingMore: false });
      void wx.showToast({ title: "加载更多失败，请稍后重试", icon: "none" });
    }
  },

  switchMode(event: WechatMiniprogram.TouchEvent) {
    const mode = String(event.currentTarget.dataset.mode ?? "") as EventMode;
    const activeModeIndex = this.data.modePanels.findIndex(
      (panel) => panel.mode === mode,
    );
    if (activeModeIndex < 0 || activeModeIndex === this.data.activeModeIndex) return;
    this.setData({ activeModeIndex, activeMode: mode });
  },

  handleModeChange(
    event: WechatMiniprogram.CustomEvent<{ current: number }>,
  ) {
    const activeModeIndex = event.detail.current;
    const panel = this.data.modePanels[activeModeIndex];
    if (!panel) return;
    this.setData(
      { activeModeIndex, activeMode: panel.mode },
      () => this.measureActivePanel(),
    );
  },

  retryMode(event: WechatMiniprogram.TouchEvent) {
    const mode = String(event.currentTarget.dataset.mode ?? "") as EventMode;
    if (!this.data.modePanels.some((panel) => panel.mode === mode)) return;
    void this.refreshMode(mode, this.data.activeFilter);
  },

  measureActivePanel() {
    const panel = this.data.modePanels[this.data.activeModeIndex];
    if (!panel) return;
    wx.nextTick(() => {
      this.createSelectorQuery()
        .select(`#event-mode-panel-${panel.mode}`)
        .boundingClientRect((rect) => {
          if (!rect || Array.isArray(rect) || !rect.height) return;
          const swiperHeight = Math.ceil(rect.height);
          if (swiperHeight !== this.data.swiperHeight) {
            this.setData({ swiperHeight });
          }
        })
        .exec();
    });
  },

  switchFilter(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter ?? "") as EventFilter;
    if (filter !== "all" && filter !== "community" && filter !== "external") return;
    if (filter === this.data.activeFilter) return;
    void this.loadAllModePanels(filter);
  },

  openParticipantProfile(event: WechatMiniprogram.TouchEvent) {
    const handle = String(event.currentTarget.dataset.handle ?? "");
    const eventSlug = String(event.currentTarget.dataset.event ?? "");
    if (!handle || !eventSlug) return;
    void wx.navigateTo({
      url: `/pages/profile/shared/index?handle=${encodeURIComponent(
        handle,
      )}&event=${encodeURIComponent(eventSlug)}`,
    });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (slug) {
      void wx.navigateTo({ url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}` });
    }
  },
});
