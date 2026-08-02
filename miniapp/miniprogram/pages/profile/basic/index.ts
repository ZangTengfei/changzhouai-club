import { ApiError } from "../../../services/api";
import { ensureSession } from "../../../services/auth";
import { uploadAvatar } from "../../../services/avatar";
import { updateDisplayName } from "../../../services/profile";
import { isMiniappBasicProfileReady } from "../../../utils/profile-state";

type BasicProfileIntent =
  | "event_registration"
  | "profile"
  | "account"
  | "community";

function readIntent(value: string | undefined): BasicProfileIntent {
  return ["event_registration", "profile", "account", "community"].includes(
    value ?? "",
  )
    ? (value as BasicProfileIntent)
    : "account";
}

function confirmPrivacyConsent() {
  return new Promise<boolean>((resolve) => {
    wx.showModal({
      title: "确认头像使用说明",
      content: "头像会用于你的社区账号、活动报名和成员资料展示。",
      confirmText: "同意并继续",
      success: (result) => resolve(result.confirm),
      fail: () => resolve(false),
    });
  });
}

Page({
  data: {
    intent: "account" as BasicProfileIntent,
    user: null as MiniappUser | null,
    displayNameDraft: "",
    avatarInitial: "微",
    loading: true,
    loadFailed: false,
    saving: false,
    avatarUploading: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    this.setData({ intent: readIntent(options.intent) });
    void this.loadPage();
  },

  async loadPage() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const user = await ensureSession();
      getApp<IAppOption>().globalData.currentUser = user;
      this.showUser(user);
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  showUser(user: MiniappUser) {
    this.setData({
      user,
      displayNameDraft: user.displayName,
      avatarInitial: user.displayName.slice(0, 1) || "微",
      loading: false,
      loadFailed: false,
    });
  },

  handleNameInput(event: WechatMiniprogram.Input) {
    const displayNameDraft = event.detail.value;
    this.setData({
      displayNameDraft,
      avatarInitial: displayNameDraft.trim().slice(0, 1) || "微",
    });
  },

  async chooseAvatar(
    event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>,
  ) {
    const filePath = event.detail.avatarUrl;
    const currentUser = this.data.user;
    if (!filePath || !currentUser || this.data.avatarUploading) return;

    const user = currentUser;
    if (!user.privacyAccepted) {
      if (!(await confirmPrivacyConsent())) return;
    }

    this.setData({ avatarUploading: true });
    try {
      const response = await uploadAvatar(filePath, user.privacyPolicyVersion);
      getApp<IAppOption>().globalData.currentUser = response.user;
      this.showUser(response.user);
      void wx.showToast({ title: "头像已更新", icon: "success" });
    } catch {
      void wx.showToast({ title: "头像更新失败，请重试", icon: "none" });
    } finally {
      this.setData({ avatarUploading: false });
    }
  },

  async saveAndContinue() {
    const displayName = this.data.displayNameDraft.trim();
    if (!displayName || displayName === "微信用户") {
      void wx.showToast({ title: "请输入有效昵称", icon: "none" });
      return;
    }
    if (this.data.saving) return;

    this.setData({ saving: true });
    try {
      const response = await updateDisplayName(displayName);
      getApp<IAppOption>().globalData.currentUser = response.user;
      this.continueAfterSave(response.user);
    } catch (error) {
      this.setData({ saving: false });
      void wx.showToast({
        title:
          error instanceof ApiError &&
          error.errorCode === "invalid_display_name"
            ? "请输入有效昵称"
            : "昵称保存失败，请重试",
        icon: "none",
      });
    }
  },

  continueAfterSave(user: MiniappUser) {
    if (!isMiniappBasicProfileReady(user)) {
      this.setData({ saving: false });
      void wx.showToast({ title: "请设置有效昵称", icon: "none" });
      return;
    }
    if (!user.capabilityProfileComplete) {
      void wx.redirectTo({
        url:
          this.data.intent === "event_registration"
            ? "/pages/profile/edit/index?intent=event_registration"
            : "/pages/profile/edit/index",
      });
      return;
    }
    if (this.data.intent === "profile") {
      void wx.redirectTo({ url: "/pages/profile/index" });
      return;
    }
    void wx.navigateBack();
  },

  openPrivacy() {
    void wx.navigateTo({ url: "/pages/privacy/index" });
  },
});
