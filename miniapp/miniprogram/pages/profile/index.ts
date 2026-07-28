import { ensureSession } from "../../services/auth";
import { trackEvent } from "../../services/analytics";
import { loadProfile } from "../../services/profile";
import { createProfileShareCard } from "../../utils/profile-share-card";

const PAGE_PATH = "/pages/profile/index";
const profileEditSteps = ["身份", "能力", "连接", "公开"];

function getProfileEditUrl(step: number) {
  return `/pages/profile/edit/index?step=${step}`;
}

Page({
  data: {
    profileEditSteps,
    profile: null as MiniappProfile | null,
    avatarInitial: "微",
    preferenceLabels: [] as string[],
    shareCardImageUrl: "",
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

      this.setData(
        {
          profile,
          avatarInitial: profile.displayName.slice(0, 1) || "微",
          preferenceLabels,
          shareCardImageUrl: "",
          loading: false,
        },
        () => {
          if (profile.isPubliclyVisible) {
            void wx.showShareMenu({ menus: ["shareAppMessage"] });
            this.prepareShareCard();
          } else {
            void wx.hideShareMenu();
          }
        },
      );
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  editProfile() {
    void wx.navigateTo({ url: getProfileEditUrl(0) });
  },

  editProfileStep(event: WechatMiniprogram.TouchEvent) {
    const step = Number(event.currentTarget.dataset.step);
    if (!Number.isInteger(step) || !profileEditSteps[step]) return;
    void wx.navigateTo({ url: getProfileEditUrl(step) });
  },

  openVisibilitySettings() {
    void wx.showModal({
      title: "先确认公开范围",
      content:
        "分享后，昵称、头像、城市、身份、能力与连接方向会作为公开成员资料展示；微信号不会公开。",
      confirmText: "去设置",
      success: ({ confirm }) => {
        if (confirm) {
          void wx.navigateTo({ url: getProfileEditUrl(3) });
        }
      },
    });
  },

  prepareShareCard() {
    const profile = this.data.profile;
    if (!profile?.isPubliclyVisible) return;

    wx.createSelectorQuery()
      .in(this)
      .select("#profile-share-canvas")
      .fields({ node: true }, (result) => {
        const canvas = result?.node as WechatMiniprogram.Canvas | undefined;
        if (!canvas) return;
        void createProfileShareCard(canvas, profile)
          .then((shareCardImageUrl) => this.setData({ shareCardImageUrl }))
          .catch(() => undefined);
      })
      .exec();
  },

  onShareAppMessage() {
    const profile = this.data.profile;
    if (!profile?.isPubliclyVisible) {
      return {
        title: "常州 AI Club｜完善我的成员资料",
        path: PAGE_PATH,
      };
    }

    trackEvent("share_member_profile", PAGE_PATH, {
      handle: profile.shareHandle,
    });
    return {
      title: `我是${profile.displayName}，在常州 AI Club 认识我`,
      path: `/pages/profile/shared/index?handle=${encodeURIComponent(
        profile.shareHandle,
      )}`,
      imageUrl: this.data.shareCardImageUrl || undefined,
    };
  },
});
