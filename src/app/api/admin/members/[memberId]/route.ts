import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { loadAdminMembersData } from "@/lib/admin/members";
import { revalidateAdminMemberPaths } from "@/lib/admin/revalidate";
import {
  isValidMemberPublicSlug,
  normalizeMemberPublicSlug,
} from "@/lib/member-public-slug";
import { canAdmin } from "@/lib/supabase/guards";

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
  const { context: staffContext, response } =
    await requireAdminApiPermission("members.read");
  if (response) return response;

  const { memberId } = await context.params;
  const data = await loadAdminMembersData(staffContext);
  const member = data.members.find((item) => item.id === memberId);

  if (!member) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: badgeAwards, error: badgeError } = await staffContext.supabase
    .from("member_badge_awards")
    .select("id, badge_code, label, description, source, awarded_at")
    .eq("user_id", memberId)
    .order("awarded_at", { ascending: false });

  return NextResponse.json({
    member,
    badgeAwards: badgeAwards ?? [],
    queryErrors: [
      ...data.queryErrors,
      ...(badgeError ? [`member_badge_awards: ${badgeError.message}`] : []),
    ],
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> },
) {
  const { context: staffContext, response } = await requireAdminApiPermission(
    "members.write_profile",
  );
  if (response) return response;

  const { memberId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!payload || !memberId) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const status = String(payload.status ?? "").trim();

  if (!status) {
    return NextResponse.json(
      { error: "missing_required_fields" },
      { status: 400 },
    );
  }

  const willingToAttend = Boolean(payload.willing_to_attend);
  const willingToShare = Boolean(payload.willing_to_share);
  const willingToJoinProjects = Boolean(payload.willing_to_join_projects);
  const isCoBuilder = Boolean(payload.is_co_builder);
  const isPubliclyVisible = Boolean(payload.is_publicly_visible);
  const isFeaturedOnHome =
    isPubliclyVisible && Boolean(payload.is_featured_on_home);
  const publicSlug = normalizeMemberPublicSlug(
    String(payload.public_slug ?? ""),
  );

  if (publicSlug && !isValidMemberPublicSlug(publicSlug)) {
    return NextResponse.json({ error: "invalid_public_slug" }, { status: 400 });
  }

  const [
    { data: existingProfile },
    { data: existingMember, error: memberLookupError },
  ] = await Promise.all([
    staffContext.supabase
      .from("profiles")
      .select("public_slug")
      .eq("id", memberId)
      .maybeSingle(),
    staffContext.supabase
      .from("members")
      .select("status, is_co_builder")
      .eq("id", memberId)
      .maybeSingle(),
  ]);

  if (memberLookupError) {
    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 400 },
    );
  }

  if (!existingMember) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (
    status !== existingMember.status &&
    !canAdmin(staffContext, "members.manage_status")
  ) {
    return NextResponse.json(
      { error: "forbidden", permission: "members.manage_status" },
      { status: 403 },
    );
  }

  if (
    isCoBuilder !== existingMember.is_co_builder &&
    !canAdmin(staffContext, "members.manage_co_builder")
  ) {
    return NextResponse.json(
      { error: "forbidden", permission: "members.manage_co_builder" },
      { status: 403 },
    );
  }

  const profileUpdate: Record<string, string | string[] | null> = {
    display_name: getOptionalValue(payload, "display_name"),
    public_slug: publicSlug,
    city: getOptionalValue(payload, "city") ?? "常州",
    role_label: getOptionalValue(payload, "role_label"),
    organization: getOptionalValue(payload, "organization"),
    monthly_time: getOptionalValue(payload, "monthly_time"),
    bio: getOptionalValue(payload, "bio"),
    industry_tags: normalizeSkills(String(payload.industry_tags ?? "")),
    skills: normalizeSkills(String(payload.skills ?? "")),
    interests: normalizeSkills(String(payload.interests ?? "")),
    capability_summary: getOptionalValue(payload, "capability_summary"),
    seeking_summary: getOptionalValue(payload, "seeking_summary"),
  };

  if (canAdmin(staffContext, "members.read_contact")) {
    profileUpdate.wechat = getOptionalValue(payload, "wechat");
  }

  const [{ error: profileError }, { error: memberError }] = await Promise.all([
    staffContext.supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", memberId),
    staffContext.supabase
      .from("members")
      .update({
        status,
        willing_to_attend: willingToAttend,
        willing_to_share: willingToShare,
        willing_to_join_projects: willingToJoinProjects,
        is_co_builder: isCoBuilder,
        is_publicly_visible: isPubliclyVisible,
        is_featured_on_home: isFeaturedOnHome,
      })
      .eq("id", memberId),
  ]);

  if (profileError || memberError) {
    if (profileError?.code === "23505") {
      return NextResponse.json({ error: "public_slug_taken" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "database_write_failed" },
      { status: 400 },
    );
  }

  revalidateAdminMemberPaths(memberId);
  if (existingProfile?.public_slug) {
    revalidateAdminMemberPaths(undefined, existingProfile.public_slug);
  }
  if (publicSlug) {
    revalidateAdminMemberPaths(undefined, publicSlug);
  }
  return NextResponse.json({ saved: "member_profile" });
}
