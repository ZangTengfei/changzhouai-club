import { NextResponse } from "next/server";

import { loadAdminEventsData } from "@/lib/admin/events";
import { revalidateAdminEventPaths } from "@/lib/admin/revalidate";
import { getStaffContextResult } from "@/lib/supabase/guards";

function getOptionalValue(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();
  return value || null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { eventId } = await context.params;
  const data = await loadAdminEventsData(staffContext);
  const event = data.events.find((item) => item.id === eventId);

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    event,
    queryErrors: data.queryErrors,
    debugSnapshot: data.debugSnapshot,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { eventId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const title = String(payload.title ?? "").trim();
  const slug = String(payload.slug ?? "").trim();
  const status = String(payload.status ?? "draft").trim();

  if (!title || !slug) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const { error } = await staffContext.supabase
    .from("events")
    .update({
      title,
      slug,
      summary: getOptionalValue(payload, "summary"),
      description: getOptionalValue(payload, "description"),
      agenda: getOptionalValue(payload, "agenda"),
      speaker_lineup: getOptionalValue(payload, "speaker_lineup"),
      registration_note: getOptionalValue(payload, "registration_note"),
      recap: getOptionalValue(payload, "recap"),
      docs_url: getOptionalValue(payload, "docs_url"),
      event_at: getOptionalValue(payload, "event_at"),
      venue: getOptionalValue(payload, "venue"),
      city: getOptionalValue(payload, "city") ?? "常州",
      cover_image_url: getOptionalValue(payload, "cover_image_url"),
      status,
    })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminEventPaths(eventId, slug);
  return NextResponse.json({ saved: "event" });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { eventId } = await context.params;

  const { data: existingEvent } = await staffContext.supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .maybeSingle();

  const { error } = await staffContext.supabase.from("events").delete().eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminEventPaths(eventId, existingEvent?.slug ?? undefined);
  return NextResponse.json({ saved: "deleted" });
}
