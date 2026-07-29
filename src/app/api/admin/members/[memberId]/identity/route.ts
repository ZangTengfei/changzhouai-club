import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { revalidateAdminMemberPaths } from "@/lib/admin/revalidate";
import { canAdmin } from "@/lib/supabase/guards";

const MEMBER_STATUSES = new Set([
  "pending",
  "active",
  "organizer",
  "admin",
  "paused",
]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { context: staffContext, response } =
    await requireAdminApiPermission("members.read");
  if (response) return response;

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const status = String(payload?.status ?? "").trim();
  const isCoBuilder = payload?.is_co_builder === true;

  if (!memberId || !MEMBER_STATUSES.has(status)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { data: member, error: lookupError } = await staffContext.supabase
    .from("members")
    .select("status, is_co_builder")
    .eq("id", memberId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 400 },
    );
  }

  if (!member) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (
    status !== member.status &&
    !canAdmin(staffContext, "members.manage_status")
  ) {
    return NextResponse.json(
      { error: "forbidden", permission: "members.manage_status" },
      { status: 403 },
    );
  }

  if (
    isCoBuilder !== member.is_co_builder &&
    !canAdmin(staffContext, "members.manage_co_builder")
  ) {
    return NextResponse.json(
      { error: "forbidden", permission: "members.manage_co_builder" },
      { status: 403 },
    );
  }

  const { error } = await staffContext.supabase
    .from("members")
    .update({ status, is_co_builder: isCoBuilder })
    .eq("id", memberId);

  if (error) {
    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 400 },
    );
  }

  revalidateAdminMemberPaths(memberId);
  return NextResponse.json({ saved: "member_identity" });
}
