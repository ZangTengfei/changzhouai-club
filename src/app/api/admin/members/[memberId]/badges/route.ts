import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import { revalidateAdminMemberPaths } from "@/lib/admin/revalidate";

export async function PUT(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { context: staffContext, response } =
    await requireAdminApiPermission("members.manage_badges");
  if (response) return response;

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | { label?: unknown; description?: unknown }
    | null;
  const label = String(payload?.label ?? "").trim();
  const description = String(payload?.description ?? "").trim();

  if (!memberId || label.length < 2 || label.length > 20 || description.length > 100) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data: member, error: memberError } = await staffContext.supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }
  if (!member) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: award, error } = await staffContext.supabase
    .from("member_badge_awards")
    .insert({
      user_id: memberId,
      badge_code: `manual_${randomUUID().replaceAll("-", "")}`,
      label,
      description: description || null,
      source: "admin",
      awarded_by: staffContext.user.id,
    })
    .select("id, badge_code, label, description, source, awarded_at")
    .single();

  if (error || !award) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  await recordAdminAuditLog(staffContext.supabase, {
    actorId: staffContext.user.id,
    action: "member_badge.award",
    resourceType: "member",
    resourceId: memberId,
    afterSnapshot: { badgeCode: award.badge_code, label: award.label },
  });
  revalidateAdminMemberPaths(memberId);

  return NextResponse.json({ saved: "member_badge", award });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { context: staffContext, response } =
    await requireAdminApiPermission("members.manage_badges");
  if (response) return response;

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | { awardId?: unknown }
    | null;
  const awardId = String(payload?.awardId ?? "").trim();

  if (!memberId || !awardId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data: existingAward, error: lookupError } = await staffContext.supabase
    .from("member_badge_awards")
    .select("id, badge_code, label")
    .eq("id", awardId)
    .eq("user_id", memberId)
    .eq("source", "admin")
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }
  if (!existingAward) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error } = await staffContext.supabase
    .from("member_badge_awards")
    .delete()
    .eq("id", awardId)
    .eq("user_id", memberId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  await recordAdminAuditLog(staffContext.supabase, {
    actorId: staffContext.user.id,
    action: "member_badge.remove",
    resourceType: "member",
    resourceId: memberId,
    beforeSnapshot: {
      badgeCode: existingAward.badge_code,
      label: existingAward.label,
    },
  });
  revalidateAdminMemberPaths(memberId);

  return NextResponse.json({ saved: "member_badge_removed" });
}
