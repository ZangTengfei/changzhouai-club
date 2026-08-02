import { loadSharedProfile } from "../../../services/profile";
import { createProfileShareCard } from "../../../utils/profile-share-card";

Page({
  data: {
    handle: "",
    eventSlug: "",
    profile: null as MiniappSharedProfile | null,
    avatarInitial: "微",
    shareCardImageUrl: "",
    loading: true,
    loadFailed: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const handle = String(options.handle ?? "").trim();
    const eventSlug = String(options.event ?? "").trim();
    this.setData({ handle, eventSlug });
    void this.loadPage();
  },

  onPullDownRefresh() {
    void this.loadPage().finally(() => wx.stopPullDownRefresh());
  },

  async loadPage() {
    if (!this.data.handle) {
      this.setData({ loading: false, loadFailed: true });
      return;
    }

    this.setData({ loading: true, loadFailed: false });
    try {
      const { profile } = await loadSharedProfile(
        this.data.handle,
        this.data.eventSlug,
      );
      this.setData(
        {
          profile,
          avatarInitial: profile.displayName.slice(0, 1) || "微",
          shareCardImageUrl: "",
          loading: false,
        },
        () => this.prepareShareCard(),
      );
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  prepareShareCard() {
    const profile = this.data.profile;
    if (!profile) return;

    wx.createSelectorQuery()
      .in(this)
      .select("#shared-profile-share-canvas")
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
    return {
      title: profile
        ? `我是${profile.displayName}，在常州 AI Club 认识我`
        : "常州 AI Club 成员名片",
      path: `/pages/profile/shared/index?handle=${encodeURIComponent(
        profile?.shareHandle || this.data.handle,
      )}${this.data.eventSlug
        ? `&event=${encodeURIComponent(this.data.eventSlug)}`
        : ""}`,
      imageUrl: this.data.shareCardImageUrl || undefined,
    };
  },
});
