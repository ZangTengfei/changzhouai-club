import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set([
  "login_success",
  "home_view",
  "event_list_view",
  "event_detail_view",
  "profile_started",
  "profile_step_completed",
  "profile_completed",
  "profile_updated",
  "profile_saved",
  "registration_created",
  "registration_cancelled",
  "reminder_accepted",
  "reminder_rejected",
  "share_event",
]);

export async function POST(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const payload = (await request.json().catch(() => null)) as {
    eventName?: unknown;
    pagePath?: unknown;
    eventData?: unknown;
  } | null;
  const eventName =
    typeof payload?.eventName === "string" ? payload.eventName.trim() : "";
  const pagePath =
    typeof payload?.pagePath === "string" ? payload.pagePath.trim() : "";
  const eventData =
    payload?.eventData &&
    typeof payload.eventData === "object" &&
    !Array.isArray(payload.eventData)
      ? payload.eventData
      : {};

  if (
    !ALLOWED_EVENTS.has(eventName) ||
    pagePath.length > 160 ||
    JSON.stringify(eventData).length > 2_000
  ) {
    return miniappJson({ error: "invalid_analytics_event" }, 400);
  }

  const { error } = await auth.supabase
    .from("miniapp_analytics_events")
    .insert({
      user_id: auth.session.user_id,
      session_id: auth.session.id,
      event_name: eventName,
      page_path: pagePath || null,
      event_data: eventData,
    });

  if (error) return miniappJson({ error: "analytics_save_failed" }, 500);
  return miniappJson({ tracked: true });
}
