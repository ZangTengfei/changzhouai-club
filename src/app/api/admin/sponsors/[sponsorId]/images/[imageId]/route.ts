import { NextResponse } from "next/server";

import { revalidateAdminSponsorPaths } from "@/lib/admin/revalidate";
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

async function getSponsorSlug(
  sponsorId: string,
  supabase: Awaited<ReturnType<typeof getStaffContextResult>>["supabase"],
) {
  const { data } = await supabase.from("sponsors").select("slug").eq("id", sponsorId).maybeSingle();
  return data?.slug ?? undefined;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sponsorId: string; imageId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { sponsorId, imageId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const imageUrl = String(payload.image_url ?? "").trim();

  if (!sponsorId || !imageId || !imageUrl) {
    return NextResponse.json({ error: "missing_sponsor_image_fields" }, { status: 400 });
  }

  const { error } = await staffContext.supabase
    .from("sponsor_images")
    .update({
      image_url: imageUrl,
      caption: getOptionalValue(payload, "caption"),
      sort_order: getOptionalInteger(payload, "sort_order"),
    })
    .eq("id", imageId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminSponsorPaths(sponsorId, await getSponsorSlug(sponsorId, staffContext.supabase));
  return NextResponse.json({ saved: "sponsor_image" });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sponsorId: string; imageId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { sponsorId, imageId } = await context.params;

  const { error } = await staffContext.supabase.from("sponsor_images").delete().eq("id", imageId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminSponsorPaths(sponsorId, await getSponsorSlug(sponsorId, staffContext.supabase));
  return NextResponse.json({ saved: "sponsor_image_deleted" });
}
