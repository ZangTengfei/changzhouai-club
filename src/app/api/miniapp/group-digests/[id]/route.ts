import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { getMiniappContentInteractions } from "@/lib/miniapp-content-interactions";
import { loadMiniappGroupDigests, toMiniappGroupDigest } from "@/lib/miniapp-content";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const { id } = await context.params;
  const reportId = Number.parseInt(id, 10);
  if (!Number.isFinite(reportId)) return miniappJson({ error: "invalid_group_digest_id" }, 400);

  const { data: publication, error: publicationError } = await auth.supabase
    .from("miniapp_group_digest_publications")
    .select("is_published")
    .eq("report_id", reportId)
    .maybeSingle();
  if (publicationError) return miniappJson({ error: "group_digest_publication_load_failed" }, 500);
  if (publication?.is_published === false) return miniappJson({ error: "not_found" }, 404);

  const source = await loadMiniappGroupDigests();
  const report = source.reports.find((item) => item.id === reportId);
  if (!report) {
    return miniappJson({ error: source.error ? "group_digest_unavailable" : "not_found" }, source.error ? 503 : 404);
  }

  const digest = toMiniappGroupDigest(report);
  const interactions = await getMiniappContentInteractions(
    auth.supabase,
    auth.session.user_id,
    "group_digest",
    [digest.id],
  );

  return miniappJson({
    digest: {
      ...digest,
      isFavorited: interactions.get(digest.id)?.isFavorited ?? false,
      lastReadAt: interactions.get(digest.id)?.lastReadAt ?? null,
    },
    isStale: source.isStale,
  });
}
