import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { getMiniappContentInteractions } from "@/lib/miniapp-content-interactions";
import {
  getMiniappNewsCategories,
  getMiniappNewsCategory,
  getMiniappNewsMode,
  hotTopicToMiniappNewsItem,
  loadMiniappHotTopics,
  loadMiniappNews,
  toMiniappHotTopic,
  toMiniappNewsItem,
} from "@/lib/miniapp-content";

const PAGE_SIZE = 20;

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const params = new URL(request.url).searchParams;
  const requestedId = String(params.get("id") ?? "").trim();
  const mode = getMiniappNewsMode(params.get("mode"));
  const category = getMiniappNewsCategory(params.get("category"));
  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, Math.min(5, requestedPage)) : 1;
  const shouldUseHotTopics = !requestedId && mode === "selected" && category === "all";
  const [source, feedHotTopics] = await Promise.all([
    loadMiniappNews({
      category: requestedId ? "all" : category,
      mode: requestedId ? "all" : mode,
    }),
    shouldUseHotTopics
      ? loadMiniappHotTopics()
      : Promise.resolve({ error: null, isStale: false, topics: [] }),
  ]);
  const items = source.items.map(toMiniappNewsItem);

  if (requestedId) {
    let item = items.find((candidate) => candidate.id === requestedId);
    let hotTopicsStale = false;
    if (!item) {
      const hotTopics = await loadMiniappHotTopics();
      const topic = hotTopics.topics.find((candidate) => `aihot-${candidate.id}` === requestedId);
      item = topic ? hotTopicToMiniappNewsItem(topic) : undefined;
      hotTopicsStale = hotTopics.isStale;
    }
    if (!item) {
      return miniappJson(
        { error: source.error ? "news_unavailable" : "not_found" },
        source.error ? 503 : 404,
      );
    }
    const interactions = await getMiniappContentInteractions(
      auth.supabase,
      auth.session.user_id,
      "news",
      [item.id],
    );
    return miniappJson({
      item: {
        ...item,
        isFavorited: interactions.get(item.id)?.isFavorited ?? false,
        lastReadAt: interactions.get(item.id)?.lastReadAt ?? null,
      },
      isStale: source.isStale || hotTopicsStale,
    });
  }

  const hotTopicIds = new Set(feedHotTopics.topics.map((topic) => `aihot-${topic.id}`));
  const listItems = shouldUseHotTopics
    ? items.filter((item) => !hotTopicIds.has(item.id))
    : items;
  const start = (page - 1) * PAGE_SIZE;
  const visibleItems = listItems.slice(start, start + PAGE_SIZE);
  const interactions = await getMiniappContentInteractions(
    auth.supabase,
    auth.session.user_id,
    "news",
    visibleItems.map((item) => item.id),
  );

  return miniappJson({
    categories: getMiniappNewsCategories(),
    error: source.error,
    hotTopics: page === 1 ? feedHotTopics.topics.map(toMiniappHotTopic) : [],
    isStale: source.isStale || feedHotTopics.isStale,
    items: visibleItems.map((item) => ({
      ...item,
      isFavorited: interactions.get(item.id)?.isFavorited ?? false,
      lastReadAt: interactions.get(item.id)?.lastReadAt ?? null,
    })),
    pagination: {
      hasNext: start + PAGE_SIZE < listItems.length,
      page,
      pageSize: PAGE_SIZE,
    },
  });
}
