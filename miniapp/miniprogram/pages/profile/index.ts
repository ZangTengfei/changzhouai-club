import { ensureSession } from "../../services/auth";
import { trackEvent } from "../../services/analytics";
import { loadProfile } from "../../services/profile";
import { createProfileShareCard } from "../../utils/profile-share-card";
import { isMiniappBasicProfileReady } from "../../utils/profile-state";

const PAGE_PATH = "/pages/profile/index";

Page({
  data: {
    profile: null as MiniappProfile | null,
    avatarInitial: "微",
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
      const user = await ensureSession();
      if (!isMiniappBasicProfileReady(user)) {
        this.setData({ loading: false });
        await wx.redirectTo({
          url: "/pages/profile/basic/index?intent=profile",
        });
        return;
      }
      const { profile } = await loadProfile();
      if (!profile.completion.completed) {
        this.setData({ loading: false });
        await wx.redirectTo({ url: "/pages/profile/edit/index" });
        return;
      }

      this.setData(
        {
          profile,
          avatarInitial: profile.displayName.slice(0, 1) || "微",
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
    void wx.navigateTo({ url: "/pages/profile/edit/index" });
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
