import { NextResponse } from "next/server";

import { revalidateAdminEventPaths } from "@/lib/admin/revalidate";
import { getStaffContextResult } from "@/lib/supabase/guards";

function getOptionalValue(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();
  return value || null;
}

function getOptionalInteger(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();

  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function POST(
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

  const imageUrl = String(payload.image_url ?? "").trim();

  if (!eventId || !imageUrl) {
    return NextResponse.json({ error: "missing_photo_fields" }, { status: 400 });
  }

  const { data: eventData } = await staffContext.supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .maybeSingle();

  const { error } = await staffContext.supabase.from("event_photos").insert({
    event_id: eventId,
    image_url: imageUrl,
    caption: getOptionalValue(payload, "caption"),
    sort_order: getOptionalInteger(payload, "sort_order"),
  });

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminEventPaths(eventId, eventData?.slug ?? undefined);
  return NextResponse.json({ saved: "photo" });
}
