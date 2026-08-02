import { ensureSession } from "../../../services/auth";
import { trackEvent } from "../../../services/analytics";
import { ApiError } from "../../../services/api";
import { loadProfile, updateProfile } from "../../../services/profile";
import { isMiniappBasicProfileReady } from "../../../utils/profile-state";

type SelectableTag = {
  label: string;
  selected: boolean;
};

const steps = [
  {
    index: 0,
    label: "身份",
    title: "基本身份",
    hint: "补充你所在的地区、当前身份和个人介绍",
  },
  {
    index: 1,
    label: "能力",
    title: "行业与能力",
    hint: "用标签说明你的经验和擅长方向",
  },
  {
    index: 2,
    label: "连接",
    title: "可提供与需要",
    hint: "告诉大家你能提供什么、正在寻找什么",
  },
  {
    index: 3,
    label: "预览",
    title: "名片预览",
    hint: "确认资料并查看社区名片效果",
  },
];

function splitTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,，\n、]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function getProfileSaveFailureMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "保存失败，请重试";
  if (error.errorCode === "invalid_profile") {
    return "资料格式有误，请检查后重试";
  }
  if (error.statusCode === 401) return "登录已失效，请重新登录";
  if (error.statusCode === 0) return "网络异常，请稍后重试";
  return "保存失败，请重试";
}

function buildSelectableTags(options: string[], selected: string[]) {
  return Array.from(new Set([...options, ...selected])).map((label) => ({
    label,
    selected: selected.includes(label),
  }));
}

function getInitialStep(profile: MiniappProfile) {
  const missing = new Set(profile.completion.missingItems);

  if (["城市/辖区", "当前身份"].some((item) => missing.has(item))) {
    return 0;
  }
  if (["行业方向", "擅长方向"].some((item) => missing.has(item))) {
    return 1;
  }
  if (missing.has("可提供能力或当前需要")) {
    return 2;
  }
  return 0;
}

function getStepState(currentStep: number) {
  return {
    currentStep,
    currentStepTitle: steps[currentStep].title,
    currentStepHint: steps[currentStep].hint,
  };
}

function readRequestedStep(value: string | undefined) {
  const step = Number(value);
  return Number.isInteger(step) && step >= 0 && step < steps.length
    ? step
    : undefined;
}

Page({
  data: {
    steps,
    currentStep: 0,
    currentStepTitle: steps[0].title,
    currentStepHint: steps[0].hint,
    stepSwiperHeight: 620,
    loading: true,
    saving: false,
    loadFailed: false,
    displayName: "",
    wechat: "",
    city: "常州",
    roleLabel: "",
    organization: "",
    cityOptions: [] as string[],
    roleOptions: [] as string[],
    customCity: "",
    customRoleLabel: "",
    bio: "",
    industryTags: [] as string[],
    skills: [] as string[],
    interests: [] as string[],
    capabilitySummary: "",
    seekingSummary: "",
    industryOptions: [] as string[],
    skillOptions: [] as string[],
    industryOptionItems: [] as SelectableTag[],
    skillOptionItems: [] as SelectableTag[],
    customIndustry: "",
    customSkill: "",
    privacyAccepted: false,
    privacyPolicyVersion: "",
    avatarUrl: null as string | null,
    avatarInitial: "微",
    completion: null as MiniappProfileCompletion | null,
    profileCompleteBefore: false,
    registrationIntent: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    this.setData({
      registrationIntent: options.intent === "event_registration",
    });
    void this.loadPage(readRequestedStep(options.step));
  },

  async loadPage(requestedStep?: number) {
    this.setData({ loading: true, loadFailed: false });
    try {
      const user = await ensureSession();
      if (!isMiniappBasicProfileReady(user)) {
        this.setData({ loading: false });
        await wx.redirectTo({
          url: this.data.registrationIntent
            ? "/pages/profile/basic/index?intent=event_registration"
            : "/pages/profile/basic/index?intent=profile",
        });
        return;
      }
      const { profile, options } = await loadProfile();
      const currentStep = requestedStep ?? getInitialStep(profile);
      this.setData({
        loading: false,
        currentStep,
        currentStepTitle: steps[currentStep].title,
        currentStepHint: steps[currentStep].hint,
        displayName: profile.displayName,
        wechat: profile.wechat,
        city: profile.city,
        roleLabel: profile.roleLabel,
        organization: profile.organization,
        cityOptions: Array.from(
          new Set([...options.cities, profile.city].filter(Boolean)),
        ),
        roleOptions: Array.from(
          new Set([...options.roles, profile.roleLabel].filter(Boolean)),
        ),
        bio: profile.bio,
        industryTags: profile.industryTags,
        skills: profile.skills,
        interests: profile.interests,
        capabilitySummary: profile.capabilitySummary,
        seekingSummary: profile.seekingSummary,
        industryOptions: options.industries,
        skillOptions: options.skills,
        industryOptionItems: buildSelectableTags(
          options.industries,
          profile.industryTags,
        ),
        skillOptionItems: buildSelectableTags(options.skills, profile.skills),
        privacyAccepted: profile.privacyAccepted,
        privacyPolicyVersion: profile.privacyPolicyVersion,
        avatarUrl: profile.avatarUrl,
        avatarInitial: profile.displayName.slice(0, 1) || "微",
        completion: profile.completion,
        profileCompleteBefore: profile.completion.completed,
      });
      this.measureActiveStep();
      void wx.setNavigationBarTitle({
        title: profile.completion.completed ? "编辑社区名片" : "完善社区名片",
      });
      trackEvent("profile_started", "/pages/profile/edit/index", {
        completion: profile.completion.percent,
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  handleInput(
    event: WechatMiniprogram.Input | WechatMiniprogram.TextareaInput,
  ) {
    const field = String(event.currentTarget.dataset.field ?? "");
    if (!field) return;
    this.setData({
      [field]: event.detail.value,
    });
  },

  selectProfileOption(event: WechatMiniprogram.TouchEvent) {
    const field = String(event.currentTarget.dataset.field ?? "");
    const value = String(event.currentTarget.dataset.value ?? "").trim();
    if (!value || !["city", "roleLabel"].includes(field)) {
      return;
    }
    this.setData({ [field]: value });
  },

  addCustomCity() {
    const value = this.data.customCity.trim();
    if (!value) return;
    this.setData({
      city: value,
      cityOptions: Array.from(new Set([...this.data.cityOptions, value])),
      customCity: "",
    });
    this.measureActiveStep();
  },

  addCustomRoleLabel() {
    const value = this.data.customRoleLabel.trim();
    if (!value) return;
    this.setData({
      roleLabel: value,
      roleOptions: Array.from(new Set([...this.data.roleOptions, value])),
      customRoleLabel: "",
    });
    this.measureActiveStep();
  },

  handlePrivacyChange(event: WechatMiniprogram.CheckboxGroupChange) {
    this.setData({ privacyAccepted: event.detail.value.includes("accepted") });
  },

  toggleTag(event: WechatMiniprogram.TouchEvent) {
    const field = String(event.currentTarget.dataset.field ?? "");
    const value = String(event.currentTarget.dataset.value ?? "").trim();
    if (!value || !["industryTags", "skills"].includes(field)) return;

    const selected = [...(this.data[field as "industryTags" | "skills"] ?? [])];
    const nextSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];

    if (field === "industryTags") {
      if (nextSelected.length > 8) {
        void wx.showToast({ title: "最多选择 8 个行业", icon: "none" });
        return;
      }
      this.setData({
        industryTags: nextSelected,
        industryOptionItems: buildSelectableTags(
          this.data.industryOptions,
          nextSelected,
        ),
      });
      return;
    }

    this.setData({
      skills: nextSelected,
      skillOptionItems: buildSelectableTags(
        this.data.skillOptions,
        nextSelected,
      ),
    });
  },

  addCustomIndustry() {
    const values = splitTags(this.data.customIndustry);
    if (values.length === 0) return;
    const industryTags = Array.from(
      new Set([...this.data.industryTags, ...values]),
    );
    if (industryTags.length > 8) {
      void wx.showToast({ title: "最多选择 8 个行业", icon: "none" });
      return;
    }
    this.setData({
      industryTags,
      customIndustry: "",
      industryOptionItems: buildSelectableTags(
        this.data.industryOptions,
        industryTags,
      ),
    });
    this.measureActiveStep();
  },

  addCustomSkill() {
    const values = splitTags(this.data.customSkill);
    if (values.length === 0) return;
    const skills = Array.from(new Set([...this.data.skills, ...values])).slice(
      0,
      20,
    );
    this.setData({
      skills,
      customSkill: "",
      skillOptionItems: buildSelectableTags(this.data.skillOptions, skills),
    });
    this.measureActiveStep();
  },

  openPrivacy() {
    void wx.navigateTo({ url: "/pages/privacy/index" });
  },

  validateStep(step: number) {
    if (step === 0) {
      if (!this.data.city.trim() || !this.data.roleLabel.trim()) {
        void wx.showToast({ title: "请完成带星号的资料", icon: "none" });
        return false;
      }
      if (!this.data.privacyAccepted) {
        void wx.showToast({ title: "请先同意隐私说明", icon: "none" });
        return false;
      }
    }

    if (
      step === 1 &&
      (this.data.industryTags.length === 0 || this.data.skills.length === 0)
    ) {
      void wx.showToast({ title: "请选择行业和擅长方向", icon: "none" });
      return false;
    }

    if (
      step === 2 &&
      !this.data.capabilitySummary.trim() &&
      !this.data.seekingSummary.trim()
    ) {
      void wx.showToast({ title: "请填写可提供能力或当前需要", icon: "none" });
      return false;
    }

    return true;
  },

  buildPayload(makePublic = false): MiniappProfileUpdate {
    return {
      displayName: this.data.displayName.trim(),
      wechat: this.data.wechat.trim(),
      city: this.data.city.trim() || "常州",
      roleLabel: this.data.roleLabel.trim(),
      organization: this.data.organization.trim(),
      bio: this.data.bio.trim(),
      industryTags: this.data.industryTags,
      skills: this.data.skills,
      interests: this.data.interests,
      capabilitySummary: this.data.capabilitySummary.trim(),
      seekingSummary: this.data.seekingSummary.trim(),
      ...(makePublic ? { isPubliclyVisible: true } : {}),
      privacyAccepted: true,
    };
  },

  async persistProfile(makePublic = false) {
    const response = await updateProfile(this.buildPayload(makePublic));
    getApp<IAppOption>().globalData.currentUser = response.user;
    this.setData({ completion: response.profile.completion });
    return response;
  },

  goPrevious() {
    if (this.data.saving || this.data.currentStep === 0) return;
    this.setCurrentStep(this.data.currentStep - 1);
  },

  goToStep(event: WechatMiniprogram.TouchEvent) {
    if (this.data.saving) return;
    const currentStep = Number(event.currentTarget.dataset.step);
    if (!Number.isInteger(currentStep) || !steps[currentStep]) return;
    this.setCurrentStep(currentStep);
  },

  handleStepChange(
    event: WechatMiniprogram.CustomEvent<{ current: number }>,
  ) {
    if (this.data.saving) return;
    const currentStep = event.detail.current;
    if (!Number.isInteger(currentStep) || !steps[currentStep]) return;
    this.setCurrentStep(currentStep);
  },

  setCurrentStep(currentStep: number) {
    this.setData(getStepState(currentStep), () => this.measureActiveStep());
  },

  measureActiveStep() {
    wx.nextTick(() => {
      this.createSelectorQuery()
        .select(`#profile-step-panel-${this.data.currentStep}`)
        .boundingClientRect((rect) => {
          if (!rect || Array.isArray(rect) || !rect.height) return;
          const stepSwiperHeight = Math.ceil(rect.height);
          if (stepSwiperHeight !== this.data.stepSwiperHeight) {
            this.setData({ stepSwiperHeight });
          }
        })
        .exec();
    });
  },

  async handlePrimaryAction() {
    if (this.data.saving) return;

    if (this.data.currentStep === steps.length - 1) {
      await this.saveProfile();
      return;
    }

    if (!this.validateStep(this.data.currentStep)) return;
    this.setData({ saving: true });
    try {
      const response = await this.persistProfile();
      trackEvent("profile_step_completed", "/pages/profile/edit/index", {
        step: this.data.currentStep + 1,
        completion: response.profile.completion.percent,
      });
      const currentStep = this.data.currentStep + 1;
      this.setCurrentStep(currentStep);
    } catch (error) {
      void wx.showToast({
        title: getProfileSaveFailureMessage(error),
        icon: "none",
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  async saveProfile() {
    for (let step = 0; step <= 2; step += 1) {
      if (!this.validateStep(step)) {
        this.setCurrentStep(step);
        return;
      }
    }

    this.setData({ saving: true });
    try {
      const response = await this.persistProfile(true);
      if (!response.profile.completion.completed) {
        this.setCurrentStep(getInitialStep(response.profile));
        void wx.showToast({ title: "请补全社区名片", icon: "none" });
        return;
      }
      trackEvent("profile_saved", "/pages/profile/edit/index", {
        completion: response.profile.completion.percent,
      });
      trackEvent(
        this.data.profileCompleteBefore
          ? "profile_updated"
          : "profile_completed",
        "/pages/profile/edit/index",
        { completion: response.profile.completion.percent },
      );
      void wx.showToast({ title: "社区名片已完成", icon: "success" });
      if (this.data.registrationIntent) {
        setTimeout(() => void wx.navigateBack(), 500);
        return;
      }
      setTimeout(
        () => void wx.redirectTo({ url: "/pages/profile/index" }),
        500,
      );
    } catch (error) {
      void wx.showToast({
        title: getProfileSaveFailureMessage(error),
        icon: "none",
      });
    } finally {
      this.setData({ saving: false });
    }
  },
});
