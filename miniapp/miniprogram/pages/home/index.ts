import {
  formatEventDate,
  getEventRegistrationTags,
  loadEvents,
  type EventSummary,
} from "../../services/events";
import { trackEvent } from "../../services/analytics";
import { getStoredSessionToken } from "../../services/api";
import { ensureSession } from "../../services/auth";
import { isMiniappBasicProfileReady } from "../../utils/profile-state";

type HomeEvent = EventSummary & {
  coverMode: "aspectFill" | "aspectFit";
  dateLabel: string;
  indexLabel: string;
  locationLabel: string;
  registrationTags: ReturnType<typeof getEventRegistrationTags>;
};

const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const homeShareImageUrl = "/assets/share/home-share-v5.jpg";

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
    avatarInitial: "我",
    isLoggedIn: Boolean(getStoredSessionToken()),
    basicProfileReady: false,
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
      const catalog = await loadEvents({ limit: 4 });
      const showingHistory = catalog.mode === "history";
      const mappedEvents = catalog.events.map((event, index) => ({
        ...event,
        coverMode: getCoverMode(event.cover_image_url),
        dateLabel: formatEventDate(event.event_at),
        indexLabel: String(index + 1).padStart(2, "0"),
        locationLabel: event.venue || event.city || "常州",
        registrationTags: getEventRegistrationTags(event),
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
        avatarInitial: user.displayName.slice(0, 1) || "我",
        isLoggedIn: true,
        basicProfileReady: isMiniappBasicProfileReady(user),
      });
    } catch {
      const isLoggedIn = Boolean(getStoredSessionToken());
      this.setData({
        profileCompletion: null,
        isLoggedIn,
        ...(!isLoggedIn
          ? {
              greetingName: "朋友",
              avatarUrl: "",
              basicProfileReady: false,
            }
          : {}),
      });
    }
  },

  openProfile() {
    if (!getStoredSessionToken()) {
      void wx.navigateTo({ url: "/pages/login/index?intent=profile" });
      return;
    }

    if (!this.data.basicProfileReady) {
      void wx.navigateTo({ url: "/pages/profile/basic/index?intent=profile" });
      return;
    }

    const completed = this.data.profileCompletion?.completed ?? false;
    void wx.navigateTo({
      url: completed ? "/pages/profile/index" : "/pages/profile/edit/index",
    });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (slug) {
      void wx.navigateTo({
        url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
      });
    }
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

  openEvents() {
    void wx.switchTab({ url: "/pages/events/index" });
  },

  onShareAppMessage() {
    trackEvent("share_event", "/pages/home/index", {
      channel: "message",
    });
    return {
      title: "常州 AI Club｜连接常州 AI 实践者，一起把想法做成作品",
      path: "/pages/home/index",
      imageUrl: homeShareImageUrl,
    };
  },

  onShareTimeline() {
    trackEvent("share_event", "/pages/home/index", {
      channel: "timeline",
    });
    return {
      title: "常州 AI Club｜连接常州 AI 实践者，一起把想法做成作品",
      imageUrl: homeShareImageUrl,
    };
  },
});
