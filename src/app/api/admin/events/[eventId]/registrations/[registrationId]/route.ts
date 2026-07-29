import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";

const registrationStatuses = new Set([
  "pending",
  "registered",
  "waitlisted",
  "cancelled",
]);

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ eventId: string; registrationId: string }>;
  },
) {
  const { context: staffContext, response } =
    await requireAdminApiPermission("events.update_registration_status");
  if (response) return response;

  const { eventId, registrationId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | { status?: unknown }
    | null;
  const status = String(payload?.status ?? "").trim();

  if (!eventId || !registrationId || !registrationStatuses.has(status)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data, error } = await staffContext.supabase
    .rpc("set_event_registration_status", {
      p_event_id: eventId,
      p_registration_id: registrationId,
      p_status: status,
    })
    .single();

  if (error) {
    const errorCode = error.message.includes("event_capacity_reached")
      ? "event_capacity_reached"
      : error.message.includes("registration_not_found")
        ? "not_found"
        : "database_write_failed";
    return NextResponse.json(
      { error: errorCode },
      { status: errorCode === "event_capacity_reached" ? 409 : 400 },
    );
  }

  return NextResponse.json({ registration: data });
}
