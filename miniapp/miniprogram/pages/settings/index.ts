import { ensureSession, logout } from "../../services/auth";
import { ApiError } from "../../services/api";
import { bindPhoneNumber } from "../../services/contact";

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
    accountRecoveryAvailable: false,
    phoneBound: false,
    phoneMasked: "",
    phoneBinding: false,
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
        accountRecoveryAvailable: user.accountRecoveryAvailable,
        phoneBound: user.phoneBound,
        phoneMasked: user.phoneMasked ?? "",
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

  openAccountRecovery() {
    void wx.navigateTo({ url: "/pages/account-recovery/index" });
  },

  async bindPhoneNumber(
    event: WechatMiniprogram.CustomEvent<{ code?: string; errMsg?: string }>,
  ) {
    const code = event.detail.code?.trim() ?? "";
    if (!code || this.data.phoneBinding) {
      if (!code) {
        void wx.showToast({ title: "未授权手机号", icon: "none" });
      }
      return;
    }

    this.setData({ phoneBinding: true });
    try {
      const { user } = await bindPhoneNumber(code);
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        phoneBinding: false,
        phoneBound: user.phoneBound,
        phoneMasked: user.phoneMasked ?? "",
      });
      void wx.showToast({ title: "手机号已绑定", icon: "success" });
    } catch (error) {
      this.setData({ phoneBinding: false });
      if (
        error instanceof ApiError &&
        error.errorCode === "privacy_consent_required"
      ) {
        void wx.showModal({
          title: "请先确认隐私说明",
          content: "确认基础隐私说明后，才能授权绑定手机号。",
          confirmText: "去确认",
          success: (result) => {
            if (result.confirm) {
              void wx.navigateTo({ url: "/pages/profile/edit/index?step=0" });
            }
          },
        });
        return;
      }
      void wx.showToast({ title: "手机号绑定失败，请重试", icon: "none" });
    }
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
