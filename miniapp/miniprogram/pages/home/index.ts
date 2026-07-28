import {
  formatEventDate,
  loadEvents,
  type EventSummary,
} from "../../services/events";
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

function getCoverMode(url: string | null): "aspectFill" | "aspectFit" {
  return url && /poster|layout|challenge|registration/i.test(url)
    ? "aspectFit"
    : "aspectFill";
}

Page({
  data: {
    greeting: getGreeting(),
    greetingName: "朋友",
    avatarUrl: "",
    avatarInitial: "微",
    memberIdentity: "社区成员",
    attendanceSummary: "参与记录会在这里更新",
    upcomingCount: 0,
    featuredEvent: null as HomeEvent | null,
    events: [] as HomeEvent[],
    briefDate: formatBriefDate(),
    eventSectionTitle: "最近记录",
    eventSectionHint: "查看全部活动",
    profileCompletion: null as MiniappProfileCompletion | null,
    loading: true,
    loadFailed: false,
  },

  onLoad() {
    void wx.showShareMenu({
      menus: ["shareAppMessage", "shareTimeline"],
    });
    void ensureSession()
      .then(() => trackEvent("home_view", "/pages/home/index"))
      .catch(() => undefined);
    void this.loadPage();
  },

  onShow() {
    void this.loadProfileProgress();
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
        upcomingCount: catalog.counts.upcoming,
        featuredEvent: mappedEvents[0] ?? null,
        events: mappedEvents.slice(1),
        eventSectionTitle: showingHistory ? "最近回顾" : "接下来发生",
        eventSectionHint: showingHistory
          ? `查看全部 ${catalog.counts.history} 场`
          : "查看全部活动",
        loading: false,
      });
    } catch {
      this.setData({
        upcomingCount: 0,
        featuredEvent: null,
        events: [],
        loading: false,
        loadFailed: true,
      });
    }
  },

  async loadProfileProgress() {
    try {
      const user = await ensureSession();
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        profileCompletion: user.profileCompletion,
        greetingName: user.displayName || "朋友",
        avatarUrl: user.avatarUrl || "",
        avatarInitial: user.displayName.slice(0, 1) || "微",
        memberIdentity: user.identityLabel || "社区成员",
        attendanceSummary: user.stats.attendanceCount
          ? `已真实到场 ${user.stats.attendanceCount} 次`
          : "完成第一次真实参与",
      });
    } catch {
      this.setData({ profileCompletion: null });
    }
  },

  openProfile() {
    void wx.navigateTo({ url: "/pages/profile/edit/index" });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (slug) {
      void wx.navigateTo({
        url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
      });
    }
  },

  openEvents() {
    void wx.switchTab({ url: "/pages/events/index" });
  },

  openGrowth() {
    void wx.navigateTo({ url: "/pages/growth/index" });
  },

  onShareAppMessage() {
    trackEvent("share_event", "/pages/home/index", {
      channel: "message",
    });
    return {
      title: "常州 AI Club｜和有趣的人一起做点新东西",
      path: "/pages/home/index",
    };
  },

  onShareTimeline() {
    trackEvent("share_event", "/pages/home/index", {
      channel: "timeline",
    });
    return {
      title: "常州 AI Club｜和有趣的人一起做点新东西",
    };
  },
});
