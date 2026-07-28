import { ensureSession } from "../../services/auth";
import { trackEvent } from "../../services/analytics";
import { loadProfile, updateProfile } from "../../services/profile";

const PAGE_PATH = "/pages/intro/index";

function splitItems(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,，\n、]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function parseSeekingSummary(value: string) {
  const match = value.match(/^AI 需求：([\s\S]*?)\n想认识：([\s\S]*)$/);
  if (!match) return { aiNeed: value, connectionTarget: "" };
  return {
    aiNeed: match[1].trim(),
    connectionTarget: match[2].trim(),
  };
}

function buildSeekingSummary(aiNeed: string, connectionTarget: string) {
  return `AI 需求：${aiNeed.trim()}\n想认识：${connectionTarget.trim()}`;
}

function buildIntroduction(input: {
  displayName: string;
  city: string;
  roleLabel: string;
  industryText: string;
  projectSummary: string;
  aiNeed: string;
  connectionTarget: string;
  capabilitySummary: string;
}) {
  const lines = [
    `大家好，我是${input.displayName.trim()}，在${input.city.trim()}，目前的身份是${input.roleLabel.trim()}。`,
    input.industryText.trim()
      ? `所在行业：${input.industryText.trim()}`
      : "",
    input.projectSummary.trim()
      ? `正在做的产品 / 项目 / 品牌：${input.projectSummary.trim()}`
      : "",
    `目前对 AI 的核心需求：${input.aiNeed.trim()}`,
    `想认识：${input.connectionTarget.trim()}`,
    input.capabilitySummary.trim()
      ? `我可以提供：${input.capabilitySummary.trim()}`
      : "",
    "很高兴加入常州 AI 社区，欢迎大家交流～",
  ];

  return lines.filter(Boolean).join("\n");
}

function copyText(text: string) {
  return new Promise<void>((resolve, reject) => {
    wx.setClipboardData({
      data: text,
      success: () => resolve(),
      fail: reject,
    });
  });
}

Page({
  data: {
    profile: null as MiniappProfile | null,
    loading: true,
    loadFailed: false,
    saving: false,
    saved: false,
    displayName: "",
    wechat: "",
    city: "常州",
    roleLabel: "",
    industryText: "",
    projectSummary: "",
    aiNeed: "",
    connectionTarget: "",
    capabilitySummary: "",
    privacyAccepted: false,
    introText: "",
  },

  onLoad() {
    void this.loadPage();
  },

  async loadPage() {
    this.setData({ loading: true, loadFailed: false });
    try {
      await ensureSession();
      const { profile } = await loadProfile();
      const seeking = parseSeekingSummary(profile.seekingSummary);
      const values = {
        displayName: profile.displayName,
        wechat: profile.wechat,
        city: profile.city,
        roleLabel: profile.roleLabel,
        industryText: profile.industryTags.join("、"),
        projectSummary: profile.bio,
        aiNeed: seeking.aiNeed,
        connectionTarget: seeking.connectionTarget,
        capabilitySummary: profile.capabilitySummary,
      };

      this.setData({
        profile,
        ...values,
        privacyAccepted: profile.privacyAccepted,
        introText: buildIntroduction(values),
        loading: false,
      });
      trackEvent("newcomer_intro_started", PAGE_PATH);
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  handleInput(
    event: WechatMiniprogram.Input | WechatMiniprogram.TextareaInput,
  ) {
    const field = String(event.currentTarget.dataset.field ?? "");
    if (!field) return;
    const nextData = { [field]: event.detail.value, saved: false };
    this.setData(nextData, () => this.refreshIntroduction());
  },

  handlePrivacyChange(event: WechatMiniprogram.CheckboxGroupChange) {
    this.setData({
      privacyAccepted: event.detail.value.includes("accepted"),
      saved: false,
    });
  },

  refreshIntroduction() {
    this.setData({
      introText: buildIntroduction({
        displayName: this.data.displayName,
        city: this.data.city,
        roleLabel: this.data.roleLabel,
        industryText: this.data.industryText,
        projectSummary: this.data.projectSummary,
        aiNeed: this.data.aiNeed,
        connectionTarget: this.data.connectionTarget,
        capabilitySummary: this.data.capabilitySummary,
      }),
    });
  },

  openPrivacy() {
    void wx.navigateTo({ url: "/pages/privacy/index" });
  },

  validate() {
    const requiredValues = [
      this.data.displayName,
      this.data.wechat,
      this.data.city,
      this.data.roleLabel,
      this.data.industryText,
      this.data.aiNeed,
      this.data.connectionTarget,
    ];
    if (requiredValues.some((value) => !value.trim())) {
      void wx.showToast({ title: "请完成带星号的内容", icon: "none" });
      return false;
    }
    const industryTags = splitItems(this.data.industryText);
    if (
      industryTags.length > 8 ||
      industryTags.some((item) => item.length > 40)
    ) {
      void wx.showToast({ title: "行业最多 8 项，每项不超过 40 字", icon: "none" });
      return false;
    }
    if (!this.data.privacyAccepted) {
      void wx.showToast({ title: "请先同意隐私说明", icon: "none" });
      return false;
    }
    return true;
  },

  buildPayload(): MiniappProfileUpdate | null {
    const profile = this.data.profile;
    if (!profile) return null;

    return {
      displayName: this.data.displayName.trim(),
      wechat: this.data.wechat.trim(),
      city: this.data.city.trim(),
      roleLabel: this.data.roleLabel.trim(),
      organization: profile.organization,
      monthlyTime: profile.monthlyTime,
      bio: this.data.projectSummary.trim(),
      industryTags: splitItems(this.data.industryText),
      skills: profile.skills,
      interests: profile.interests,
      capabilitySummary: this.data.capabilitySummary.trim(),
      seekingSummary: buildSeekingSummary(
        this.data.aiNeed,
        this.data.connectionTarget,
      ),
      willingToAttend: profile.willingToAttend,
      willingToShare: profile.willingToShare,
      willingToJoinProjects: profile.willingToJoinProjects,
      isPubliclyVisible: profile.isPubliclyVisible,
      privacyAccepted: true,
    };
  },

  async saveAndCopy() {
    if (this.data.saving || !this.validate()) return;
    const payload = this.buildPayload();
    if (!payload) return;

    this.setData({ saving: true });
    let saved = false;
    try {
      const response = await updateProfile(payload);
      saved = true;
      getApp<IAppOption>().globalData.currentUser = response.user;
      this.setData({ profile: response.profile, saved: true });
      trackEvent("newcomer_intro_saved", PAGE_PATH, {
        profileCompletion: response.profile.completion.percent,
      });
      await copyText(this.data.introText);
      trackEvent("newcomer_intro_copied", PAGE_PATH);
      void wx.showToast({ title: "已保存并复制", icon: "success" });
    } catch {
      void wx.showToast({
        title: saved ? "资料已保存，复制失败" : "保存失败，请重试",
        icon: "none",
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  onShareAppMessage() {
    trackEvent("share_newcomer_intro_entry", PAGE_PATH);
    return {
      title: "常州 AI Club｜填写并复制群内自我介绍",
      path: PAGE_PATH,
    };
  },
});
