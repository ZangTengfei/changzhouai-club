import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";

export async function PATCH(request: Request, routeContext: { params: Promise<{ requestId: string }> }) {
  const { context, response } = await requireAdminApiPermission("spaces.manage_access");
  if (response) return response;
  const { requestId } = await routeContext.params;
  const payload = (await request.json().catch(() => null)) as { action?: unknown; reviewNote?: unknown; accessIdentifier?: unknown } | null;
  const action = payload?.action;
  const reviewNote = typeof payload?.reviewNote === "string" ? payload.reviewNote.trim() : "";
  const accessIdentifier = typeof payload?.accessIdentifier === "string" ? payload.accessIdentifier.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(requestId) || (action !== "process" && action !== "reopen") || reviewNote.length > 500 || accessIdentifier.length > 100) {
    return NextResponse.json({ error: "invalid_access_request_review" }, { status: 400 });
  }
  const { data: before } = await context.supabase.from("community_access_requests").select("*").eq("id", requestId).maybeSingle();
  if (!before) return NextResponse.json({ error: "access_request_not_found" }, { status: 404 });
  const update = action === "process"
    ? { status: "processed", review_note: reviewNote || null, access_identifier: accessIdentifier || null, processed_at: new Date().toISOString(), processed_by: context.user.id }
    : { status: "submitted", review_note: null, access_identifier: null, processed_at: null, processed_by: null };
  const { data, error } = await context.supabase.from("community_access_requests").update(update).eq("id", requestId).select("*").single();
  if (error || !data) return NextResponse.json({ error: "access_request_review_failed" }, { status: 500 });
  await recordAdminAuditLog(context.supabase, {
    actorId: context.user.id,
    action: action === "process" ? "access_request.process" : "access_request.reopen",
    resourceType: "community_access_request",
    resourceId: requestId,
    beforeSnapshot: before as Record<string, unknown>,
    afterSnapshot: data as Record<string, unknown>,
  });
  return NextResponse.json({ accessRequest: data });
}
