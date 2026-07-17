const AIHOT_BASE_URL = "https://aihot.virxact.com";
const AIHOT_USER_AGENT =
  "changzhouai-club/1.0 (+https://changzhouai.club)";
const AIHOT_REQUEST_TIMEOUT_MS = 8_000;

export const aiHotCategories = [
  {
    id: "ai-models",
    label: "模型发布/更新",
    shortLabel: "模型",
  },
  {
    id: "ai-products",
    label: "产品发布/更新",
    shortLabel: "产品",
  },
  {
    id: "industry",
    label: "行业动态",
    shortLabel: "行业",
  },
  {
    id: "paper",
    label: "论文研究",
    shortLabel: "论文",
  },
  {
    id: "tip",
    label: "技巧与观点",
    shortLabel: "观点",
  },
] as const;

export type AiHotCategory = (typeof aiHotCategories)[number]["id"];
export type AiHotMode = "selected" | "all";

export type AiHotItem = {
  id: string;
  title: string;
  title_en?: string | null;
  url: string;
  source: string;
  publishedAt?: string | null;
  summary?: string | null;
  category?: AiHotCategory | null;
  reason?: string | null;
  recommendationReason?: string | null;
  recommendReason?: string | null;
};

type AiHotItemList = {
  count: number;
  hasNext: boolean;
  nextCursor: string | null;
  items: AiHotItem[];
};

export type AiHotTopic = {
  id: string;
  title: string;
  url: string;
  permalink: string;
  source: string;
  sourceCount: number;
  signalCount: number;
  sourceNames: string[];
  latestAt: string | null;
};

type AiHotTopicList = {
  count: number;
  items: AiHotTopic[];
};

export type AiHotDailyItem = {
  title: string;
  summary?: string | null;
  sourceUrl: string;
  sourceName: string;
};

export type AiHotDailySection = {
  label: string;
  items: AiHotDailyItem[];
};

export type AiHotDailyFlash = {
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt?: string | null;
};

export type AiHotDailyReport = {
  date: string;
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  lead: {
    title: string;
    leadParagraph: string;
  } | null;
  sections: AiHotDailySection[];
  flashes: AiHotDailyFlash[];
};

export type AiNewsSourceKind = "aihot" | "group-digest" | "local-opc" | "policy";

export type AiNewsItem = {
  id: string;
  title: string;
  summary: string | null;
  recommendationReason: string | null;
  href: string;
  sourceName: string;
  sourceKind: AiNewsSourceKind;
  category: AiHotCategory | null;
  publishedAt: string | null;
};

type FetchResult<T> = {
  data: T | null;
  error: string | null;
};

export type AiHotNewsSnapshot = {
  selectedItems: AiNewsItem[];
  allItems: AiNewsItem[];
  dailyReport: AiHotDailyReport | null;
  errors: {
    selected: string | null;
    all: string | null;
    daily: string | null;
  };
};

export type AiHotFeedCategory = AiHotCategory | "all";

export type AiHotFeedQuery = {
  category?: AiHotFeedCategory;
  mode?: AiHotMode;
  q?: string;
  sinceHours?: number;
  take?: number;
};

export type AiHotFeedResult = {
  category: AiHotFeedCategory;
  count: number;
  error: string | null;
  items: AiNewsItem[];
  mode: AiHotMode;
  q: string;
  sinceHours: number;
};

export const aiNewsSourceRoadmap: Array<{
  id: AiNewsSourceKind;
  label: string;
  description: string;
  status: "live" | "planned";
}> = [
  {
    id: "aihot",
    label: "AI HOT 精选",
    description: "精选全球 AI 动态、日报和重要更新。",
    status: "live",
  },
  {
    id: "group-digest",
    label: "群聊精华",
    description: "整理社区讨论中的工具、案例和观点。",
    status: "planned",
  },
  {
    id: "local-opc",
    label: "本地 OPC",
    description: "关注常州本地的一人公司、独立产品和 AI 创业实践。",
    status: "planned",
  },
  {
    id: "policy",
    label: "政策新闻",
    description: "追踪常州及国内 AI 产业政策、项目申报与政企机会。",
    status: "planned",
  },
];

export function getAiHotCategoryLabel(category?: AiHotCategory | null) {
  return aiHotCategories.find((item) => item.id === category)?.label ?? "未分类";
}

export function getAiHotCategoryShortLabel(category?: AiHotCategory | null) {
  return aiHotCategories.find((item) => item.id === category)?.shortLabel ?? "其他";
}

export function isAiHotCategory(value: unknown): value is AiHotCategory {
  return aiHotCategories.some((category) => category.id === value);
}

export async function getAiHotFeed(query: AiHotFeedQuery = {}): Promise<AiHotFeedResult> {
  const mode = query.mode === "all" ? "all" : "selected";
  const category = isAiHotCategory(query.category) ? query.category : "all";
  const sinceHours = normalizeSinceHours(query.sinceHours);
  const q = normalizeSearchQuery(query.q);
  const take = clampInteger(query.take, mode === "all" ? 48 : 36, 1, 100);
  const result = await fetchAiHotItems({
    category,
    mode,
    q,
    sinceHours,
    take,
  });

  return {
    category,
    count: result.data?.count ?? 0,
    error: result.error,
    items: result.data?.items.map(normalizeAiHotItem) ?? [],
    mode,
    q,
    sinceHours,
  };
}

export async function getAiHotDailyReport(): Promise<{
  dailyReport: AiHotDailyReport | null;
  error: string | null;
}> {
  const result = await fetchAiHotDaily();

  return {
    dailyReport: result.data,
    error: result.error,
  };
}

export async function getAiHotTopics(): Promise<{
  error: string | null;
  topics: AiHotTopic[];
}> {
  const result = await fetchAiHotJson<AiHotTopicList>("/api/public/hot-topics", 120);

  return {
    error: result.error,
    topics: result.data?.items ?? [],
  };
}

export async function getAiHotNewsSnapshot(): Promise<AiHotNewsSnapshot> {
  const [selected, all, daily] = await Promise.all([
    fetchAiHotItems({ mode: "selected", take: 24 }),
    fetchAiHotItems({ mode: "all", take: 18 }),
    fetchAiHotDaily(),
  ]);

  return {
    selectedItems: selected.data?.items.map(normalizeAiHotItem) ?? [],
    allItems: all.data?.items.map(normalizeAiHotItem) ?? [],
    dailyReport: daily.data,
    errors: {
      selected: selected.error,
      all: all.error,
      daily: daily.error,
    },
  };
}

export function formatAiNewsDateTime(value?: string | null) {
  if (!value) {
    return "时间待确认";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "时间待确认";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatAiNewsDate(value?: string | null) {
  if (!value) {
    return "日期待确认";
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
  }).format(date);
}

function normalizeAiHotItem(item: AiHotItem): AiNewsItem {
  return {
    id: `aihot-${item.id}`,
    title: item.title,
    summary: item.summary?.trim() || null,
    recommendationReason: getAiHotRecommendationReason(item),
    href: item.url,
    sourceName: item.source,
    sourceKind: "aihot",
    category: item.category ?? null,
    publishedAt: item.publishedAt ?? null,
  };
}

function getAiHotRecommendationReason(item: AiHotItem) {
  return (
    item.recommendationReason?.trim() ||
    item.recommendReason?.trim() ||
    item.reason?.trim() ||
    null
  );
}

async function fetchAiHotItems({
  category = "all",
  mode,
  q = "",
  sinceHours,
  take,
}: {
  category?: AiHotFeedCategory;
  mode: AiHotMode;
  q?: string;
  sinceHours?: number;
  take: number;
}): Promise<FetchResult<AiHotItemList>> {
  const params = new URLSearchParams({
    mode,
    take: String(take),
  });

  if (category !== "all") {
    params.set("category", category);
  }

  if (q.length >= 2) {
    params.set("q", q);
  }

  if (sinceHours) {
    params.set("since", new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString());
  }

  return fetchAiHotJson<AiHotItemList>(`/api/public/items?${params.toString()}`, 300);
}

async function fetchAiHotDaily(): Promise<FetchResult<AiHotDailyReport>> {
  return fetchAiHotJson<AiHotDailyReport>("/api/public/daily", 3600);
}

async function fetchAiHotJson<T>(path: string, revalidate: number): Promise<FetchResult<T>> {
  try {
    const response = await fetch(`${AIHOT_BASE_URL}${path}`, {
      headers: {
        accept: "application/json",
        "user-agent": AIHOT_USER_AGENT,
      },
      signal: AbortSignal.timeout(AIHOT_REQUEST_TIMEOUT_MS),
      next: {
        revalidate,
      },
    });

    if (!response.ok) {
      throw new Error(`AI HOT request failed with ${response.status}`);
    }

    return {
      data: (await response.json()) as T,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "AI HOT request failed",
    };
  }
}

function clampInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function normalizeSearchQuery(value: unknown) {
  return String(value ?? "")
    .trim()
    .slice(0, 200);
}

function normalizeSinceHours(value: unknown) {
  const parsed = clampInteger(value, 168, 24, 168);

  if (parsed <= 24) {
    return 24;
  }

  if (parsed <= 72) {
    return 72;
  }

  return 168;
}
