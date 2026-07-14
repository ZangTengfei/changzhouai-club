import { ensureSession, logout } from "../../services/auth";

const channelLabels: Record<string, string> = {
  mini_program: "微信小程序",
  official_account: "服务号网页登录",
  website: "网站微信登录",
};

Page({
  data: {
    displayName: "",
    linkedChannels: [] as string[],
    loading: true,
    loadFailed: false,
    submitting: false,
  },

  onShow() {
    void this.loadSettings();
  },

  async loadSettings() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const user = await ensureSession();
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        displayName: user.displayName,
        linkedChannels: user.channels.map(
          (channel) => channelLabels[channel] ?? channel,
        ),
        loading: false,
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  openProfile() {
    void wx.navigateTo({ url: "/pages/profile/edit/index" });
  },

  openPrivacy() {
    void wx.navigateTo({ url: "/pages/privacy/index" });
  },

  handleLogout() {
    if (this.data.submitting) return;
    void wx.showModal({
      title: "退出当前账号",
      content: "退出后，下次进入时可以重新使用微信登录。",
      confirmText: "确认退出",
      success: (result) => {
        if (result.confirm) void this.confirmLogout();
      },
    });
  },

  async confirmLogout() {
    this.setData({ submitting: true });
    try {
      await logout();
      getApp<IAppOption>().globalData.currentUser = null;
      await wx.reLaunch({ url: "/pages/me/index?loggedOut=1" });
    } catch {
      void wx.showToast({ title: "退出失败，请重试", icon: "none" });
      this.setData({ submitting: false });
    }
  },
});
