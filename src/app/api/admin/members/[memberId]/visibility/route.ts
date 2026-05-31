import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { revalidateAdminMemberPaths } from "@/lib/admin/revalidate";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { context: staffContext, response } =
    await requireAdminApiPermission("members.write_profile");
  if (response) return response;

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload || !memberId || typeof payload.is_publicly_visible !== "boolean") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const isPubliclyVisible = payload.is_publicly_visible;
  const [{ data: existingMember, error: memberLookupError }, { data: existingProfile }] =
    await Promise.all([
      staffContext.supabase
        .from("members")
        .select("id")
        .eq("id", memberId)
        .maybeSingle(),
      staffContext.supabase
        .from("profiles")
        .select("public_slug")
        .eq("id", memberId)
        .maybeSingle(),
    ]);

  if (memberLookupError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  if (!existingMember) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const memberUpdate = isPubliclyVisible
    ? { is_publicly_visible: true }
    : { is_publicly_visible: false, is_featured_on_home: false };
  const { error: memberError } = await staffContext.supabase
    .from("members")
    .update(memberUpdate)
    .eq("id", memberId);

  if (memberError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminMemberPaths(memberId, existingProfile?.public_slug ?? undefined);

  return NextResponse.json({
    saved: isPubliclyVisible ? "member_public_visibility" : "member",
  });
}
