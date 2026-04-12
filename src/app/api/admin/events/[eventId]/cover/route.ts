import { NextResponse } from "next/server";

import { revalidateAdminEventPaths } from "@/lib/admin/revalidate";
import { getStaffContextResult } from "@/lib/supabase/guards";

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
  const payload = (await request.json().catch(() => null)) as
    | { image_url?: string }
    | null;
  const imageUrl = String(payload?.image_url ?? "").trim();

  if (!eventId || !imageUrl) {
    return NextResponse.json({ error: "missing_photo_fields" }, { status: 400 });
  }

  const { data: eventData } = await staffContext.supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .maybeSingle();

  const { error } = await staffContext.supabase
    .from("events")
    .update({ cover_image_url: imageUrl })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminEventPaths(eventId, eventData?.slug ?? undefined);
  return NextResponse.json({ saved: "cover" });
}
