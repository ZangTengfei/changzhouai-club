import { loadEventDetail, type EventDetail } from "../../../services/events";

Page({
  data: {
    event: null as EventDetail | null,
    loading: true,
    loadFailed: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const slug = options.slug ? decodeURIComponent(options.slug) : "";
    if (!slug) {
      this.setData({ loading: false, loadFailed: true });
      return;
    }

    void this.loadPage(slug);
  },

  async loadPage(slug: string) {
    this.setData({ loading: true, loadFailed: false });

    try {
      const event = await loadEventDetail(slug);
      this.setData({ event, loading: false });
      void wx.setNavigationBarTitle({ title: event.title });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },
});
