import { NextResponse } from "next/server";

import { loadAdminMembersData } from "@/lib/admin/members";
import { revalidateAdminMemberPaths } from "@/lib/admin/revalidate";
import { getStaffContextResult } from "@/lib/supabase/guards";

function getOptionalValue(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();
  return value || null;
}

function normalizeSkills(raw: string) {
  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { memberId } = await context.params;
  const data = await loadAdminMembersData(staffContext);
  const member = data.members.find((item) => item.id === memberId);

  if (!member) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    member,
    queryErrors: data.queryErrors,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload || !memberId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const status = String(payload.status ?? "").trim();

  if (!status) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const willingToAttend = Boolean(payload.willing_to_attend);
  const willingToShare = Boolean(payload.willing_to_share);
  const willingToJoinProjects = Boolean(payload.willing_to_join_projects);
  const isPubliclyVisible = Boolean(payload.is_publicly_visible);
  const isFeaturedOnHome = isPubliclyVisible && Boolean(payload.is_featured_on_home);

  const [{ error: profileError }, { error: memberError }] = await Promise.all([
    staffContext.supabase
      .from("profiles")
      .update({
        display_name: getOptionalValue(payload, "display_name"),
        wechat: getOptionalValue(payload, "wechat"),
        city: getOptionalValue(payload, "city") ?? "常州",
        role_label: getOptionalValue(payload, "role_label"),
        organization: getOptionalValue(payload, "organization"),
        monthly_time: getOptionalValue(payload, "monthly_time"),
        bio: getOptionalValue(payload, "bio"),
        skills: normalizeSkills(String(payload.skills ?? "")),
        interests: normalizeSkills(String(payload.interests ?? "")),
      })
      .eq("id", memberId),
    staffContext.supabase
      .from("members")
      .update({
        status,
        willing_to_attend: willingToAttend,
        willing_to_share: willingToShare,
        willing_to_join_projects: willingToJoinProjects,
        is_publicly_visible: isPubliclyVisible,
        is_featured_on_home: isFeaturedOnHome,
      })
      .eq("id", memberId),
  ]);

  if (profileError || memberError) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminMemberPaths(memberId);
  return NextResponse.json({ saved: "member_profile" });
}
