import { NextResponse } from "next/server";

import { isUuidLike, isValidMemberPublicSlug } from "@/lib/member-public-slug";
import { canPreviewMiniappDraftEvents } from "@/lib/miniapp-admin";
import { loadOptionalMiniappSession } from "@/lib/miniapp-api";
import { getAvatarImageUrl } from "@/lib/public-image-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function getIdentityLabel(status: string, isCoBuilder: boolean) {
  if (status === "admin" || status === "organizer") return "社区发起人";
  if (isCoBuilder) return "共建伙伴";
  return "社区成员";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ handle: string }> },
) {
  const { handle } = await context.params;
  const normalizedHandle = handle.trim().toLowerCase();
  const eventSlug = new URL(request.url).searchParams.get("event")?.trim() ?? "";

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

  let isConfirmedEventParticipant = false;
  if (eventSlug) {
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, visibility")
      .eq("slug", eventSlug)
      .neq("status", "draft")
      .maybeSingle();
    if (eventError) {
      return NextResponse.json({ error: "profile_load_failed" }, { status: 500 });
    }
    if (!event) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (event.visibility === "admin_only") {
      const auth = await loadOptionalMiniappSession(request);
      const canPreview = auth
        ? await canPreviewMiniappDraftEvents(auth.supabase, auth.session.user_id)
        : false;
      if (!canPreview) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
    }

    const { data: registration, error: registrationError } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", profile.id)
      .eq("status", "registered")
      .maybeSingle();
    if (registrationError) {
      return NextResponse.json({ error: "profile_load_failed" }, { status: 500 });
    }
    isConfirmedEventParticipant = Boolean(registration);
  }

  const [memberResult, fixedDeskAssignmentResult] = await Promise.all([
    supabase
      .from("members")
      .select(
        "status, is_co_builder, is_publicly_visible, willing_to_attend, willing_to_share, willing_to_join_projects",
      )
      .eq("id", profile.id)
      .maybeSingle(),
    supabase
      .from("community_fixed_desk_assignments")
      .select("resource_id")
      .eq("user_id", profile.id)
      .not("public_profile_consent_at", "is", null)
      .limit(1)
      .maybeSingle(),
  ]);
  const { data: member, error: memberError } = memberResult;

  if (memberError || fixedDeskAssignmentResult.error) {
    console.error("Failed to load shared mini-program member.", {
      code: memberError?.code ?? fixedDeskAssignmentResult.error?.code,
    });
    return NextResponse.json({ error: "profile_load_failed" }, { status: 500 });
  }

  if (
    !member ||
    (!member.is_publicly_visible &&
      !isConfirmedEventParticipant &&
      !fixedDeskAssignmentResult.data)
  ) {
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
