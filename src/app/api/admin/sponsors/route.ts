import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { loadAdminSponsorsData } from "@/lib/admin/sponsors";
import { revalidateAdminSponsorPaths } from "@/lib/admin/revalidate";
import { canAdmin } from "@/lib/supabase/guards";

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

function getSponsorTier(payload: Record<string, unknown>) {
  const tier = String(payload.tier ?? "supporter").trim();
  return ["core", "partner", "supporter"].includes(tier) ? tier : "supporter";
}

export async function GET() {
  const { context, response } = await requireAdminApiPermission("sponsors.read");
  if (response) return response;

  const data = await loadAdminSponsorsData(context);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { context, response } = await requireAdminApiPermission("sponsors.write");
  if (response) return response;

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const name = String(payload.name ?? "").trim();
  const slugInput = String(payload.slug ?? "").trim();
  const slug = normalizeSlug(slugInput || name);

  if (!name || !slug) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  if (Boolean(payload.is_active) && !canAdmin(context, "sponsors.publish")) {
    return NextResponse.json(
      { error: "forbidden", permission: "sponsors.publish" },
      { status: 403 },
    );
  }

  const { data: createdSponsor, error } = await context.supabase
    .from("sponsors")
    .insert({
      name,
      slug,
      tier: getSponsorTier(payload),
      sponsor_label: getOptionalValue(payload, "sponsor_label"),
      logo_url: getOptionalValue(payload, "logo_url"),
      summary: getOptionalValue(payload, "summary"),
      description: getOptionalValue(payload, "description"),
      website_url: getOptionalValue(payload, "website_url"),
      display_order: getOptionalInteger(payload, "display_order"),
      is_active: Boolean(payload.is_active),
    })
    .select("id")
    .single();

  if (error || !createdSponsor?.id) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminSponsorPaths(createdSponsor.id, slug);

  return NextResponse.json({
    saved: "sponsor",
    sponsorId: createdSponsor.id,
  });
}
