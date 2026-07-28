import { ensureSession } from "../../services/auth";
import { loadProfile } from "../../services/profile";

Page({
  data: {
    profile: null as MiniappProfile | null,
    avatarInitial: "微",
    preferenceLabels: [] as string[],
    loading: true,
    loadFailed: false,
  },

  onShow() {
    void this.loadPage();
  },

  onPullDownRefresh() {
    void this.loadPage().finally(() => wx.stopPullDownRefresh());
  },

  async loadPage() {
    this.setData({ loading: true, loadFailed: false });
    try {
      await ensureSession();
      const { profile } = await loadProfile();
      if (!profile.completion.completed) {
        this.setData({ loading: false });
        await wx.redirectTo({ url: "/pages/profile/edit/index" });
        return;
      }

      const preferenceLabels = [
        profile.willingToAttend ? "参加社区活动" : "",
        profile.willingToShare ? "分享实践经验" : "",
        profile.willingToJoinProjects ? "参与共创项目" : "",
      ].filter(Boolean);

      this.setData({
        profile,
        avatarInitial: profile.displayName.slice(0, 1) || "微",
        preferenceLabels,
        loading: false,
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  editProfile() {
    void wx.navigateTo({ url: "/pages/profile/edit/index" });
  },
});
