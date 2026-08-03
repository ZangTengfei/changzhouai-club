import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";

export async function PATCH(request: Request, routeContext: { params: Promise<{ resourceId: string }> }) {
  const { context, response } = await requireAdminApiPermission("spaces.manage_resources");
  if (response) return response;
  const { resourceId } = await routeContext.params;
  const payload = (await request.json().catch(() => null)) as { status?: unknown } | null;
  if (!/^[0-9a-f-]{36}$/i.test(resourceId) || (payload?.status !== "active" && payload?.status !== "disabled")) {
    return NextResponse.json({ error: "invalid_space_resource" }, { status: 400 });
  }
  const { data: before } = await context.supabase.from("community_space_resources").select("*").eq("id", resourceId).maybeSingle();
  if (!before) return NextResponse.json({ error: "space_resource_not_found" }, { status: 404 });
  const { data, error } = await context.supabase
    .from("community_space_resources")
    .update({ status: payload.status })
    .eq("id", resourceId)
    .select("*")
    .single();
  if (error || !data) {
    const code = ["resource_has_fixed_assignment", "resource_has_active_bookings", "minimum_flexible_desks_required"].find((item) => error?.message.includes(item));
    return NextResponse.json({ error: code ?? "space_resource_update_failed" }, { status: code ? 409 : 500 });
  }
  await recordAdminAuditLog(context.supabase, {
    actorId: context.user.id,
    action: payload.status === "active" ? "space_resource.enable" : "space_resource.disable",
    resourceType: "community_space_resource",
    resourceId,
    beforeSnapshot: before as Record<string, unknown>,
    afterSnapshot: data as Record<string, unknown>,
  });
  return NextResponse.json({ resource: data });
}
