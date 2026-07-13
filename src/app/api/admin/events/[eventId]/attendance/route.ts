import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";

const attendanceStatuses = new Set([
  "attended",
  "late",
  "speaker",
  "absent",
]);

export async function PUT(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { context: staffContext, response } =
    await requireAdminApiPermission("events.update_registration_status");
  if (response) return response;

  const { eventId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | { userId?: unknown; status?: unknown }
    | null;
  const userId = String(payload?.userId ?? "").trim();
  const status = String(payload?.status ?? "").trim();

  if (!eventId || !userId || (status !== "none" && !attendanceStatuses.has(status))) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const [{ data: event }, { data: registration }, { data: existing }] =
    await Promise.all([
      staffContext.supabase
        .from("events")
        .select("id")
        .eq("id", eventId)
        .maybeSingle(),
      staffContext.supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle(),
      staffContext.supabase
        .from("event_attendance")
        .select("id, status, checked_in_at")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
  if (!event || !registration) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (status === "none") {
    const { error } = await staffContext.supabase
      .from("event_attendance")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    if (error) {
      return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
    }

    await recordAdminAuditLog(staffContext.supabase, {
      actorId: staffContext.user.id,
      action: "event_attendance.remove",
      resourceType: "event",
      resourceId: eventId,
      beforeSnapshot: existing ?? null,
      metadata: { userId },
    });
    return NextResponse.json({ saved: "event_attendance", attendance: null });
  }

  const checkedInAt =
    status === "absent"
      ? null
      : existing?.checked_in_at ?? new Date().toISOString();
  const { data: attendance, error } = await staffContext.supabase
    .from("event_attendance")
    .upsert(
      {
        event_id: eventId,
        user_id: userId,
        status,
        checked_in_at: checkedInAt,
      },
      { onConflict: "event_id,user_id" },
    )
    .select("id, status, checked_in_at")
    .single();
  if (error || !attendance) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  await recordAdminAuditLog(staffContext.supabase, {
    actorId: staffContext.user.id,
    action: "event_attendance.update",
    resourceType: "event",
    resourceId: eventId,
    beforeSnapshot: existing ?? null,
    afterSnapshot: attendance,
    metadata: { userId },
  });

  return NextResponse.json({ saved: "event_attendance", attendance });
}
