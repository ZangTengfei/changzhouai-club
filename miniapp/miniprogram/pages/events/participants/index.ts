import {
  loadEventParticipants,
  type EventParticipantPreview,
} from "../../../services/events";

Page({
  data: {
    slug: "",
    eventTitle: "",
    confirmedCount: 0,
    participants: [] as EventParticipantPreview[],
    loading: true,
    loadFailed: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const slug = options.slug ? decodeURIComponent(options.slug) : "";
    if (!slug) {
      this.setData({ loading: false, loadFailed: true });
      return;
    }

    this.setData({ slug });
    void this.loadPage();
  },

  onPullDownRefresh() {
    void this.loadPage().finally(() => wx.stopPullDownRefresh());
  },

  async loadPage() {
    if (!this.data.slug) return;
    this.setData({ loading: true, loadFailed: false });

    try {
      const response = await loadEventParticipants(this.data.slug);
      this.setData({
        eventTitle: response.event.title,
        confirmedCount: response.confirmedCount,
        participants: response.participants,
        loading: false,
      });
      void wx.setNavigationBarTitle({ title: "报名成员" });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  openParticipantProfile(event: WechatMiniprogram.TouchEvent) {
    const handle = String(event.currentTarget.dataset.handle ?? "");
    if (!handle || !this.data.slug) return;
    void wx.navigateTo({
      url: `/pages/profile/shared/index?handle=${encodeURIComponent(
        handle,
      )}&event=${encodeURIComponent(this.data.slug)}`,
    });
  },
});
