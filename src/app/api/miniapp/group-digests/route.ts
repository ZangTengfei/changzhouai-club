import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { getMiniappContentInteractions } from "@/lib/miniapp-content-interactions";
import { loadMiniappGroupDigests, toMiniappGroupDigest } from "@/lib/miniapp-content";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const { data: publications, error: publicationError } = await auth.supabase
    .from("miniapp_group_digest_publications")
    .select("report_id")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  if (publicationError) return miniappJson({ error: "group_digest_publication_load_failed" }, 500);

  const publishedIds = (publications ?? []).map((item) => String(item.report_id));
  const source = await loadMiniappGroupDigests();
  const reportById = new Map(source.reports.map((report) => [String(report.id), report]));
  const digests = publishedIds
    .map((id) => reportById.get(id))
    .filter((report): report is NonNullable<typeof report> => Boolean(report))
    .map(toMiniappGroupDigest)
    .map(({ discussions, highlights, resources, ...digest }) => digest);
  const interactions = await getMiniappContentInteractions(
    auth.supabase,
    auth.session.user_id,
    "group_digest",
    digests.map((item) => item.id),
  );

  return miniappJson({
    error: source.error,
    isStale: source.isStale,
    items: digests.map((item) => ({
      ...item,
      isFavorited: interactions.get(item.id)?.isFavorited ?? false,
      lastReadAt: interactions.get(item.id)?.lastReadAt ?? null,
    })),
  });
}
