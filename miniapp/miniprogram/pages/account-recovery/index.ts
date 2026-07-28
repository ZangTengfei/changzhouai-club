import {
  confirmAccountRecovery,
  startAccountRecovery,
  verifyAccountRecovery,
} from "../../services/account-recovery";
import { ApiError } from "../../services/api";
import { ensureSession } from "../../services/auth";

type RecoveryStep = "email" | "code" | "preview";
type RecoveryChoice = "source" | "target";
type ChoiceField = "avatarUrl" | "displayName" | "wechat";

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.errorCode === "invalid_email") {
      return "请输入有效的旧账号邮箱。";
    }
    if (error.errorCode === "too_many_attempts") {
      return "请求次数较多，请一小时后再试。";
    }
    if (error.errorCode === "invalid_verification_code") {
      return "验证码无效或已经过期，请重新发送。";
    }
    if (error.errorCode === "recovery_not_available") {
      return "当前账号暂时不能继续找回，请联系社区协助处理。";
    }
    if (error.errorCode === "account_merge_failed") {
      return "账号合并没有完成，请稍后重试。";
    }
  }

  return "暂时无法完成操作，请检查网络后重试。";
}

function hasConflict(left: string | null, right: string | null) {
  return Boolean(left?.trim() && right?.trim() && left !== right);
}

Page({
  data: {
    step: "email" as RecoveryStep,
    email: "",
    code: "",
    recoveryToken: "",
    message: "",
    error: "",
    pending: false,
    preview: null as MiniappAccountRecoveryPreview | null,
    currentInitial: "微",
    oldInitial: "旧",
    displayNameConflict: false,
    avatarConflict: false,
    wechatConflict: false,
    choices: {
      displayName: "target" as RecoveryChoice,
      avatarUrl: "target" as RecoveryChoice,
      wechat: "target" as RecoveryChoice,
    },
  },

  onLoad() {
    void ensureSession().catch(() => {
      this.setData({ error: "登录状态已失效，请返回“我的”重新登录。" });
    });
  },

  handleEmailInput(event: WechatMiniprogram.Input) {
    this.setData({ email: event.detail.value, error: "", message: "" });
  },

  handleCodeInput(event: WechatMiniprogram.Input) {
    this.setData({
      code: event.detail.value.replace(/\D/g, "").slice(0, 6),
      error: "",
    });
  },

  async submitEmail() {
    if (this.data.pending) return;
    const email = this.data.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.setData({ error: "请输入有效的旧账号邮箱。" });
      return;
    }

    this.setData({ pending: true, error: "", message: "" });
    try {
      const response = await startAccountRecovery(email);
      this.setData({
        step: "code",
        email,
        recoveryToken: response.recoveryToken,
        message: response.message,
        pending: false,
      });
    } catch (error) {
      this.setData({ pending: false, error: getErrorMessage(error) });
    }
  },

  backToEmail() {
    if (this.data.pending) return;
    this.setData({
      step: "email",
      code: "",
      recoveryToken: "",
      message: "",
      error: "",
    });
  },

  async submitCode() {
    if (this.data.pending) return;
    if (!/^\d{6}$/.test(this.data.code)) {
      this.setData({ error: "请输入邮件里的 6 位数字验证码。" });
      return;
    }

    this.setData({ pending: true, error: "" });
    try {
      const { preview } = await verifyAccountRecovery({
        code: this.data.code,
        email: this.data.email,
        recoveryToken: this.data.recoveryToken,
      });
      this.setData({
        step: "preview",
        preview,
        pending: false,
        message: "",
        currentInitial:
          preview.currentAccount.displayName?.trim().slice(0, 1) || "微",
        oldInitial: preview.oldAccount.displayName?.trim().slice(0, 1) || "旧",
        displayNameConflict: hasConflict(
          preview.currentAccount.displayName,
          preview.oldAccount.displayName,
        ),
        avatarConflict: hasConflict(
          preview.currentAccount.avatarUrl,
          preview.oldAccount.avatarUrl,
        ),
        wechatConflict: hasConflict(
          preview.currentAccount.wechat,
          preview.oldAccount.wechat,
        ),
      });
    } catch (error) {
      this.setData({ pending: false, error: getErrorMessage(error) });
    }
  },

  chooseValue(event: WechatMiniprogram.TouchEvent) {
    const field = String(event.currentTarget.dataset.field ?? "") as ChoiceField;
    const value = String(event.currentTarget.dataset.value ?? "") as RecoveryChoice;
    if (
      !["avatarUrl", "displayName", "wechat"].includes(field) ||
      !["source", "target"].includes(value)
    ) {
      return;
    }
    this.setData({ [`choices.${field}`]: value });
  },

  async confirmMerge() {
    if (this.data.pending || !this.data.preview) return;
    this.setData({ pending: true, error: "" });
    try {
      const response = await confirmAccountRecovery({
        recoveryToken: this.data.recoveryToken,
        choices: this.data.choices,
      });
      getApp<IAppOption>().globalData.currentUser = response.user;
      await wx.showToast({ title: "旧账号已找回", icon: "success" });
      await wx.reLaunch({ url: "/pages/me/index" });
    } catch (error) {
      this.setData({ pending: false, error: getErrorMessage(error) });
    }
  },
});
