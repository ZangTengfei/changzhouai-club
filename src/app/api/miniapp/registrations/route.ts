import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const context = await requireMiniappSession(request);
  if (context.response) return context.response;

  const { data, error } = await context.supabase
    .from("event_registrations")
    .select(
      "id, status, note, created_at, events(id, slug, title, summary, event_at, venue, city, cover_image_url, status, event_type)",
    )
    .eq("user_id", context.session.user_id)
    .order("created_at", { ascending: false });

  if (error) {
    return miniappJson({ error: "registrations_load_failed" }, 500);
  }

  return miniappJson({ registrations: data ?? [] });
}
