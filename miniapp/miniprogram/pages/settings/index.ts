import { ensureSession, logout } from "../../services/auth";
import { ApiError } from "../../services/api";
import { uploadAvatar } from "../../services/avatar";
import { bindPhoneNumber } from "../../services/contact";
import {
  acceptPrivacyPolicy,
  updateDisplayName,
} from "../../services/profile";

const channelLabels: Record<string, string> = {
  mini_program: "微信小程序",
  official_account: "服务号网页登录",
  website: "网站微信登录",
};

let nameBlurTimer: ReturnType<typeof setTimeout> | null = null;
let nameEditActionPending = false;

function clearNameBlurTimer() {
  if (nameBlurTimer === null) return;
  clearTimeout(nameBlurTimer);
  nameBlurTimer = null;
}

function confirmPrivacyConsent(content: string) {
  return new Promise<boolean>((resolve) => {
    wx.showModal({
      title: "确认隐私说明",
      content,
      confirmText: "同意并继续",
      success: (result) => resolve(result.confirm),
      fail: () => resolve(false),
    });
  });
}

Page({
  data: {
    user: null as MiniappUser | null,
    avatarInitial: "微",
    linkedChannels: [] as string[],
    loading: true,
    loadFailed: false,
    submitting: false,
    accountRecoveryAvailable: false,
    phoneBound: false,
    phoneMasked: "",
    phoneBinding: false,
    avatarUploading: false,
    nameEditing: false,
    nameEditRequested: false,
    displayNameDraft: "",
    displayNameSaving: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    this.setData({ nameEditRequested: options.edit === "name" });
  },

  onShow() {
    void this.loadSettings();
  },

  onUnload() {
    clearNameBlurTimer();
    nameEditActionPending = false;
  },

  async loadSettings() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const user = await ensureSession();
      const nameEditing = this.data.nameEditRequested;
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        user,
        avatarInitial: user.displayName.slice(0, 1) || "微",
        linkedChannels: user.channels.map(
          (channel) => channelLabels[channel] ?? channel,
        ),
        accountRecoveryAvailable: user.accountRecoveryAvailable,
        phoneBound: user.phoneBound,
        phoneMasked: user.phoneMasked ?? "",
        nameEditing,
        nameEditRequested: false,
        displayNameDraft: nameEditing ? user.displayName : "",
        loading: false,
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  async acceptCurrentPrivacy(content: string) {
    const user = this.data.user;
    if (!user) return null;
    if (user.privacyAccepted) return user;
    if (!(await confirmPrivacyConsent(content))) return null;
    try {
      const response = await acceptPrivacyPolicy(user.privacyPolicyVersion);
      getApp<IAppOption>().globalData.currentUser = response.user;
      this.setData({ user: response.user });
      return response.user;
    } catch {
      void wx.showToast({ title: "隐私确认失败，请重试", icon: "none" });
      return null;
    }
  },

  async chooseAvatar(
    event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>,
  ) {
    const filePath = event.detail.avatarUrl;
    if (!filePath || this.data.avatarUploading) return;
    const user = this.data.user;
    if (!user) return;
    if (
      !user.privacyAccepted &&
      !(await confirmPrivacyConsent(
        "头像会用于社区账号、活动报名和成员资料展示。",
      ))
    ) {
      return;
    }

    this.setData({ avatarUploading: true });
    try {
      const response = await uploadAvatar(filePath, user.privacyPolicyVersion);
      getApp<IAppOption>().globalData.currentUser = response.user;
      this.setData({
        user: response.user,
        avatarInitial: response.user.displayName.slice(0, 1) || "微",
      });
      void wx.showToast({ title: "头像已更新", icon: "success" });
    } catch {
      void wx.showToast({ title: "头像更新失败，请重试", icon: "none" });
    } finally {
      this.setData({ avatarUploading: false });
    }
  },

  openNameEditor() {
    const user = this.data.user;
    if (!user) return;
    clearNameBlurTimer();
    nameEditActionPending = false;
    this.setData({
      nameEditing: true,
      displayNameDraft: user.displayName,
    });
  },

  cancelNameEdit() {
    if (this.data.displayNameSaving) return;
    clearNameBlurTimer();
    nameEditActionPending = false;
    this.setData({
      nameEditing: false,
      displayNameDraft: this.data.user?.displayName ?? "",
    });
  },

  handleNameInput(event: WechatMiniprogram.Input) {
    this.setData({ displayNameDraft: event.detail.value });
  },

  handleNameBlur() {
    clearNameBlurTimer();
    if (nameEditActionPending) return;
    nameBlurTimer = setTimeout(() => {
      nameBlurTimer = null;
      if (this.data.displayNameSaving || !this.data.nameEditing) return;
      this.setData({
        nameEditing: false,
        displayNameDraft: this.data.user?.displayName ?? "",
      });
    }, 120);
  },

  prepareNameEditAction() {
    clearNameBlurTimer();
    nameEditActionPending = true;
  },

  cancelNameEditAction() {
    nameEditActionPending = false;
    this.handleNameBlur();
  },

  async saveDisplayName() {
    clearNameBlurTimer();
    nameEditActionPending = false;
    const displayName = this.data.displayNameDraft.trim();
    if (!displayName || displayName === "微信用户") {
      void wx.showToast({ title: "请输入有效昵称", icon: "none" });
      return;
    }
    if (this.data.displayNameSaving) return;
    if (displayName === this.data.user?.displayName) {
      this.setData({ nameEditing: false });
      return;
    }

    this.setData({ displayNameSaving: true });
    try {
      const response = await updateDisplayName(displayName);
      getApp<IAppOption>().globalData.currentUser = response.user;
      this.setData({
        user: response.user,
        avatarInitial: response.user.displayName.slice(0, 1) || "微",
        displayNameSaving: false,
        nameEditing: false,
      });
      void wx.showToast({ title: "昵称已更新", icon: "success" });
    } catch (error) {
      this.setData({ displayNameSaving: false });
      void wx.showToast({
        title:
          error instanceof ApiError &&
          error.errorCode === "invalid_display_name"
            ? "请输入有效昵称"
            : "昵称更新失败，请重试",
        icon: "none",
      });
    }
  },

  async preparePhoneBinding() {
    const user = await this.acceptCurrentPrivacy(
      "手机号仅用于活动组织中的必要联系，不会在公开成员页面展示。",
    );
    if (user) {
      void wx.showToast({ title: "请再次点击授权手机号", icon: "none" });
    }
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
        user,
        phoneBinding: false,
        phoneBound: user.phoneBound,
        phoneMasked: user.phoneMasked ?? "",
      });
      void wx.showToast({ title: "手机号已绑定", icon: "success" });
    } catch (error) {
      this.setData({ phoneBinding: false });
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
