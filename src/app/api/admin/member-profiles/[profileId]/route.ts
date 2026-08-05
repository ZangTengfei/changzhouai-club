import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";

const REVIEW_STATUSES = new Set([
  "pending",
  "reviewed",
  "needs_confirmation",
]);
const CONSENT_STATUSES = new Set([
  "not_requested",
  "pending",
  "granted",
  "revoked",
]);

function optionalText(value: unknown, maxLength: number) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  const { context: adminContext, response } =
    await requireAdminApiPermission("members.write_private_profile");
  if (response) return response;

  const { profileId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!payload || !profileId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const reviewStatus = String(payload.review_status ?? "pending");
  const consentStatus = String(
    payload.sharing_consent_status ?? "not_requested",
  );
  const consentScope = optionalText(payload.sharing_consent_scope, 500);
  const linkedUserId = optionalText(payload.linked_user_id, 100);

  if (!REVIEW_STATUSES.has(reviewStatus) || !CONSENT_STATUSES.has(consentStatus)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (consentStatus === "granted" && !consentScope) {
    return NextResponse.json(
      { error: "sharing_consent_scope_required" },
      { status: 400 },
    );
  }

  if (linkedUserId) {
    const { data: linkedMember, error: memberError } = await adminContext.supabase
      .from("members")
      .select("id")
      .eq("id", linkedUserId)
      .maybeSingle();

    if (memberError || !linkedMember) {
      return NextResponse.json({ error: "member_not_found" }, { status: 400 });
    }
  }

  const { data: before, error: lookupError } = await adminContext.supabase
    .from("member_private_profiles")
    .select(
      "id, linked_user_id, linked_at, review_status, sharing_consent_status, sharing_consent_scope, sharing_consent_at",
    )
    .eq("id", profileId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: "database_read_failed" }, { status: 400 });
  }

  if (!before) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const consentAt =
    consentStatus === "granted"
      ? before.sharing_consent_at ?? now
      : consentStatus === "not_requested" || consentStatus === "revoked"
        ? null
        : before.sharing_consent_at;
  const update = {
    linked_user_id: linkedUserId,
    linked_at: linkedUserId
      ? before.linked_user_id === linkedUserId
        ? before.linked_at
        : now
      : null,
    linked_by: linkedUserId ? adminContext.user.id : null,
    review_status: reviewStatus,
    reviewed_at: reviewStatus === "reviewed" ? now : null,
    reviewed_by: reviewStatus === "reviewed" ? adminContext.user.id : null,
    sharing_consent_status: consentStatus,
    sharing_consent_scope:
      consentStatus === "granted"
        ? consentScope
        : null,
    sharing_consent_at: consentAt,
  };

  const { data: saved, error: updateError } = await adminContext.supabase
    .from("member_private_profiles")
    .update(update)
    .eq("id", profileId)
    .select(
      "id, linked_user_id, review_status, sharing_consent_status, sharing_consent_scope, sharing_consent_at",
    )
    .single();

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json(
        { error: "member_profile_account_already_linked" },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  await recordAdminAuditLog(adminContext.supabase, {
    actorId: adminContext.user.id,
    action: "member_private_profile.update",
    resourceType: "member_private_profile",
    resourceId: profileId,
    beforeSnapshot: before,
    afterSnapshot: saved,
    metadata: { source: "admin_member_profiles" },
  });

  return NextResponse.json({ saved: "member_private_profile" });
}
