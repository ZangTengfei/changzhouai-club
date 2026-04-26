import { NextResponse } from "next/server";

import { normalizeAdminEventDateTime } from "@/lib/admin/event-datetime";
import { loadAdminEventsData } from "@/lib/admin/events";
import { revalidateAdminEventPaths } from "@/lib/admin/revalidate";
import { getStaffContextResult } from "@/lib/supabase/guards";

export async function GET() {
  const context = await getStaffContextResult();

  if (!context.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!context.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const data = await loadAdminEventsData(context);
  return NextResponse.json(data);
}

function normalizeSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getOptionalValue(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();
  return value || null;
}

export async function POST(request: Request) {
  const context = await getStaffContextResult();

  if (!context.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!context.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const title = String(payload.title ?? "").trim();
  const slugInput = String(payload.slug ?? "").trim();
  const slug = normalizeSlug(slugInput || title);
  const status = String(payload.status ?? "draft").trim();

  if (!title || !slug) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const { data: createdEvent, error } = await context.supabase
    .from("events")
    .insert({
      title,
      slug,
      summary: getOptionalValue(payload, "summary"),
      description: getOptionalValue(payload, "description"),
      agenda: getOptionalValue(payload, "agenda"),
      speaker_lineup: getOptionalValue(payload, "speaker_lineup"),
      registration_note: getOptionalValue(payload, "registration_note"),
      recap: getOptionalValue(payload, "recap"),
      docs_url: getOptionalValue(payload, "docs_url"),
      event_at: normalizeAdminEventDateTime(getOptionalValue(payload, "event_at")),
      venue: getOptionalValue(payload, "venue"),
      city: getOptionalValue(payload, "city") ?? "常州",
      cover_image_url: getOptionalValue(payload, "cover_image_url"),
      status,
      created_by: context.user.id,
    })
    .select("id")
    .single();

  if (error || !createdEvent?.id) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminEventPaths(createdEvent.id, slug);

  return NextResponse.json({
    saved: "event",
    eventId: createdEvent.id,
  });
}
