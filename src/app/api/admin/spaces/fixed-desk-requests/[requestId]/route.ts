import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";

const reviewErrorCodes = [
  "fixed_desk_request_not_reviewable",
  "fixed_desk_already_assigned",
  "fixed_desk_user_already_assigned",
  "fixed_desk_has_active_bookings",
  "fixed_desk_not_applicable",
  "minimum_flexible_desks_required",
  "community_profile_required",
] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  const { context: adminContext, response } =
    await requireAdminApiPermission("spaces.manage_fixed_desks");
  if (response) return response;

  const { requestId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | { decision?: unknown; reviewNote?: unknown }
    | null;
  const decision = payload?.decision;
  const reviewNote =
    typeof payload?.reviewNote === "string" ? payload.reviewNote.trim() : "";
  if (
    !/^[0-9a-f-]{36}$/i.test(requestId) ||
    (decision !== "approve" && decision !== "reject") ||
    reviewNote.length > 500
  ) {
    return NextResponse.json({ error: "invalid_fixed_desk_review" }, { status: 400 });
  }

  const { data: before } = await adminContext.supabase
    .from("community_fixed_desk_requests")
    .select("id, resource_id, user_id, status, note")
    .eq("id", requestId)
    .maybeSingle();
  const { data, error } = await adminContext.supabase
    .rpc("review_community_fixed_desk_request", {
      p_request_id: requestId,
      p_reviewer_id: adminContext.user.id,
      p_decision: decision,
      p_review_note: reviewNote || null,
    })
    .single();

  if (error || !data) {
    const errorCode = reviewErrorCodes.find((code) =>
      (error?.message ?? "").includes(code),
    );
    return NextResponse.json(
      { error: errorCode ?? "fixed_desk_review_failed" },
      { status: errorCode ? 409 : 500 },
    );
  }

  await recordAdminAuditLog(adminContext.supabase, {
    actorId: adminContext.user.id,
    action: decision === "approve" ? "fixed_desk.approve" : "fixed_desk.reject",
    resourceType: "community_fixed_desk_request",
    resourceId: requestId,
    beforeSnapshot: (before as Record<string, unknown> | null) ?? null,
    afterSnapshot: data as Record<string, unknown>,
  });

  return NextResponse.json({ fixedDeskRequest: data });
}
