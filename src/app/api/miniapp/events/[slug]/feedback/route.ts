import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

async function loadEventAndAttendance(
  request: Request,
  slug: string,
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return { auth, event: null, attendance: null };

  const { data: event } = await auth.supabase
    .from("events")
    .select("id, status")
    .eq("slug", slug)
    .in("status", ["scheduled", "completed"])
    .maybeSingle();
  if (!event) return { auth, event: null, attendance: null };

  const { data: attendance } = await auth.supabase
    .from("event_attendance")
    .select("id, status, checked_in_at")
    .eq("event_id", event.id)
    .eq("user_id", auth.session.user_id)
    .in("status", ["attended", "late", "speaker"])
    .maybeSingle();

  return { auth, event, attendance };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { auth, event, attendance } = await loadEventAndAttendance(request, slug);
  if (auth.response) return auth.response;
  if (!event) return miniappJson({ error: "not_found" }, 404);

  const { data: feedback, error } = await auth.supabase
    .from("event_feedback")
    .select("id, rating, comment, submitted_at, updated_at")
    .eq("event_id", event.id)
    .eq("user_id", auth.session.user_id)
    .maybeSingle();
  if (error) return miniappJson({ error: "feedback_load_failed" }, 500);

  return miniappJson({ attendance, feedback: feedback ?? null });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { auth, event, attendance } = await loadEventAndAttendance(request, slug);
  if (auth.response) return auth.response;
  if (!event) return miniappJson({ error: "not_found" }, 404);
  if (event.status !== "completed") {
    return miniappJson({ error: "feedback_not_open" }, 409);
  }
  if (!attendance) {
    return miniappJson({ error: "attendance_required" }, 409);
  }

  const payload = (await request.json().catch(() => null)) as
    | { rating?: unknown; comment?: unknown }
    | null;
  const rating = Number(payload?.rating);
  const comment = String(payload?.comment ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 500) {
    return miniappJson({ error: "invalid_feedback" }, 400);
  }

  const { data: feedback, error } = await auth.supabase
    .from("event_feedback")
    .upsert(
      {
        event_id: event.id,
        user_id: auth.session.user_id,
        rating,
        comment: comment || null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "event_id,user_id" },
    )
    .select("id, rating, comment, submitted_at, updated_at")
    .single();
  if (error || !feedback) {
    return miniappJson({ error: "feedback_save_failed" }, 500);
  }

  return miniappJson({ feedback });
}
