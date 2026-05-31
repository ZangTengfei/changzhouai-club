import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import { revalidateAdminMemberPaths } from "@/lib/admin/revalidate";

export async function PUT(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { context: staffContext, response } =
    await requireAdminApiPermission("system.manage_roles");
  if (response) return response;

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | { role_ids?: unknown; note?: unknown }
    | null;
  const roleIds = Array.isArray(payload?.role_ids)
    ? [...new Set(payload.role_ids.map((roleId) => String(roleId).trim()).filter(Boolean))]
    : null;
  const note = String(payload?.note ?? "").trim() || "后台成员详情授权";

  if (!memberId || !roleIds) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data: existingMember, error: memberLookupError } = await staffContext.supabase
    .from("members")
    .select("id")
    .eq("id", memberId)
    .maybeSingle();

  if (memberLookupError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  if (!existingMember) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (roleIds.length > 0) {
    const { data: validRoles, error: rolesLookupError } = await staffContext.supabase
      .from("admin_roles")
      .select("id")
      .in("id", roleIds);

    if (rolesLookupError) {
      return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
    }

    if ((validRoles ?? []).length !== roleIds.length) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
  }

  const { data: existingAssignments } = await staffContext.supabase
    .from("member_admin_roles")
    .select("role_id")
    .eq("member_id", memberId);
  const beforeRoleIds = ((existingAssignments ?? []) as Array<{ role_id: string }>).map(
    (assignment) => assignment.role_id,
  );

  const { error: deleteError } = await staffContext.supabase
    .from("member_admin_roles")
    .delete()
    .eq("member_id", memberId);

  if (deleteError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  if (roleIds.length > 0) {
    const { error: insertError } = await staffContext.supabase.from("member_admin_roles").insert(
      roleIds.map((roleId) => ({
        member_id: memberId,
        role_id: roleId,
        granted_by: staffContext.user.id,
        note,
      })),
    );

    if (insertError) {
      return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
    }
  }

  await recordAdminAuditLog(staffContext.supabase, {
    actorId: staffContext.user.id,
    action: "member_roles.update",
    resourceType: "member",
    resourceId: memberId,
    beforeSnapshot: { roleIds: beforeRoleIds },
    afterSnapshot: { roleIds },
  });

  revalidateAdminMemberPaths(memberId);

  return NextResponse.json({ saved: "member_roles" });
}
