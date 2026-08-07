type GuideKey = "ground" | "parking";

const GUIDE_IMAGES: Record<GuideKey, string> = {
  ground:
    "https://assets.changzhouai.club/community-assets/guides/caic18-ground-route-v1.webp",
  parking:
    "https://assets.changzhouai.club/community-assets/guides/caic18-underground-parking-route-v1.webp",
};

Page({
  data: {
    tabs: [
      { key: "ground" as GuideKey, label: "地面路线", note: "步行 / 网约车" },
      { key: "parking" as GuideKey, label: "地下车库", note: "自驾停车" },
    ],
    activeGuide: "ground" as GuideKey,
    imageUrl: GUIDE_IMAGES.ground,
    imageLoading: true,
    imageFailed: false,
  },

  selectGuide(event: WechatMiniprogram.TouchEvent) {
    const guide = String(event.currentTarget.dataset.guide ?? "") as GuideKey;
    if (!GUIDE_IMAGES[guide] || guide === this.data.activeGuide) return;

    this.setData({
      activeGuide: guide,
      imageUrl: GUIDE_IMAGES[guide],
      imageLoading: true,
      imageFailed: false,
    });
    void wx.pageScrollTo({ scrollTop: 0, duration: 180 });
  },

  handleImageLoad() {
    this.setData({ imageLoading: false, imageFailed: false });
  },

  handleImageError() {
    this.setData({ imageLoading: false, imageFailed: true });
  },

  retryImage() {
    const source = GUIDE_IMAGES[this.data.activeGuide];
    this.setData({
      imageUrl: `${source}?retry=${Date.now()}`,
      imageLoading: true,
      imageFailed: false,
    });
  },

  previewGuide() {
    if (this.data.imageLoading || this.data.imageFailed) return;
    void wx.previewImage({
      current: this.data.imageUrl,
      urls: [this.data.imageUrl],
    });
  },
});
