import { ApiError } from "../../services/api";
import { login } from "../../services/auth";
import { isMiniappBasicProfileReady } from "../../utils/profile-state";

type LoginIntent =
  | "event_registration"
  | "profile"
  | "growth"
  | "registrations"
  | "community";

function readLoginIntent(value: string | undefined): LoginIntent {
  return [
    "event_registration",
    "profile",
    "growth",
    "registrations",
    "community",
  ].includes(value ?? "")
    ? (value as LoginIntent)
    : "profile";
}

function getLoginCopy(intent: LoginIntent, eventTitle: string) {
  if (intent === "event_registration") {
    return {
      title: "登录后继续报名",
      copy: eventTitle
        ? `登录后可继续报名“${eventTitle}”`
        : "登录后可继续完成活动报名",
    };
  }
  if (intent === "growth") {
    return {
      title: "登录后查看社区徽章",
      copy: "查看成员身份、参与记录和社区标签",
    };
  }
  if (intent === "registrations") {
    return {
      title: "登录后查看我的活动",
      copy: "查看报名、审核、候补与签到记录",
    };
  }
  if (intent === "community") {
    return {
      title: "登录后预约社区空间",
      copy: "选择流动工位、预约会议室或提交门禁卡申领记录",
    };
  }
  return {
    title: "登录后查看社区名片",
    copy: "继续完善或查看你的社区名片",
  };
}

Page({
  data: {
    intent: "profile" as LoginIntent,
    eventTitle: "",
    title: "登录后继续",
    copy: "使用微信登录社区账号",
    loggingIn: false,
    loginFailed: false,
    loginRequestId: "",
  },

  onLoad(options: Record<string, string | undefined>) {
    const intent = readLoginIntent(options.intent);
    const eventTitle = options.title ? decodeURIComponent(options.title) : "";
    this.setData({ intent, eventTitle, ...getLoginCopy(intent, eventTitle) });
  },

  async handleLogin() {
    if (this.data.loggingIn) return;
    this.setData({ loggingIn: true, loginFailed: false, loginRequestId: "" });
    try {
      const user = await login();
      getApp<IAppOption>().globalData.currentUser = user;
      this.continueAfterLogin(user);
    } catch (error) {
      this.setData({
        loggingIn: false,
        loginFailed: true,
        loginRequestId:
          error instanceof ApiError && error.requestId ? error.requestId : "",
      });
    }
  },

  continueAfterLogin(user: MiniappUser) {
    const intent = this.data.intent;
    if (intent === "event_registration") {
      if (!isMiniappBasicProfileReady(user)) {
        void wx.redirectTo({
          url: "/pages/profile/basic/index?intent=event_registration",
        });
        return;
      }
      if (!user.capabilityProfileComplete) {
        void wx.redirectTo({
          url: "/pages/profile/edit/index?intent=event_registration",
        });
        return;
      }
      void wx.navigateBack();
      return;
    }

    if (intent === "profile") {
      if (!isMiniappBasicProfileReady(user)) {
        void wx.redirectTo({ url: "/pages/profile/basic/index?intent=profile" });
        return;
      }
      void wx.redirectTo({
        url: user.capabilityProfileComplete
          ? "/pages/profile/index"
          : "/pages/profile/edit/index",
      });
      return;
    }

    void wx.navigateBack();
  },

  openPrivacy() {
    void wx.navigateTo({ url: "/pages/privacy/index" });
  },

  goBack() {
    void wx.navigateBack();
  },
});
