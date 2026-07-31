import { ensureSession } from "../../../services/auth";
import { trackEvent } from "../../../services/analytics";
import { uploadAvatar } from "../../../services/avatar";
import { ApiError } from "../../../services/api";
import { loadProfile, updateProfile } from "../../../services/profile";

type SelectableTag = {
  label: string;
  selected: boolean;
};

const steps = [
  {
    index: 0,
    label: "身份",
    title: "基本身份",
    hint: "让社区知道如何称呼和联系你",
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
    label: "公开",
    title: "档案预览",
    hint: "确认公开范围并查看成员卡效果",
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

function isDisplayNameReady(value: string) {
  const displayName = value.trim();
  return Boolean(displayName && displayName !== "微信用户");
}

function getAvatarFailureMessage(error: unknown) {
  if (!(error instanceof ApiError)) return "头像上传失败，请重试";
  if (error.errorCode === "invalid_avatar") {
    return "请选择 10MB 内的图片";
  }
  if (error.statusCode === 401) return "登录已失效，请重新登录";
  if (error.statusCode === 0) return "网络异常，请稍后重试";
  return "头像上传失败，请重试";
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

  if (
    ["昵称", "微信号", "城市/辖区", "当前身份"].some((item) =>
      missing.has(item),
    )
  ) {
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
    loading: true,
    saving: false,
    loadFailed: false,
    displayName: "",
    wechat: "",
    city: "常州",
    roleLabel: "",
    organization: "",
    monthlyTime: "",
    cityOptions: [] as string[],
    roleOptions: [] as string[],
    monthlyTimeOptions: [] as string[],
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
    willingToAttend: true,
    willingToShare: false,
    willingToJoinProjects: false,
    isPubliclyVisible: true,
    privacyAccepted: false,
    privacyPolicyVersion: "",
    avatarUrl: null as string | null,
    avatarInitial: "微",
    avatarUploading: false,
    completion: null as MiniappProfileCompletion | null,
    profileCompleteBefore: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    void this.loadPage(readRequestedStep(options.step));
  },

  async loadPage(requestedStep?: number) {
    this.setData({ loading: true, loadFailed: false });
    try {
      await ensureSession();
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
        monthlyTime: profile.monthlyTime,
        cityOptions: Array.from(
          new Set([...options.cities, profile.city].filter(Boolean)),
        ),
        roleOptions: Array.from(
          new Set([...options.roles, profile.roleLabel].filter(Boolean)),
        ),
        monthlyTimeOptions: Array.from(
          new Set(
            [...options.monthlyTimes, profile.monthlyTime].filter(Boolean),
          ),
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
        willingToAttend: profile.willingToAttend,
        willingToShare: profile.willingToShare,
        willingToJoinProjects: profile.willingToJoinProjects,
        isPubliclyVisible: profile.completion.completed
          ? profile.isPubliclyVisible
          : true,
        privacyAccepted: profile.privacyAccepted,
        privacyPolicyVersion: profile.privacyPolicyVersion,
        avatarUrl: profile.avatarUrl,
        avatarInitial: profile.displayName.slice(0, 1) || "微",
        completion: profile.completion,
        profileCompleteBefore: profile.completion.completed,
      });
      void wx.setNavigationBarTitle({
        title: profile.completion.completed ? "编辑能力档案" : "完善能力档案",
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
      ...(field === "displayName"
        ? { avatarInitial: event.detail.value.trim().slice(0, 1) || "微" }
        : {}),
    });
  },

  handleSwitch(event: WechatMiniprogram.SwitchChange) {
    const field = String(event.currentTarget.dataset.field ?? "");
    if (field) this.setData({ [field]: event.detail.value });
  },

  selectProfileOption(event: WechatMiniprogram.TouchEvent) {
    const field = String(event.currentTarget.dataset.field ?? "");
    const value = String(event.currentTarget.dataset.value ?? "").trim();
    if (!value || !["city", "roleLabel", "monthlyTime"].includes(field)) {
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
  },

  addCustomRoleLabel() {
    const value = this.data.customRoleLabel.trim();
    if (!value) return;
    this.setData({
      roleLabel: value,
      roleOptions: Array.from(new Set([...this.data.roleOptions, value])),
      customRoleLabel: "",
    });
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
  },

  openPrivacy() {
    void wx.navigateTo({ url: "/pages/privacy/index" });
  },

  async chooseAvatar(
    event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>,
  ) {
    const filePath = event.detail.avatarUrl;
    if (!filePath || this.data.avatarUploading) return;
    if (!this.data.privacyAccepted) {
      void wx.showToast({ title: "请先同意隐私说明", icon: "none" });
      return;
    }

    this.setData({ avatarUploading: true });
    try {
      const response = await uploadAvatar(
        filePath,
        this.data.privacyPolicyVersion,
      );
      getApp<IAppOption>().globalData.currentUser = response.user;
      this.setData({ avatarUrl: response.avatarUrl });
      void wx.showToast({ title: "头像已更新", icon: "success" });
    } catch (error) {
      void wx.showToast({
        title: getAvatarFailureMessage(error),
        icon: "none",
      });
    } finally {
      this.setData({ avatarUploading: false });
    }
  },

  validateStep(step: number) {
    if (step === 0) {
      if (
        !isDisplayNameReady(this.data.displayName) ||
        !this.data.wechat.trim() ||
        !this.data.city.trim() ||
        !this.data.roleLabel.trim()
      ) {
        void wx.showToast({
          title:
            this.data.displayName.trim() === "微信用户"
              ? "请设置真实昵称"
              : "请完成带星号的资料",
          icon: "none",
        });
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

  buildPayload(includeVisibility = false): MiniappProfileUpdate {
    return {
      displayName: this.data.displayName.trim(),
      wechat: this.data.wechat.trim(),
      city: this.data.city.trim() || "常州",
      roleLabel: this.data.roleLabel.trim(),
      organization: this.data.organization.trim(),
      monthlyTime: this.data.monthlyTime.trim(),
      bio: this.data.bio.trim(),
      industryTags: this.data.industryTags,
      skills: this.data.skills,
      interests: this.data.interests,
      capabilitySummary: this.data.capabilitySummary.trim(),
      seekingSummary: this.data.seekingSummary.trim(),
      willingToAttend: this.data.willingToAttend,
      willingToShare: this.data.willingToShare,
      willingToJoinProjects: this.data.willingToJoinProjects,
      ...(includeVisibility
        ? { isPubliclyVisible: this.data.isPubliclyVisible }
        : {}),
      privacyAccepted: true,
    };
  },

  async persistProfile(includeVisibility = false) {
    const response = await updateProfile(this.buildPayload(includeVisibility));
    getApp<IAppOption>().globalData.currentUser = response.user;
    this.setData({ completion: response.profile.completion });
    return response;
  },

  goPrevious() {
    if (this.data.saving || this.data.currentStep === 0) return;
    const currentStep = this.data.currentStep - 1;
    this.setData(getStepState(currentStep));
  },

  goToStep(event: WechatMiniprogram.TouchEvent) {
    if (this.data.saving) return;
    const currentStep = Number(event.currentTarget.dataset.step);
    if (!Number.isInteger(currentStep) || !steps[currentStep]) return;
    this.setData(getStepState(currentStep));
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
      this.setData(getStepState(currentStep));
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
        this.setData(getStepState(step));
        return;
      }
    }

    this.setData({ saving: true });
    try {
      const response = await this.persistProfile(true);
      if (!response.profile.completion.completed) {
        this.setData(getStepState(getInitialStep(response.profile)));
        void wx.showToast({ title: "请补全能力档案", icon: "none" });
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
      void wx.showToast({ title: "能力档案已完成", icon: "success" });
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
