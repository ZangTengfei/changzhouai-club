import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import { revalidateAdminMemberPaths } from "@/lib/admin/revalidate";

const MEMBERSHIP_BADGE_CODES = new Set([
  "co_builder",
  "core_builder",
  "honor_builder",
]);

function getMembershipLevel(
  isCoBuilder: boolean,
  badgeAwards: Array<{ badge_code: string }>,
) {
  const badgeCodes = new Set(badgeAwards.map((award) => award.badge_code));
  if (badgeCodes.has("honor_builder")) return 3;
  if (badgeCodes.has("core_builder")) return 2;
  if (isCoBuilder || badgeCodes.has("co_builder")) return 1;
  return 0;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { context: staffContext, response } = await requireAdminApiPermission(
    "members.manage_co_builder",
  );
  if (response) return response;

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as {
    level?: unknown;
    note?: unknown;
  } | null;
  const level = Number(payload?.level);
  const note = String(payload?.note ?? "").trim();

  if (
    !memberId ||
    !Number.isInteger(level) ||
    level < 0 ||
    level > 3 ||
    note.length > 100
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const [{ data: member, error: memberError }, { data: badgeAwards }] =
    await Promise.all([
      staffContext.supabase
        .from("members")
        .select("id, is_co_builder")
        .eq("id", memberId)
        .maybeSingle(),
      staffContext.supabase
        .from("member_badge_awards")
        .select("badge_code")
        .eq("user_id", memberId)
        .in("badge_code", Array.from(MEMBERSHIP_BADGE_CODES)),
    ]);

  if (memberError) {
    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 400 },
    );
  }

  if (!member) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const previousLevel = getMembershipLevel(
    member.is_co_builder,
    badgeAwards ?? [],
  );
  const { error } = await staffContext.supabase.rpc(
    "set_member_membership_level",
    {
      p_member_id: memberId,
      p_level: level,
    },
  );

  if (error) {
    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 400 },
    );
  }

  await recordAdminAuditLog(staffContext.supabase, {
    actorId: staffContext.user.id,
    action: "member_membership.update",
    resourceType: "member",
    resourceId: memberId,
    beforeSnapshot: { level: previousLevel },
    afterSnapshot: { level },
    metadata: note ? { note } : null,
  });
  revalidateAdminMemberPaths(memberId);

  return NextResponse.json({ saved: "member_membership", level });
}
