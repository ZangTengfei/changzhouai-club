import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import { getPublicSiteUrl } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { context: staffContext, response } =
    await requireAdminApiPermission("events.update_registration_status");
  if (response) return response;

  const { eventId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | { validHours?: unknown }
    | null;
  const validHours = Number(payload?.validHours ?? 4);
  if (!Number.isInteger(validHours) || validHours < 1 || validHours > 24) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data: event, error: eventError } = await staffContext.supabase
    .from("events")
    .select("id, slug, title, status")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }
  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (event.status === "draft" || event.status === "cancelled") {
    return NextResponse.json({ error: "checkin_not_available" }, { status: 409 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + validHours * 60 * 60 * 1000);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const { error: revokeError } = await staffContext.supabase
    .from("event_checkin_tokens")
    .update({ revoked_at: now.toISOString() })
    .eq("event_id", event.id)
    .is("revoked_at", null)
    .gt("expires_at", now.toISOString());
  if (revokeError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  const { data: checkinToken, error: insertError } = await staffContext.supabase
    .from("event_checkin_tokens")
    .insert({
      event_id: event.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      created_by: staffContext.user.id,
    })
    .select("id")
    .single();
  if (insertError || !checkinToken) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  const siteOrigin = getPublicSiteUrl() ?? "https://changzhouai.club";
  const checkinUrl = new URL("/checkin", siteOrigin);
  checkinUrl.searchParams.set("event", event.slug);
  checkinUrl.searchParams.set("token", token);
  const qrDataUrl = await QRCode.toDataURL(checkinUrl.toString(), {
    width: 720,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#17211d", light: "#ffffff" },
  });

  await recordAdminAuditLog(staffContext.supabase, {
    actorId: staffContext.user.id,
    action: "event_checkin_code.create",
    resourceType: "event",
    resourceId: event.id,
    afterSnapshot: {
      tokenId: checkinToken.id,
      validHours,
      expiresAt: expiresAt.toISOString(),
    },
  });

  return NextResponse.json({
    event: { id: event.id, slug: event.slug, title: event.title },
    qrDataUrl,
    expiresAt: expiresAt.toISOString(),
  });
}
