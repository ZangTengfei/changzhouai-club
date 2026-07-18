import {
  formatEventDate,
  loadEvents,
  type EventSummary,
} from "../../services/events";
import { loadGroupDigests, loadNews } from "../../services/content";
import { trackEvent } from "../../services/analytics";
import { ensureSession } from "../../services/auth";

type HomeEvent = EventSummary & {
  coverMode: "aspectFill" | "aspectFit";
  dateLabel: string;
  indexLabel: string;
  locationLabel: string;
};

type HomeNews = MiniappNewsItem & {
  metaLabel: string;
};

type HomeDigest = MiniappGroupDigest & {
  dateLabel: string;
  summaryLabel: string;
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
    featuredNews: null as HomeNews | null,
    latestDigest: null as HomeDigest | null,
    profileCompletion: null as MiniappProfileCompletion | null,
    loading: true,
    loadFailed: false,
  },

  onLoad() {
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
      void this.loadContentHighlights();
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

  async loadContentHighlights() {
    try {
      await ensureSession();
      const [news, digests] = await Promise.all([
        loadNews({ mode: "selected" }),
        loadGroupDigests(),
      ]);
      const firstNews = news.items[0] ?? null;
      const firstDigest = digests.items[0] ?? null;
      this.setData({
        featuredNews: firstNews
          ? {
              ...firstNews,
              metaLabel: `${firstNews.sourceName} · ${firstNews.categoryLabel}`,
            }
          : null,
        latestDigest: firstDigest
          ? {
              ...firstDigest,
              dateLabel: firstDigest.date.replace(/-/g, "."),
              summaryLabel:
                firstDigest.overview ||
                `整理了 ${firstDigest.highlightCount} 个讨论要点。`,
            }
          : null,
      });
    } catch {
      this.setData({ featuredNews: null, latestDigest: null });
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

  openNewsTab() {
    void wx.switchTab({ url: "/pages/news/index" });
  },

  openDigestList() {
    wx.setStorageSync("miniapp:news-section", "digest");
    void wx.switchTab({ url: "/pages/news/index" });
  },

  openGrowth() {
    void wx.navigateTo({ url: "/pages/growth/index" });
  },

  openNews(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    void wx.navigateTo({
      url: `/pages/news/detail/index?kind=news&id=${encodeURIComponent(id)}`,
    });
  },

  openDigest(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    void wx.navigateTo({
      url: `/pages/news/detail/index?kind=digest&id=${encodeURIComponent(id)}`,
    });
  },
});
