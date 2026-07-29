import { ApiError, getStoredSessionToken } from "../../services/api";
import { ensureSession, login } from "../../services/auth";
import { formatEventDate } from "../../services/events";
import { getCommunityTags } from "../../utils/member-growth";

type FootprintItem = MiniappUser["footprints"][number] & {
  dateLabel: string;
  locationLabel: string;
};

type LoginDestination = "profile" | "growth" | "registrations";

function readLoginDestination(
  event: WechatMiniprogram.TouchEvent,
): LoginDestination {
  const destination = String(event.currentTarget.dataset.destination ?? "");
  return ["growth", "registrations"].includes(destination)
    ? (destination as LoginDestination)
    : "profile";
}

function navigateAfterLogin(destination: LoginDestination, user: MiniappUser) {
  if (destination === "growth") {
    return wx.navigateTo({ url: "/pages/growth/index" });
  }
  if (destination === "registrations") {
    return wx.navigateTo({ url: "/pages/registrations/index" });
  }
  return wx.navigateTo({
    url: user.profileCompletion.completed
      ? "/pages/profile/index"
      : "/pages/profile/edit/index",
  });
}

function buildAccountViewData(user: MiniappUser) {
  const latestFootprint = user.footprints[0];
  const communityTags = getCommunityTags(user);

  return {
    user,
    avatarInitial: user.displayName.slice(0, 1) || "微",
    visibleCommunityTags: communityTags.slice(0, 2),
    communityTagOverflowCount: Math.max(communityTags.length - 2, 0),
    latestFootprint: latestFootprint
      ? {
          ...latestFootprint,
          dateLabel: formatEventDate(latestFootprint.event_at),
          locationLabel: latestFootprint.venue || latestFootprint.city || "常州",
        }
      : null,
    activitySummary: `${user.stats.registrationCount} 次报名 · ${user.stats.attendanceCount} 次到场`,
  };
}

Page({
  data: {
    user: null as MiniappUser | null,
    avatarInitial: "微",
    visibleCommunityTags: [] as MiniappUser["badges"],
    communityTagOverflowCount: 0,
    latestFootprint: null as FootprintItem | null,
    activitySummary: "",
    loading: true,
    loggingIn: false,
    loginRequired: false,
    loginFailed: false,
    loginRequestId: "",
    suppressAutoLogin: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    if (options.loggedOut === "1") {
      this.setData({
        loading: false,
        loginRequired: true,
        suppressAutoLogin: true,
      });
      return;
    }

    const cachedUser = getApp<IAppOption>().globalData.currentUser;
    if (cachedUser) {
      this.setData({
        ...buildAccountViewData(cachedUser),
        loading: false,
      });
      return;
    }

    if (!getStoredSessionToken()) {
      this.setData({ loading: false, loginRequired: true });
    }
  },

  onShow() {
    if (this.data.suppressAutoLogin) {
      this.setData({ suppressAutoLogin: false });
      return;
    }

    const cachedUser = getApp<IAppOption>().globalData.currentUser;
    if (cachedUser) {
      this.setData({
        ...buildAccountViewData(cachedUser),
        loading: false,
        loginRequired: false,
      });
      return;
    }

    if (getStoredSessionToken()) {
      void this.loadAccount();
    } else {
      this.setData({ loading: false, loginRequired: true });
    }
  },

  async loadAccount() {
    const hasVisibleUser = Boolean(this.data.user);
    this.setData({
      loading: !hasVisibleUser,
      loginRequired: false,
      loginFailed: false,
    });

    try {
      const user = await ensureSession();
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        ...buildAccountViewData(user),
        loading: false,
      });
    } catch {
      if (hasVisibleUser) {
        this.setData({ loading: false });
        void wx.showToast({ title: "刷新失败，已显示上次资料", icon: "none" });
        return;
      }

      this.setData({ user: null, loading: false, loginFailed: true });
    }
  },

  async handleLogin(event: WechatMiniprogram.TouchEvent) {
    if (this.data.loggingIn) return;
    const destination = readLoginDestination(event);
    this.setData({
      loggingIn: true,
      loginFailed: false,
      loginRequestId: "",
    });

    try {
      const user = await login();
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        ...buildAccountViewData(user),
        loggingIn: false,
        loginRequired: false,
      });
      await navigateAfterLogin(destination, user);
    } catch (error) {
      this.setData({
        loggingIn: false,
        loginRequired: true,
        loginFailed: true,
        loginRequestId:
          error instanceof ApiError && error.requestId ? error.requestId : "",
      });
    }
  },

  openRegistrations() {
    void wx.navigateTo({ url: "/pages/registrations/index" });
  },

  openSettings() {
    void wx.navigateTo({ url: "/pages/settings/index" });
  },

  openEvents() {
    void wx.switchTab({ url: "/pages/events/index" });
  },

  openGrowth() {
    void wx.navigateTo({ url: "/pages/growth/index" });
  },

  openProfile() {
    const completed = this.data.user?.profileCompletion.completed ?? false;
    void wx.navigateTo({
      url: completed ? "/pages/profile/index" : "/pages/profile/edit/index",
    });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (!slug) return;
    void wx.navigateTo({
      url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
    });
  },
});
