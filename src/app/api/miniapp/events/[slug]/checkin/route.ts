import { createHash } from "node:crypto";

import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const payload = (await request.json().catch(() => null)) as
    | { token?: unknown }
    | null;
  const token = String(payload?.token ?? "").trim();
  if (token.length < 24 || token.length > 160) {
    return miniappJson({ error: "invalid_checkin_token" }, 400);
  }

  const { slug } = await context.params;
  const { data: event, error: eventError } = await auth.supabase
    .from("events")
    .select("id, status")
    .eq("slug", slug)
    .in("status", ["scheduled", "completed"])
    .maybeSingle();
  if (eventError) return miniappJson({ error: "event_load_failed" }, 500);
  if (!event) return miniappJson({ error: "not_found" }, 404);

  const userId = auth.session.user_id;
  const now = new Date().toISOString();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [{ data: checkinToken }, { data: registration }, { data: existing }] =
    await Promise.all([
      auth.supabase
        .from("event_checkin_tokens")
        .select("id")
        .eq("event_id", event.id)
        .eq("token_hash", tokenHash)
        .is("revoked_at", null)
        .lte("starts_at", now)
        .gt("expires_at", now)
        .maybeSingle(),
      auth.supabase
        .from("event_registrations")
        .select("id, status")
        .eq("event_id", event.id)
        .eq("user_id", userId)
        .eq("status", "registered")
        .maybeSingle(),
      auth.supabase
        .from("event_attendance")
        .select("id, status, checked_in_at")
        .eq("event_id", event.id)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (!checkinToken) {
    return miniappJson({ error: "checkin_code_expired" }, 409);
  }
  if (!registration) {
    return miniappJson({ error: "registration_required" }, 409);
  }
  if (existing) {
    return miniappJson({ attendance: existing, alreadyCheckedIn: true });
  }

  const { data: attendance, error } = await auth.supabase
    .from("event_attendance")
    .insert({
      event_id: event.id,
      user_id: userId,
      status: "attended",
      checked_in_at: now,
    })
    .select("id, status, checked_in_at")
    .single();

  if (error || !attendance) {
    return miniappJson({ error: "checkin_failed" }, 500);
  }

  return miniappJson({ attendance, alreadyCheckedIn: false });
}
