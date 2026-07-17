import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import {
  getMiniappContentInteractions,
  type MiniappContentType,
} from "@/lib/miniapp-content-interactions";

const CONTENT_TYPES = new Set<MiniappContentType>(["news", "group_digest"]);
const ACTIONS = new Set(["read", "favorite", "unfavorite", "share"]);

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const params = new URL(request.url).searchParams;
  const contentType = normalizeContentType(params.get("contentType"));
  const contentIds = String(params.get("contentIds") ?? "")
    .split(",")
    .map((value) => normalizeContentId(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 100);
  if (!contentType || contentIds.length === 0) {
    return miniappJson({ error: "invalid_content_query" }, 400);
  }

  const interactions = await getMiniappContentInteractions(
    auth.supabase,
    auth.session.user_id,
    contentType,
    contentIds,
  );
  return miniappJson({
    interactions: Object.fromEntries(interactions),
  });
}

export async function POST(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const payload = (await request.json().catch(() => null)) as {
    action?: unknown;
    contentId?: unknown;
    contentType?: unknown;
  } | null;
  const contentType = normalizeContentType(payload?.contentType);
  const contentId = normalizeContentId(payload?.contentId);
  const action = typeof payload?.action === "string" ? payload.action : "";
  if (!contentType || !contentId || !ACTIONS.has(action)) {
    return miniappJson({ error: "invalid_content_interaction" }, 400);
  }

  const { data: existing, error: existingError } = await auth.supabase
    .from("miniapp_content_interactions")
    .select("content_id, is_favorited, last_read_at")
    .eq("user_id", auth.session.user_id)
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .maybeSingle();
  if (existingError) return miniappJson({ error: "content_interaction_load_failed" }, 500);

  const now = new Date().toISOString();
  const changes = {
    ...(action === "favorite" ? { is_favorited: true } : {}),
    ...(action === "unfavorite" ? { is_favorited: false } : {}),
    ...(action === "read" ? { last_read_at: now } : {}),
    ...(action === "share" ? { last_shared_at: now } : {}),
  };
  const save = existing
    ? auth.supabase
        .from("miniapp_content_interactions")
        .update(changes)
        .eq("user_id", auth.session.user_id)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .select("is_favorited, last_read_at")
        .single()
    : auth.supabase
        .from("miniapp_content_interactions")
        .insert({
          user_id: auth.session.user_id,
          content_type: contentType,
          content_id: contentId,
          ...changes,
        })
        .select("is_favorited, last_read_at")
        .single();
  const { data, error } = await save;
  if (error || !data) return miniappJson({ error: "content_interaction_save_failed" }, 500);

  return miniappJson({
    interaction: {
      isFavorited: data.is_favorited,
      lastReadAt: data.last_read_at,
    },
  });
}

function normalizeContentType(value: unknown): MiniappContentType | null {
  return typeof value === "string" && CONTENT_TYPES.has(value as MiniappContentType)
    ? (value as MiniappContentType)
    : null;
}

function normalizeContentId(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized && normalized.length <= 160 ? normalized : null;
}
