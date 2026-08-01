import { ensureSession } from "../../services/auth";
import { formatEventDate } from "../../services/events";
import { loadMyRegistrations } from "../../services/registrations";

type RegistrationItem = MiniappRegistration & {
  dateLabel: string;
  locationLabel: string;
  statusLabel: string;
  statusTone: string;
};

function getRegistrationStatusView(item: MiniappRegistration) {
  if (item.status === "cancelled") {
    return { label: "已取消", tone: "cancelled" };
  }
  if (item.events?.status === "completed") {
    return {
      label:
        item.status === "waitlisted"
          ? "候补结束"
          : item.status === "pending"
            ? "审核结束"
            : "已结束",
      tone: "completed",
    };
  }
  if (item.status === "pending") return { label: "待审核", tone: "pending" };
  if (item.status === "waitlisted") {
    return { label: "候补中", tone: "waitlisted" };
  }
  return { label: "已报名", tone: "registered" };
}

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
        registrations: registrations.map((item) => {
          const statusView = getRegistrationStatusView(item);
          return {
            ...item,
            dateLabel: formatEventDate(item.events?.event_at ?? null),
            locationLabel: item.events?.venue || item.events?.city || "常州",
            statusLabel: statusView.label,
            statusTone: statusView.tone,
          };
        }),
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
