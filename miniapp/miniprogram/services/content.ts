import { apiRequest } from "./api";

type ContentType = "news" | "group_digest";
type ContentAction = "read" | "favorite" | "unfavorite" | "share";

export async function loadNews({
  category = "all",
  mode = "selected",
  page = 1,
}: {
  category?: string;
  mode?: MiniappNewsMode;
  page?: number;
} = {}) {
  const params = [
    `category=${encodeURIComponent(category)}`,
    `mode=${encodeURIComponent(mode)}`,
    `page=${encodeURIComponent(String(page))}`,
  ].join("&");
  return apiRequest<{
    categories: MiniappNewsCategory[];
    error: string | null;
    isStale: boolean;
    items: MiniappNewsItem[];
    pagination: { hasNext: boolean; page: number; pageSize: number };
  }>({
    path: `/api/miniapp/news?${params}`,
    authenticated: true,
  });
}

export async function loadNewsDetail(id: string) {
  return apiRequest<{ item: MiniappNewsItem; isStale: boolean }>({
    path: `/api/miniapp/news?id=${encodeURIComponent(id)}`,
    authenticated: true,
  });
}

export async function loadDailyBrief() {
  return apiRequest<{ error: string | null; report: MiniappDailyBrief | null }>({
    path: "/api/miniapp/news/daily",
    authenticated: true,
  });
}

export async function loadGroupDigests() {
  return apiRequest<{
    error: string | null;
    isStale: boolean;
    items: MiniappGroupDigest[];
  }>({
    path: "/api/miniapp/group-digests",
    authenticated: true,
  });
}

export async function loadGroupDigestDetail(id: string) {
  return apiRequest<{ digest: MiniappGroupDigestDetail; isStale: boolean }>({
    path: `/api/miniapp/group-digests/${encodeURIComponent(id)}`,
    authenticated: true,
  });
}

export async function updateContentInteraction(
  contentType: ContentType,
  contentId: string,
  action: ContentAction,
) {
  return apiRequest<{ interaction: MiniappContentInteraction }>({
    path: "/api/miniapp/content-interactions",
    method: "POST",
    authenticated: true,
    data: { action, contentId, contentType },
  });
}
