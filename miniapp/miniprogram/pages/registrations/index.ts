import { ensureSession } from "../../services/auth";
import { formatEventDate } from "../../services/events";
import { loadMyRegistrations } from "../../services/registrations";

type RegistrationItem = MiniappRegistration & {
  dateLabel: string;
  locationLabel: string;
  statusLabel: string;
};

Page({
  data: {
    registrations: [] as RegistrationItem[],
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
      const registrations = await loadMyRegistrations();
      this.setData({
        loading: false,
        registrations: registrations.map((item) => ({
          ...item,
          dateLabel: formatEventDate(item.events?.event_at ?? null),
          locationLabel: item.events?.venue || item.events?.city || "常州",
          statusLabel:
            item.status === "registered"
              ? "已报名"
              : item.status === "waitlisted"
                ? "候补中"
                : "已取消",
        })),
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (slug) {
      void wx.navigateTo({
        url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
      });
    }
  },
});
