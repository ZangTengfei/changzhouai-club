import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { getMiniappContentInteractions } from "@/lib/miniapp-content-interactions";
import {
  getMiniappNewsCategories,
  getMiniappNewsCategory,
  getMiniappNewsMode,
  loadMiniappNews,
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
  const source = await loadMiniappNews({
    category: requestedId ? "all" : category,
    mode: requestedId ? "all" : mode,
  });
  const items = source.items.map(toMiniappNewsItem);

  if (requestedId) {
    const item = items.find((candidate) => candidate.id === requestedId);
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
      isStale: source.isStale,
    });
  }

  const start = (page - 1) * PAGE_SIZE;
  const visibleItems = items.slice(start, start + PAGE_SIZE);
  const interactions = await getMiniappContentInteractions(
    auth.supabase,
    auth.session.user_id,
    "news",
    visibleItems.map((item) => item.id),
  );

  return miniappJson({
    categories: getMiniappNewsCategories(),
    error: source.error,
    isStale: source.isStale,
    items: visibleItems.map((item) => ({
      ...item,
      isFavorited: interactions.get(item.id)?.isFavorited ?? false,
      lastReadAt: interactions.get(item.id)?.lastReadAt ?? null,
    })),
    pagination: {
      hasNext: start + PAGE_SIZE < items.length,
      page,
      pageSize: PAGE_SIZE,
    },
  });
}
