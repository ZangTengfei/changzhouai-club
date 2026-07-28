import { NextResponse } from "next/server";

import { isUuidLike, isValidMemberPublicSlug } from "@/lib/member-public-slug";
import { getAvatarImageUrl } from "@/lib/public-image-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getIdentityLabel(status: string, isCoBuilder: boolean) {
  if (status === "admin" || status === "organizer") return "社区主理人";
  if (isCoBuilder) return "共建伙伴";
  return "社区成员";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle } = await context.params;
  const normalizedHandle = handle.trim().toLowerCase();

  if (
    !normalizedHandle ||
    (!isUuidLike(normalizedHandle) && !isValidMemberPublicSlug(normalizedHandle))
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 503 });
  }

  const profileQuery = supabase
    .from("profiles")
    .select(
      "id, public_slug, display_name, avatar_url, city, role_label, organization, bio, industry_tags, skills, interests, capability_summary, seeking_summary",
    );
  const { data: profile, error: profileError } = await (isUuidLike(normalizedHandle)
    ? profileQuery.eq("id", normalizedHandle)
    : profileQuery.eq("public_slug", normalizedHandle)
  ).maybeSingle();

  if (profileError) {
    console.error("Failed to load shared mini-program profile.", {
      code: profileError.code,
    });
    return NextResponse.json({ error: "profile_load_failed" }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select(
      "status, is_co_builder, is_publicly_visible, willing_to_attend, willing_to_share, willing_to_join_projects",
    )
    .eq("id", profile.id)
    .maybeSingle();

  if (memberError) {
    console.error("Failed to load shared mini-program member.", {
      code: memberError.code,
    });
    return NextResponse.json({ error: "profile_load_failed" }, { status: 500 });
  }

  if (!member?.is_publicly_visible) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isCoBuilder = Boolean(member.is_co_builder);

  return NextResponse.json(
    {
      profile: {
        shareHandle: profile.public_slug?.trim() || profile.id,
        displayName: profile.display_name?.trim() || "社区成员",
        avatarUrl: getAvatarImageUrl(profile.avatar_url),
        city: profile.city?.trim() || "常州",
        roleLabel: profile.role_label?.trim() || "",
        organization: profile.organization?.trim() || "",
        bio: profile.bio?.trim() || "",
        industryTags: profile.industry_tags ?? [],
        skills: profile.skills ?? [],
        interests: profile.interests ?? [],
        capabilitySummary: profile.capability_summary?.trim() || "",
        seekingSummary: profile.seeking_summary?.trim() || "",
        willingToAttend: member.willing_to_attend,
        willingToShare: member.willing_to_share,
        willingToJoinProjects: member.willing_to_join_projects,
        identityLabel: getIdentityLabel(member.status, isCoBuilder),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
