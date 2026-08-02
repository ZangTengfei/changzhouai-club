import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const { bookingId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) {
    return miniappJson({ error: "not_found" }, 404);
  }

  const { data, error } = await auth.supabase
    .from("community_space_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("user_id", auth.session.user_id)
    .eq("status", "confirmed")
    .gt("starts_at", new Date().toISOString())
    .select("id, status")
    .maybeSingle();

  if (error) {
    return miniappJson({ error: "space_booking_cancel_failed" }, 500);
  }
  if (!data) {
    return miniappJson({ error: "space_booking_not_cancellable" }, 409);
  }

  return miniappJson({ booking: data });
}
