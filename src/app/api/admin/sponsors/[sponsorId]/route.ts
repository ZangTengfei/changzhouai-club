import { NextResponse } from "next/server";

import { revalidateAdminSponsorPaths } from "@/lib/admin/revalidate";
import { loadAdminSponsorsData } from "@/lib/admin/sponsors";
import { getStaffContextResult } from "@/lib/supabase/guards";

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

function getOptionalInteger(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();

  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ sponsorId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { sponsorId } = await context.params;
  const data = await loadAdminSponsorsData(staffContext);
  const sponsor = data.sponsors.find((item) => item.id === sponsorId);

  if (!sponsor) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    sponsor,
    queryErrors: data.queryErrors,
    debugSnapshot: data.debugSnapshot,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sponsorId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { sponsorId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const name = String(payload.name ?? "").trim();
  const slug = normalizeSlug(String(payload.slug ?? "").trim() || name);

  if (!name || !slug) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const { error } = await staffContext.supabase
    .from("sponsors")
    .update({
      name,
      slug,
      sponsor_label: getOptionalValue(payload, "sponsor_label"),
      logo_url: getOptionalValue(payload, "logo_url"),
      summary: getOptionalValue(payload, "summary"),
      description: getOptionalValue(payload, "description"),
      website_url: getOptionalValue(payload, "website_url"),
      display_order: getOptionalInteger(payload, "display_order"),
      is_active: Boolean(payload.is_active),
    })
    .eq("id", sponsorId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminSponsorPaths(sponsorId, slug);
  return NextResponse.json({ saved: "sponsor" });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ sponsorId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { sponsorId } = await context.params;

  const { data: existingSponsor } = await staffContext.supabase
    .from("sponsors")
    .select("slug")
    .eq("id", sponsorId)
    .maybeSingle();

  const { error } = await staffContext.supabase.from("sponsors").delete().eq("id", sponsorId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminSponsorPaths(sponsorId, existingSponsor?.slug ?? undefined);
  return NextResponse.json({ saved: "sponsor_deleted" });
}
