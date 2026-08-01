import { ApiError, getStoredSessionToken } from "../../services/api";
import { ensureSession, login } from "../../services/auth";
import { formatEventDate } from "../../services/events";
import { uploadAvatar } from "../../services/avatar";
import { updateDisplayName } from "../../services/profile";
import { getCommunityTags } from "../../utils/member-growth";

type FootprintItem = MiniappUser["footprints"][number] & {
  dateLabel: string;
  locationLabel: string;
};

type LoginDestination = "account" | "profile" | "growth" | "registrations";

function readLoginDestination(
  event: WechatMiniprogram.TouchEvent,
): LoginDestination {
  const destination = String(event.currentTarget.dataset.destination ?? "");
  return ["account", "profile", "growth", "registrations"].includes(destination)
    ? (destination as LoginDestination)
    : "account";
}

function navigateAfterLogin(destination: LoginDestination, user: MiniappUser) {
  if (destination === "growth") {
    return wx.navigateTo({ url: "/pages/growth/index" });
  }
  if (destination === "registrations") {
    return wx.navigateTo({ url: "/pages/registrations/index" });
  }
  if (destination === "account") {
    return user.profileCompletion.completed
      ? undefined
      : wx.navigateTo({ url: "/pages/profile/edit/index" });
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
    avatarUploading: false,
    nameEditorOpen: false,
    displayNameDraft: "",
    displayNameSaving: false,
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

  ensureAvatarPrivacyAccepted() {
    if (this.data.user?.privacyAccepted) return true;
    void wx.showModal({
      title: "请先确认隐私说明",
      content: "头像、昵称和联系方式的使用范围需要先由你确认。",
      confirmText: "去确认",
      success: (result) => {
        if (result.confirm) {
          void wx.navigateTo({ url: "/pages/profile/edit/index?step=0" });
        }
      },
    });
    return false;
  },

  async chooseAvatar(
    event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>,
  ) {
    const filePath = event.detail.avatarUrl;
    if (!filePath || this.data.avatarUploading) return;
    if (!this.ensureAvatarPrivacyAccepted() || !this.data.user) return;

    this.setData({ avatarUploading: true });
    try {
      const response = await uploadAvatar(
        filePath,
        this.data.user.privacyPolicyVersion,
      );
      getApp<IAppOption>().globalData.currentUser = response.user;
      this.setData({
        ...buildAccountViewData(response.user),
        avatarUploading: false,
      });
      void wx.showToast({ title: "头像已更新", icon: "success" });
    } catch (error) {
      this.setData({ avatarUploading: false });
      const message =
        error instanceof ApiError &&
        error.errorCode === "privacy_consent_required"
          ? "请先确认隐私说明"
          : "头像更新失败，请重试";
      void wx.showToast({ title: message, icon: "none" });
    }
  },

  openNameEditor() {
    if (!this.data.user) return;
    this.setData({
      nameEditorOpen: true,
      displayNameDraft: this.data.user.displayName,
    });
  },

  closeNameEditor() {
    if (this.data.displayNameSaving) return;
    this.setData({ nameEditorOpen: false });
  },

  keepNameEditorOpen() {},

  handleNameInput(event: WechatMiniprogram.Input) {
    this.setData({ displayNameDraft: event.detail.value });
  },

  async saveDisplayName() {
    const displayName = this.data.displayNameDraft.trim();
    if (!displayName || displayName === "微信用户") {
      void wx.showToast({ title: "请输入有效昵称", icon: "none" });
      return;
    }
    if (this.data.displayNameSaving) return;

    this.setData({ displayNameSaving: true });
    try {
      const { user } = await updateDisplayName(displayName);
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        ...buildAccountViewData(user),
        displayNameSaving: false,
        nameEditorOpen: false,
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

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (!slug) return;
    void wx.navigateTo({
      url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
    });
  },
});
