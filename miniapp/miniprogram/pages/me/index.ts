import { getStoredSessionToken } from "../../services/api";
import { ensureSession, login } from "../../services/auth";
import { formatEventDate } from "../../services/events";
import { getCommunityTags } from "../../utils/member-growth";

type FootprintItem = MiniappUser["footprints"][number] & {
  dateLabel: string;
  locationLabel: string;
};

function buildAccountViewData(user: MiniappUser) {
  const latestFootprint = user.footprints[0];

  return {
    user,
    avatarInitial: user.displayName.slice(0, 1) || "微",
    communityTags: getCommunityTags(user).slice(0, 2),
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
    communityTags: [] as MiniappUser["badges"],
    latestFootprint: null as FootprintItem | null,
    activitySummary: "",
    loading: true,
    loggingIn: false,
    loginRequired: false,
    loginFailed: false,
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

  async handleLogin() {
    if (this.data.loggingIn) return;
    this.setData({
      loggingIn: true,
      loginFailed: false,
    });

    try {
      const user = await login();
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        ...buildAccountViewData(user),
        loggingIn: false,
        loginRequired: false,
      });
      await wx.navigateTo({ url: "/pages/profile/edit/index" });
    } catch {
      this.setData({
        loggingIn: false,
        loginRequired: true,
        loginFailed: true,
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
