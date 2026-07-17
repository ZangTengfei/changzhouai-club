import {
  aiHotCategories,
  getAiHotDailyReport,
  getAiHotFeed,
  getAiHotCategoryShortLabel,
  isAiHotCategory,
  type AiHotFeedCategory,
  type AiHotMode,
  type AiNewsItem,
} from "@/lib/aihot";
import { getWeDailyReports, type WeDailyReport } from "@/lib/wedaily";

const CONTENT_CACHE_TTL_MS = 2 * 60 * 1_000;
const CONTENT_CACHE_STALE_MS = 60 * 60 * 1_000;

export type MiniappNewsMode = "selected" | "all";

export type MiniappNewsItem = {
  id: string;
  title: string;
  summary: string | null;
  recommendationReason: string | null;
  sourceName: string;
  sourceUrl: string;
  category: string;
  categoryLabel: string;
  publishedAt: string | null;
};

export type MiniappGroupDigest = {
  id: string;
  date: string;
  title: string;
  overview: string | null;
  highlightCount: number;
  resourceCount: number;
  tags: string[];
};

export type MiniappGroupDigestDetail = MiniappGroupDigest & {
  highlights: Array<{ title: string; summary: string }>;
  discussions: Array<{ title: string; conclusion: string }>;
  resources: Array<{ title: string; body: string; url: string | null }>;
};

type CachedValue<T> = {
  cachedAt: number;
  value: T;
};

const newsCache = new Map<string, CachedValue<AiNewsItem[]>>();
let groupDigestCache: CachedValue<WeDailyReport[]> | null = null;

export function getMiniappNewsMode(value: unknown): MiniappNewsMode {
  return value === "all" ? "all" : "selected";
}

export function getMiniappNewsCategory(value: unknown): AiHotFeedCategory {
  return isAiHotCategory(value) ? value : "all";
}

export function getMiniappNewsCategories() {
  return [
    { id: "all", label: "全部" },
    ...aiHotCategories.map((category) => ({
      id: category.id,
      label: category.shortLabel,
    })),
  ];
}

export async function loadMiniappNews({
  category,
  mode,
}: {
  category: AiHotFeedCategory;
  mode: MiniappNewsMode;
}) {
  const cacheKey = `${mode}:${category}`;
  const cached = newsCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.cachedAt < CONTENT_CACHE_TTL_MS) {
    return { error: null, isStale: false, items: cached.value };
  }

  const feed = await getAiHotFeed({
    category,
    mode: mode as AiHotMode,
    take: 100,
  });

  if (feed.items.length > 0) {
    newsCache.set(cacheKey, { cachedAt: now, value: feed.items });
    return { error: feed.error, isStale: false, items: feed.items };
  }

  if (cached && now - cached.cachedAt < CONTENT_CACHE_STALE_MS) {
    return { error: feed.error || "news_source_unavailable", isStale: true, items: cached.value };
  }

  return { error: feed.error || "news_source_unavailable", isStale: false, items: [] };
}

export async function loadMiniappDailyBrief() {
  const result = await getAiHotDailyReport();
  const report = result.dailyReport;

  if (!report) {
    return { error: result.error || "daily_brief_unavailable", report: null };
  }

  return {
    error: result.error,
    report: {
      date: report.date,
      generatedAt: report.generatedAt,
      lead: report.lead,
      sections: report.sections.map((section) => ({
        label: section.label,
        items: section.items.slice(0, 6).map((item) => ({
          sourceName: item.sourceName,
          sourceUrl: safeUrl(item.sourceUrl),
          summary: cleanText(item.summary, 220),
          title: cleanText(item.title, 100) || "AI 资讯",
        })),
      })),
      flashes: report.flashes.slice(0, 10).map((item) => ({
        publishedAt: item.publishedAt ?? null,
        sourceName: item.sourceName,
        sourceUrl: safeUrl(item.sourceUrl),
        title: cleanText(item.title, 100) || "AI 快讯",
      })),
    },
  };
}

export async function loadMiniappGroupDigests() {
  const now = Date.now();
  const cached = groupDigestCache;

  if (cached && now - cached.cachedAt < CONTENT_CACHE_TTL_MS) {
    return { error: null, isStale: false, reports: cached.value };
  }

  const result = await getWeDailyReports({ limit: 60 });

  if (result.reports.length > 0) {
    groupDigestCache = { cachedAt: now, value: result.reports };
    return { error: result.error, isStale: false, reports: result.reports };
  }

  if (cached && now - cached.cachedAt < CONTENT_CACHE_STALE_MS) {
    return { error: result.error || "group_digest_unavailable", isStale: true, reports: cached.value };
  }

  return { error: result.error || "group_digest_unavailable", isStale: false, reports: [] };
}

export function toMiniappGroupDigest(report: WeDailyReport): MiniappGroupDigestDetail {
  const names = new Set<string>();
  for (const [name] of report.stats?.top_speakers ?? []) names.add(name);
  for (const highlight of report.parsed.highlights) {
    for (const name of highlight.participants) names.add(name);
  }
  for (const discussion of report.parsed.discussions) {
    for (const name of discussion.people) names.add(name);
  }

  const clean = (value: string | null | undefined, limit: number) =>
    redactGroupText(cleanText(value, limit), names);

  return {
    id: String(report.id),
    date: report.date,
    title: clean(report.parsed.title, 100) || `${report.date} 群聊精华`,
    overview: clean(report.parsed.overview, 320) || null,
    highlightCount: report.parsed.highlights.length,
    resourceCount: report.parsed.resources.length,
    tags: report.parsed.tags.slice(0, 8).map((tag) => clean(tag, 24)).filter(Boolean),
    highlights: report.parsed.highlights.slice(0, 8).map((item) => ({
      title: clean(item.title, 90) || "讨论要点",
      summary: clean(item.summary, 240),
    })),
    discussions: report.parsed.discussions.slice(0, 6).map((item) => ({
      title: clean(item.title, 90) || "重点讨论",
      conclusion: clean(item.conclusion, 260),
    })),
    resources: report.parsed.resources.slice(0, 8).map((item) => ({
      title: clean(item.title, 90) || "资源线索",
      body: clean(item.body, 220),
      url: safeUrl(item.url),
    })),
  };
}

export function toMiniappNewsItem(item: AiNewsItem): MiniappNewsItem {
  return {
    id: item.id,
    title: cleanText(item.title, 120) || "AI 资讯",
    summary: cleanText(item.summary, 260) || null,
    recommendationReason: cleanText(item.recommendationReason, 160) || null,
    sourceName: cleanText(item.sourceName, 48) || "AI HOT",
    sourceUrl: safeUrl(item.href),
    category: item.category || "other",
    categoryLabel: getAiHotCategoryShortLabel(item.category),
    publishedAt: item.publishedAt,
  };
}

function cleanText(value: string | null | undefined, maxLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function redactGroupText(value: string, names: Set<string>) {
  let result = value;

  for (const name of names) {
    const normalized = name.trim();
    if (normalized.length < 2) continue;
    result = result.replace(new RegExp(escapeRegExp(normalized), "g"), "社区成员");
  }

  return result
    .replace(/(?:\+?86[-\s]?)?1[3-9]\d{9}/g, "[已隐藏]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[已隐藏]");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeUrl(value: string | null | undefined) {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}
