import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ resourceId: string }> },
) {
  const { context: adminContext, response } =
    await requireAdminApiPermission("spaces.manage_fixed_desks");
  if (response) return response;

  const { resourceId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(resourceId)) {
    return NextResponse.json({ error: "invalid_fixed_desk_assignment" }, { status: 400 });
  }

  const { data: before } = await adminContext.supabase
    .from("community_fixed_desk_assignments")
    .select("resource_id, user_id, opc_name, assigned_at, request_id")
    .eq("resource_id", resourceId)
    .maybeSingle();
  const { data, error } = await adminContext.supabase.rpc(
    "release_community_fixed_desk_assignment",
    {
      p_resource_id: resourceId,
      p_actor_id: adminContext.user.id,
      p_allow_staff: true,
    },
  );

  if (error || !data) {
    const errorCode = (error?.message ?? "").includes(
      "fixed_desk_assignment_not_found",
    )
      ? "fixed_desk_assignment_not_found"
      : "fixed_desk_release_failed";
    return NextResponse.json(
      { error: errorCode },
      { status: errorCode === "fixed_desk_assignment_not_found" ? 409 : 500 },
    );
  }

  await recordAdminAuditLog(adminContext.supabase, {
    actorId: adminContext.user.id,
    action: "fixed_desk.release",
    resourceType: "community_fixed_desk_assignment",
    resourceId,
    beforeSnapshot: (before as Record<string, unknown> | null) ?? null,
    afterSnapshot: { released: true },
  });

  return NextResponse.json({ releasedResourceId: data });
}
