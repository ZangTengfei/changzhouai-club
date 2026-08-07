import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import { revalidateAdminMemberPaths } from "@/lib/admin/revalidate";

const DIRECTORY_PRIORITIES = new Set([0, 10, 20, 30]);

function parseFeaturedUntil(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;

  const parsed = new Date(`${raw}T23:59:59.999+08:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { context: staffContext, response } = await requireAdminApiPermission(
    "members.write_profile",
  );
  if (response) return response;

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as {
    priority?: unknown;
    featuredUntil?: unknown;
    reason?: unknown;
  } | null;
  const priority = Number(payload?.priority);
  const featuredUntil = parseFeaturedUntil(payload?.featuredUntil);
  const reason = String(payload?.reason ?? "").trim();

  if (
    !memberId ||
    !Number.isInteger(priority) ||
    !DIRECTORY_PRIORITIES.has(priority) ||
    featuredUntil === undefined ||
    reason.length > 100
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data: member, error: memberError } = await staffContext.supabase
    .from("members")
    .select(
      "id, is_publicly_visible, directory_priority, directory_featured_until, directory_feature_reason",
    )
    .eq("id", memberId)
    .maybeSingle();

  if (memberError) {
    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 400 },
    );
  }
  if (!member) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (priority > 0 && !member.is_publicly_visible) {
    return NextResponse.json(
      { error: "member_profile_not_public" },
      { status: 400 },
    );
  }

  const nextDirectory = priority > 0
    ? {
        directory_priority: priority,
        directory_featured_until: featuredUntil,
        directory_feature_reason: reason || null,
      }
    : {
        directory_priority: 0,
        directory_featured_until: null,
        directory_feature_reason: null,
      };
  const { error } = await staffContext.supabase
    .from("members")
    .update(nextDirectory)
    .eq("id", memberId);

  if (error) {
    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 400 },
    );
  }

  await recordAdminAuditLog(staffContext.supabase, {
    actorId: staffContext.user.id,
    action: "member_directory.update",
    resourceType: "member",
    resourceId: memberId,
    beforeSnapshot: {
      priority: member.directory_priority,
      featuredUntil: member.directory_featured_until,
      reason: member.directory_feature_reason,
    },
    afterSnapshot: {
      priority: nextDirectory.directory_priority,
      featuredUntil: nextDirectory.directory_featured_until,
      reason: nextDirectory.directory_feature_reason,
    },
  });
  revalidateAdminMemberPaths(memberId);

  return NextResponse.json({ saved: "member_directory" });
}
