import { ApiError, getStoredSessionToken } from "../../services/api";
import { trackEvent } from "../../services/analytics";
import { ensureSession, login } from "../../services/auth";
import { formatEventDate } from "../../services/events";
import { uploadAvatar } from "../../services/avatar";
import { getCommunityTags } from "../../utils/member-growth";
import { isMiniappBasicProfileReady } from "../../utils/profile-state";

type FootprintItem = MiniappUser["footprints"][number] & {
  dateLabel: string;
  locationLabel: string;
};

type LoginDestination = "account" | "profile" | "registrations";

const meShareImageUrl = "/assets/share/home-share-v7.jpg";

function readLoginDestination(
  event: WechatMiniprogram.TouchEvent,
): LoginDestination {
  const destination = String(event.currentTarget.dataset.destination ?? "");
  return ["account", "profile", "registrations"].includes(destination)
    ? (destination as LoginDestination)
    : "account";
}

function navigateAfterLogin(destination: LoginDestination, user: MiniappUser) {
  if (destination === "registrations") {
    return wx.navigateTo({ url: "/pages/registrations/index" });
  }
  if (destination === "account") {
    if (!isMiniappBasicProfileReady(user)) {
      return wx.navigateTo({ url: "/pages/profile/basic/index?intent=account" });
    }
    return user.capabilityProfileComplete
      ? undefined
      : wx.navigateTo({ url: "/pages/profile/edit/index" });
  }
  if (!isMiniappBasicProfileReady(user)) {
    return wx.navigateTo({ url: "/pages/profile/basic/index?intent=profile" });
  }
  return wx.navigateTo({
    url: user.capabilityProfileComplete
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
  },

  onLoad(options: Record<string, string | undefined>) {
    void wx.showShareMenu({
      menus: ["shareAppMessage", "shareTimeline"],
    });
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
      if (getStoredSessionToken()) {
        void this.loadAccount();
      }
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
    if (!this.data.user || !isMiniappBasicProfileReady(this.data.user)) {
      void wx.navigateTo({ url: "/pages/profile/basic/index?intent=profile" });
      return;
    }
    const completed = this.data.user.capabilityProfileComplete;
    void wx.navigateTo({
      url: completed ? "/pages/profile/index" : "/pages/profile/edit/index",
    });
  },

  confirmAvatarPrivacy() {
    return new Promise<boolean>((resolve) => {
      wx.showModal({
        title: "确认头像使用说明",
        content: "头像会用于社区账号、活动报名和成员资料展示。",
        confirmText: "同意并继续",
        success: (result) => resolve(result.confirm),
        fail: () => resolve(false),
      });
    });
  },

  async chooseAvatar(
    event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>,
  ) {
    const filePath = event.detail.avatarUrl;
    if (!filePath || this.data.avatarUploading) return;
    const user = this.data.user;
    if (!user) return;
    if (!user.privacyAccepted) {
      if (!(await this.confirmAvatarPrivacy())) return;
    }

    this.setData({ avatarUploading: true });
    try {
      const response = await uploadAvatar(
        filePath,
        user.privacyPolicyVersion,
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
    void wx.navigateTo({ url: "/pages/settings/index?edit=name" });
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (!slug) return;
    void wx.navigateTo({
      url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
    });
  },

  onShareAppMessage() {
    trackEvent("share_event", "/pages/me/index", {
      channel: "message",
    });
    return {
      title: "常州 AI Club｜我的社区成长记录",
      path: "/pages/me/index",
      imageUrl: meShareImageUrl,
    };
  },

  onShareTimeline() {
    trackEvent("share_event", "/pages/me/index", {
      channel: "timeline",
    });
    return {
      title: "常州 AI Club｜我的社区成长记录",
      imageUrl: meShareImageUrl,
    };
  },
});
