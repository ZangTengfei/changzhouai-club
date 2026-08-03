import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";

export async function PATCH(request: Request, routeContext: { params: Promise<{ bookingId: string }> }) {
  const { context, response } = await requireAdminApiPermission("spaces.manage_bookings");
  if (response) return response;
  const { bookingId } = await routeContext.params;
  const payload = (await request.json().catch(() => null)) as { action?: unknown } | null;
  if (!/^[0-9a-f-]{36}$/i.test(bookingId) || payload?.action !== "cancel") {
    return NextResponse.json({ error: "invalid_space_booking" }, { status: 400 });
  }
  const { data: before } = await context.supabase.from("community_space_bookings").select("*").eq("id", bookingId).maybeSingle();
  if (!before) return NextResponse.json({ error: "space_booking_not_found" }, { status: 404 });
  const { data, error } = await context.supabase
    .from("community_space_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "confirmed")
    .select("*")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ error: "space_booking_not_cancellable" }, { status: 409 });
  await recordAdminAuditLog(context.supabase, {
    actorId: context.user.id,
    action: "space_booking.cancel",
    resourceType: "community_space_booking",
    resourceId: bookingId,
    beforeSnapshot: before as Record<string, unknown>,
    afterSnapshot: data as Record<string, unknown>,
  });
  return NextResponse.json({ booking: data });
}
