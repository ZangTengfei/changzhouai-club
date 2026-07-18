import { ensureSession } from "../../services/auth";
import { formatEventDate } from "../../services/events";
import { getHonorBadges } from "../../utils/member-growth";

type FootprintItem = MiniappUser["footprints"][number] & {
  dateLabel: string;
  locationLabel: string;
};

function formatJoinedAt(value: string | null) {
  if (!value) return "加入时间待补充";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "加入时间待补充";
  return `${date.getFullYear()}年${date.getMonth() + 1}月加入社区`;
}

Page({
  data: {
    user: null as MiniappUser | null,
    avatarInitial: "微",
    honorTags: [] as MiniappUser["badges"],
    latestFootprint: null as FootprintItem | null,
    joinedLabel: "",
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
    }
  },

  onShow() {
    if (this.data.suppressAutoLogin) {
      this.setData({ suppressAutoLogin: false });
      return;
    }
    void this.loadAccount();
  },

  async loadAccount() {
    this.setData({ loading: true, loginFailed: false, loggedOut: false });

    try {
      const user = await ensureSession();
      const latestFootprint = user.footprints[0];
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        user,
        avatarInitial: user.displayName.slice(0, 1) || "微",
        honorTags: getHonorBadges(user).slice(0, 2),
        joinedLabel: formatJoinedAt(user.joinedAt),
        latestFootprint: latestFootprint
          ? {
              ...latestFootprint,
              dateLabel: formatEventDate(latestFootprint.event_at),
              locationLabel:
                latestFootprint.venue || latestFootprint.city || "常州",
            }
          : null,
        activitySummary: `${user.stats.registrationCount} 次报名 · ${user.stats.attendanceCount} 次到场`,
        loading: false,
      });
    } catch {
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
    void wx.navigateTo({ url: "/pages/profile/edit/index" });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (!slug) return;
    void wx.navigateTo({
      url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
    });
  },
});
