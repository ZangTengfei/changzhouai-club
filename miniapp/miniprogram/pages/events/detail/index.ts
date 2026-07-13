import { ApiError } from "../../../services/api";
import { trackEvent } from "../../../services/analytics";
import { ensureSession } from "../../../services/auth";
import { loadEventDetail, type EventDetail } from "../../../services/events";
import {
  cancelEventRegistration,
  loadEventRegistration,
  registerForEvent,
} from "../../../services/registrations";
import {
  loadReminderConfig,
  requestReminderAuthorization,
  saveReminderStatus,
  type ReminderConfig,
} from "../../../services/subscriptions";

Page({
  data: {
    event: null as EventDetail | null,
    loading: true,
    loadFailed: false,
    slug: "",
    user: null as MiniappUser | null,
    registration: null as MiniappRegistration | null,
    registrationNote: "",
    registrationLoading: true,
    submitting: false,
    reminder: null as ReminderConfig | null,
    reminderSubmitting: false,
    galleryUrls: [] as string[],
  },

  onLoad(options: Record<string, string | undefined>) {
    const slug = options.slug ? decodeURIComponent(options.slug) : "";
    if (!slug) {
      this.setData({ loading: false, loadFailed: true });
      return;
    }

    this.setData({ slug });
    void this.loadPage(slug);
  },

  async loadPage(slug: string) {
    this.setData({ loading: true, loadFailed: false });

    try {
      const event = await loadEventDetail(slug);
      this.setData({
        event,
        galleryUrls: event.gallery.map((item) => item.imageUrl),
        loading: false,
      });
      void wx.setNavigationBarTitle({ title: event.title });
      trackEvent("event_detail_view", "/pages/events/detail/index", { slug });
      void this.loadRegistration(slug);
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },

  async loadRegistration(slug: string) {
    this.setData({ registrationLoading: true });
    try {
      const user = await ensureSession();
      const registration = await loadEventRegistration(slug);
      this.setData({ user, registration, registrationLoading: false });
      if (registration?.status === "registered") {
        void this.loadReminder(slug);
      }
    } catch {
      this.setData({ user: null, registration: null, registrationLoading: false });
    }
  },

  async loadReminder(slug: string) {
    try {
      const reminder = await loadReminderConfig(slug);
      this.setData({ reminder });
    } catch {
      this.setData({ reminder: null });
    }
  },

  handleNoteInput(event: WechatMiniprogram.TextareaInput) {
    this.setData({ registrationNote: event.detail.value });
  },

  openProfile() {
    void wx.navigateTo({ url: "/pages/profile/edit/index" });
  },

  copyExternalLink() {
    const url = this.data.event?.registrationUrl;
    if (url) {
      void wx.setClipboardData({ data: url });
    }
  },

  copyDocsLink() {
    const url = this.data.event?.docsUrl;
    if (url) {
      void wx.setClipboardData({ data: url });
    }
  },

  previewGalleryImage(event: WechatMiniprogram.TouchEvent) {
    const current = String(event.currentTarget.dataset.url ?? "");
    if (!current) return;
    void wx.previewImage({ current, urls: this.data.galleryUrls });
  },

  async submitRegistration() {
    if (this.data.submitting || !this.data.event) return;
    if (!this.data.user?.profileComplete) {
      this.openProfile();
      return;
    }

    this.setData({ submitting: true });
    try {
      const registration = await registerForEvent(
        this.data.slug,
        this.data.registrationNote,
      );
      this.setData({ registration });
      trackEvent("registration_created", "/pages/events/detail/index", {
        slug: this.data.slug,
      });
      void this.loadReminder(this.data.slug);
      void wx.showToast({ title: "报名成功", icon: "success" });
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === "profile_incomplete") {
        this.openProfile();
      } else {
        void wx.showToast({ title: "报名失败，请重试", icon: "none" });
      }
    } finally {
      this.setData({ submitting: false });
    }
  },

  cancelRegistration() {
    if (this.data.submitting) return;
    void wx.showModal({
      title: "取消报名",
      content: "确认取消这场活动的报名吗？",
      confirmText: "确认取消",
      success: (result) => {
        if (result.confirm) void this.confirmCancelRegistration();
      },
    });
  },

  async confirmCancelRegistration() {
    this.setData({ submitting: true });
    try {
      const registration = await cancelEventRegistration(this.data.slug);
      this.setData({ registration, reminder: null });
      trackEvent("registration_cancelled", "/pages/events/detail/index", {
        slug: this.data.slug,
      });
      void wx.showToast({ title: "已取消报名", icon: "success" });
    } catch {
      void wx.showToast({ title: "取消失败，请重试", icon: "none" });
    } finally {
      this.setData({ submitting: false });
    }
  },

  async enableReminder() {
    const reminder = this.data.reminder;
    const templateId = reminder?.templateId;
    if (!reminder || !templateId || this.data.reminderSubmitting) return;

    this.setData({ reminderSubmitting: true });
    try {
      const status = await requestReminderAuthorization(templateId);
      const response = await saveReminderStatus(this.data.slug, status);
      this.setData({
        reminder: {
          ...reminder,
          subscription: response.subscription,
        },
      });
      trackEvent(
        status === "accepted" ? "reminder_accepted" : "reminder_rejected",
        "/pages/events/detail/index",
        { slug: this.data.slug },
      );
      void wx.showToast({
        title: status === "accepted" ? "活动提醒已开启" : "未开启提醒",
        icon: "none",
      });
    } catch {
      void wx.showToast({ title: "暂时无法开启提醒", icon: "none" });
    } finally {
      this.setData({ reminderSubmitting: false });
    }
  },

  onShareAppMessage() {
    trackEvent("share_event", "/pages/events/detail/index", {
      slug: this.data.slug,
      channel: "message",
    });
    return {
      title: this.data.event?.title ?? "常州 AI Club 活动",
      path: `/pages/events/detail/index?slug=${encodeURIComponent(this.data.slug)}`,
      imageUrl: this.data.event?.imageUrl ?? undefined,
    };
  },

  onShareTimeline() {
    trackEvent("share_event", "/pages/events/detail/index", {
      slug: this.data.slug,
      channel: "timeline",
    });
    return {
      title: this.data.event?.title ?? "常州 AI Club 活动",
      query: `slug=${encodeURIComponent(this.data.slug)}`,
      imageUrl: this.data.event?.imageUrl ?? undefined,
    };
  },
});
