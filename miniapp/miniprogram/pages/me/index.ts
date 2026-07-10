import { ensureSession, logout } from "../../services/auth";

Page({
  data: {
    user: null as MiniappUser | null,
    avatarInitial: "微",
    linkedChannels: [] as string[],
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
      loginFailed: false,
      loggedOut: true,
    });
  },
});
