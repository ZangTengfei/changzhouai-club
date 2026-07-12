import { ensureSession } from "../../../services/auth";
import { trackEvent } from "../../../services/analytics";
import { uploadAvatar } from "../../../services/avatar";
import { loadProfile, updateProfile } from "../../../services/profile";

function splitTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

Page({
  data: {
    loading: true,
    saving: false,
    loadFailed: false,
    displayName: "",
    wechat: "",
    city: "常州",
    roleLabel: "",
    organization: "",
    monthlyTime: "",
    bio: "",
    skillsText: "",
    interestsText: "",
    willingToAttend: true,
    willingToShare: false,
    willingToJoinProjects: false,
    privacyAccepted: false,
    privacyPolicyVersion: "",
    avatarUrl: null as string | null,
    avatarUploading: false,
  },

  onLoad() {
    void this.loadPage();
  },

  async loadPage() {
    this.setData({ loading: true, loadFailed: false });
    try {
      await ensureSession();
      const profile = await loadProfile();
      this.setData({
        loading: false,
        displayName: profile.displayName,
        wechat: profile.wechat,
        city: profile.city,
        roleLabel: profile.roleLabel,
        organization: profile.organization,
        monthlyTime: profile.monthlyTime,
        bio: profile.bio,
        skillsText: profile.skills.join("、"),
        interestsText: profile.interests.join("、"),
        willingToAttend: profile.willingToAttend,
        willingToShare: profile.willingToShare,
        willingToJoinProjects: profile.willingToJoinProjects,
        privacyAccepted: profile.privacyAccepted,
        privacyPolicyVersion: profile.privacyPolicyVersion,
        avatarUrl: profile.avatarUrl,
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  handleInput(event: WechatMiniprogram.Input) {
    const field = String(event.currentTarget.dataset.field ?? "");
    if (field) this.setData({ [field]: event.detail.value });
  },

  handleSwitch(event: WechatMiniprogram.SwitchChange) {
    const field = String(event.currentTarget.dataset.field ?? "");
    if (field) this.setData({ [field]: event.detail.value });
  },

  handlePrivacyChange(event: WechatMiniprogram.CheckboxGroupChange) {
    this.setData({ privacyAccepted: event.detail.value.includes("accepted") });
  },

  openPrivacy() {
    void wx.navigateTo({ url: "/pages/privacy/index" });
  },

  async chooseAvatar(event: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
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
    } catch {
      void wx.showToast({ title: "头像上传失败", icon: "none" });
    } finally {
      this.setData({ avatarUploading: false });
    }
  },

  async saveProfile() {
    if (this.data.saving) return;
    if (!this.data.displayName.trim() || !this.data.wechat.trim()) {
      void wx.showToast({ title: "请填写昵称和微信号", icon: "none" });
      return;
    }
    if (!this.data.privacyAccepted) {
      void wx.showToast({ title: "请先同意隐私说明", icon: "none" });
      return;
    }

    this.setData({ saving: true });
    try {
      const response = await updateProfile({
        displayName: this.data.displayName.trim(),
        wechat: this.data.wechat.trim(),
        city: this.data.city.trim() || "常州",
        roleLabel: this.data.roleLabel.trim(),
        organization: this.data.organization.trim(),
        monthlyTime: this.data.monthlyTime.trim(),
        bio: this.data.bio.trim(),
        skills: splitTags(this.data.skillsText),
        interests: splitTags(this.data.interestsText),
        willingToAttend: this.data.willingToAttend,
        willingToShare: this.data.willingToShare,
        willingToJoinProjects: this.data.willingToJoinProjects,
        privacyAccepted: true,
      });
      getApp<IAppOption>().globalData.currentUser = response.user;
      trackEvent("profile_saved", "/pages/profile/edit/index");
      void wx.showToast({ title: "资料已保存", icon: "success" });
      setTimeout(() => void wx.navigateBack(), 500);
    } catch {
      void wx.showToast({ title: "保存失败，请重试", icon: "none" });
    } finally {
      this.setData({ saving: false });
    }
  },
});
