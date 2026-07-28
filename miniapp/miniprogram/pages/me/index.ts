import { ensureSession } from "../../services/auth";
import { formatEventDate } from "../../services/events";
import { getHonorBadges } from "../../utils/member-growth";

type FootprintItem = MiniappUser["footprints"][number] & {
  dateLabel: string;
  locationLabel: string;
};

function buildAccountViewData(user: MiniappUser) {
  const latestFootprint = user.footprints[0];

  return {
    user,
    avatarInitial: user.displayName.slice(0, 1) || "微",
    honorTags: getHonorBadges(user).slice(0, 2),
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
    honorTags: [] as MiniappUser["badges"],
    latestFootprint: null as FootprintItem | null,
    activitySummary: "",
    loading: true,
    loginFailed: false,
    loggedOut: false,
    suppressAutoLogin: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    if (options.loggedOut === "1") {
      this.setData({
        loading: false,
        loggedOut: true,
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
      });
    }

    void this.loadAccount();
  },

  async loadAccount() {
    const hasVisibleUser = Boolean(this.data.user);
    this.setData({
      loading: !hasVisibleUser,
      loginFailed: false,
      loggedOut: false,
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
