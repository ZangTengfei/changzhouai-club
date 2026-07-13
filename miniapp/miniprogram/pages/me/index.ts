import { ensureSession, logout } from "../../services/auth";
import { formatEventDate } from "../../services/events";

type FootprintItem = MiniappUser["footprints"][number] & {
  dateLabel: string;
  locationLabel: string;
};

function formatJoinedAt(value: string | null) {
  if (!value) return "加入时间待补充";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "加入时间待补充";
  return `${date.getFullYear()}年${date.getMonth() + 1}月加入`;
}

Page({
  data: {
    user: null as MiniappUser | null,
    avatarInitial: "微",
    linkedChannels: [] as string[],
    joinedLabel: "",
    footprints: [] as FootprintItem[],
    loading: true,
    loginFailed: false,
    loggedOut: false,
  },

  onShow() {
    void this.loadAccount();
  },

  async loadAccount() {
    this.setData({ loading: true, loginFailed: false, loggedOut: false });

    try {
      const user = await ensureSession();
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        user,
        avatarInitial: user.displayName.slice(0, 1) || "微",
        linkedChannels: user.channels
          .filter((channel) => channel !== "mini_program")
          .map((channel) =>
            channel === "website"
              ? "网站微信登录"
              : channel === "official_account"
                ? "服务号网页登录"
                : channel,
          ),
        joinedLabel: formatJoinedAt(user.joinedAt),
        footprints: user.footprints.map((footprint) => ({
          ...footprint,
          dateLabel: formatEventDate(footprint.event_at),
          locationLabel: footprint.venue || footprint.city || "常州",
        })),
        loading: false,
      });
    } catch {
      this.setData({ user: null, loading: false, loginFailed: true });
    }
  },

  async handleLogout() {
    await logout();
    getApp<IAppOption>().globalData.currentUser = null;
    this.setData({
      user: null,
      avatarInitial: "微",
      linkedChannels: [],
      joinedLabel: "",
      footprints: [],
      loginFailed: false,
      loggedOut: true,
    });
  },

  openProfile() {
    void wx.navigateTo({ url: "/pages/profile/edit/index" });
  },

  openRegistrations() {
    void wx.navigateTo({ url: "/pages/registrations/index" });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (!slug) return;
    void wx.navigateTo({
      url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
    });
  },
});
