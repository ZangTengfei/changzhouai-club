import {
  loadGroupDigests,
  loadNews,
} from "../../services/content";
import { trackEvent } from "../../services/analytics";
import { ensureSession } from "../../services/auth";

type NewsSection = "selected" | "all" | "digest";

type NewsListItem = MiniappNewsItem & {
  dateLabel: string;
  metaLabel: string;
};

type DigestListItem = MiniappGroupDigest & {
  dateLabel: string;
  summaryLabel: string;
};

function formatDate(value: string | null) {
  if (!value) return "最新整理";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "最新整理";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function mapNews(item: MiniappNewsItem): NewsListItem {
  return {
    ...item,
    dateLabel: formatDate(item.publishedAt),
    metaLabel: `${item.sourceName} · ${item.categoryLabel}`,
  };
}

function mapDigest(item: MiniappGroupDigest): DigestListItem {
  return {
    ...item,
    dateLabel: item.date.replace(/-/g, "."),
    summaryLabel:
      item.overview ||
      `整理了 ${item.highlightCount} 个讨论要点和 ${item.resourceCount} 条资源线索。`,
  };
}

Page({
  data: {
    activeCategory: "all",
    activeSection: "selected" as NewsSection,
    categories: [] as MiniappNewsCategory[],
    digests: [] as DigestListItem[],
    hasNext: false,
    isStale: false,
    items: [] as NewsListItem[],
    loadFailed: false,
    loading: true,
    loadingMore: false,
    page: 1,
  },

  onShow() {
    void ensureSession()
      .then(() => trackEvent("news_list_view", "/pages/news/index"))
      .catch(() => undefined);
    void this.loadContent();
  },

  onPullDownRefresh() {
    void this.loadContent().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (
      this.data.activeSection === "digest" ||
      !this.data.hasNext ||
      this.data.loadingMore ||
      this.data.loading
    ) {
      return;
    }
    void this.loadNewsPage(this.data.page + 1, true);
  },

  async loadContent() {
    if (this.data.activeSection === "digest") {
      await this.loadDigests();
      return;
    }
    await this.loadNewsPage(1, false);
  },

  async loadNewsPage(page: number, append: boolean) {
    this.setData(
      append
        ? { loadingMore: true }
        : { loadFailed: false, loading: true, page: 1 },
    );

    try {
      await ensureSession();
      const response = await loadNews({
        category: this.data.activeCategory,
        mode: this.data.activeSection === "all" ? "all" : "selected",
        page,
      });
      this.setData({
        categories: response.categories,
        hasNext: response.pagination.hasNext,
        isStale: response.isStale,
        items: append
          ? [...this.data.items, ...response.items.map(mapNews)]
          : response.items.map(mapNews),
        loadFailed: false,
        loading: false,
        loadingMore: false,
        page: response.pagination.page,
      });
    } catch {
      this.setData({
        hasNext: false,
        items: append ? this.data.items : [],
        loadFailed: true,
        loading: false,
        loadingMore: false,
      });
    }
  },

  async loadDigests() {
    this.setData({ loadFailed: false, loading: true });

    try {
      await ensureSession();
      const response = await loadGroupDigests();
      this.setData({
        digests: response.items.map(mapDigest),
        isStale: response.isStale,
        loadFailed: false,
        loading: false,
      });
    } catch {
      this.setData({ digests: [], loadFailed: true, loading: false });
    }
  },

  switchSection(event: WechatMiniprogram.TouchEvent) {
    const section = String(event.currentTarget.dataset.section ?? "") as NewsSection;
    if (section !== "selected" && section !== "all" && section !== "digest") return;
    if (section === this.data.activeSection) return;

    this.setData({ activeSection: section, hasNext: false, items: [], page: 1 });
    void this.loadContent();
  },

  switchCategory(event: WechatMiniprogram.TouchEvent) {
    const category = String(event.currentTarget.dataset.category ?? "all");
    if (category === this.data.activeCategory) return;

    this.setData({ activeCategory: category, hasNext: false, items: [], page: 1 });
    void this.loadNewsPage(1, false);
  },

  openNews(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    void wx.navigateTo({
      url: `/pages/news/detail/index?kind=news&id=${encodeURIComponent(id)}`,
    });
  },

  openDigest(event: WechatMiniprogram.TouchEvent) {
    const id = String(event.currentTarget.dataset.id ?? "");
    if (!id) return;
    void wx.navigateTo({
      url: `/pages/news/detail/index?kind=digest&id=${encodeURIComponent(id)}`,
    });
  },
});
