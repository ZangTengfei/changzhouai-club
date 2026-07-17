import {
  loadGroupDigestDetail,
  loadNewsDetail,
  updateContentInteraction,
} from "../../../services/content";
import { trackEvent } from "../../../services/analytics";
import { ensureSession } from "../../../services/auth";

type ContentKind = "news" | "digest";

Page({
  data: {
    digest: null as MiniappGroupDigestDetail | null,
    id: "",
    kind: "news" as ContentKind,
    loading: true,
    loadFailed: false,
    news: null as MiniappNewsItem | null,
    savingFavorite: false,
  },

  onLoad(query: Record<string, string | undefined>) {
    const kind: ContentKind = query.kind === "digest" ? "digest" : "news";
    const id = String(query.id ?? "");
    this.setData({ id, kind });
    void this.loadDetail();
  },

  async loadDetail() {
    const { id, kind } = this.data;
    if (!id) {
      this.setData({ loadFailed: true, loading: false });
      return;
    }

    this.setData({ loadFailed: false, loading: true });
    try {
      await ensureSession();
      if (kind === "digest") {
        const response = await loadGroupDigestDetail(id);
        this.setData({ digest: response.digest, loading: false, news: null });
        void updateContentInteraction("group_digest", id, "read");
        trackEvent("group_digest_view", "/pages/news/detail/index", { id });
      } else {
        const response = await loadNewsDetail(id);
        this.setData({ digest: null, loading: false, news: response.item });
        void updateContentInteraction("news", id, "read");
        trackEvent("news_item_view", "/pages/news/detail/index", { id });
      }
    } catch {
      this.setData({ loadFailed: true, loading: false });
    }
  },

  async toggleFavorite() {
    if (this.data.savingFavorite) return;
    const content = this.data.kind === "digest" ? this.data.digest : this.data.news;
    if (!content) return;

    const isFavorited = content.isFavorited;
    this.setData({ savingFavorite: true });
    try {
      const contentType = this.data.kind === "digest" ? "group_digest" : "news";
      const response = await updateContentInteraction(
        contentType,
        content.id,
        isFavorited ? "unfavorite" : "favorite",
      );
      if (this.data.kind === "digest" && this.data.digest) {
        this.setData({ digest: { ...this.data.digest, ...response.interaction } });
      }
      if (this.data.kind === "news" && this.data.news) {
        this.setData({ news: { ...this.data.news, ...response.interaction } });
      }
      trackEvent(
        isFavorited ? "content_unfavorited" : "content_favorited",
        "/pages/news/detail/index",
        { id: content.id, kind: this.data.kind },
      );
    } catch {
      void wx.showToast({ title: "操作失败，请重试", icon: "none" });
    } finally {
      this.setData({ savingFavorite: false });
    }
  },

  copySource(event: WechatMiniprogram.TouchEvent) {
    const url = String(event.currentTarget.dataset.url ?? "");
    if (!url) return;
    void wx.setClipboardData({ data: url });
  },

  onShareAppMessage() {
    const content = this.data.kind === "digest" ? this.data.digest : this.data.news;
    if (content) {
      void updateContentInteraction(
        this.data.kind === "digest" ? "group_digest" : "news",
        content.id,
        "share",
      );
      trackEvent("content_shared", "/pages/news/detail/index", {
        id: content.id,
        kind: this.data.kind,
      });
    }

    return {
      title: content?.title || "常州 AI Club 内容精选",
      path: `/pages/news/detail/index?kind=${this.data.kind}&id=${encodeURIComponent(this.data.id)}`,
    };
  },
});
