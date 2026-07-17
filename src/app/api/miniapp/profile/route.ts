import type { SupabaseClient } from "@supabase/supabase-js";

import { loadMiniappAccountSnapshot } from "@/lib/miniapp-auth";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import {
  getMiniappProfileCompletion,
  MINIAPP_INDUSTRY_OPTIONS,
  MINIAPP_PRIVACY_POLICY_VERSION,
  MINIAPP_SKILL_OPTIONS,
} from "@/lib/miniapp-profile";

export const runtime = "nodejs";

type ProfilePayload = {
  displayName?: unknown;
  wechat?: unknown;
  city?: unknown;
  roleLabel?: unknown;
  organization?: unknown;
  monthlyTime?: unknown;
  bio?: unknown;
  industryTags?: unknown;
  skills?: unknown;
  interests?: unknown;
  capabilitySummary?: unknown;
  seekingSummary?: unknown;
  willingToAttend?: unknown;
  willingToShare?: unknown;
  willingToJoinProjects?: unknown;
  isPubliclyVisible?: unknown;
  privacyAccepted?: unknown;
};

function readText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length <= maxLength ? text : null;
}

function readList(value: unknown, maxItems = 20) {
  if (!Array.isArray(value) || value.length > maxItems) return null;

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return items.every((item) => item.length <= 40)
    ? Array.from(new Set(items))
    : null;
}

async function loadProfile(supabase: SupabaseClient, userId: string) {
  const [profileResult, memberResult, consentResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, avatar_url, wechat, city, role_label, organization, monthly_time, bio, industry_tags, skills, interests, capability_summary, seeking_summary",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("members")
      .select(
        "willing_to_attend, willing_to_share, willing_to_join_projects, is_publicly_visible, onboarding_completed_at",
      )
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("miniapp_consents")
      .select("policy_version, accepted_at")
      .eq("user_id", userId)
      .eq("policy_version", MINIAPP_PRIVACY_POLICY_VERSION)
      .maybeSingle(),
  ]);

  if (profileResult.error || memberResult.error || consentResult.error) {
    throw new Error("profile_load_failed");
  }

  const profile = profileResult.data;
  const member = memberResult.data;
  const completion = getMiniappProfileCompletion({
    displayName: profile?.display_name,
    wechat: profile?.wechat,
    city: profile?.city,
    roleLabel: profile?.role_label,
    industryTags: profile?.industry_tags,
    skills: profile?.skills,
    capabilitySummary: profile?.capability_summary,
    seekingSummary: profile?.seeking_summary,
  });

  return {
    displayName: profile?.display_name ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    wechat: profile?.wechat ?? "",
    city: profile?.city ?? "常州",
    roleLabel: profile?.role_label ?? "",
    organization: profile?.organization ?? "",
    monthlyTime: profile?.monthly_time ?? "",
    bio: profile?.bio ?? "",
    industryTags: profile?.industry_tags ?? [],
    skills: profile?.skills ?? [],
    interests: profile?.interests ?? [],
    capabilitySummary: profile?.capability_summary ?? "",
    seekingSummary: profile?.seeking_summary ?? "",
    willingToAttend: member?.willing_to_attend ?? true,
    willingToShare: member?.willing_to_share ?? false,
    willingToJoinProjects: member?.willing_to_join_projects ?? false,
    isPubliclyVisible: member?.is_publicly_visible ?? false,
    privacyAccepted: Boolean(consentResult.data),
    privacyPolicyVersion: MINIAPP_PRIVACY_POLICY_VERSION,
    completion,
  };
}

function getProfileOptions() {
  return {
    industries: MINIAPP_INDUSTRY_OPTIONS,
    skills: MINIAPP_SKILL_OPTIONS,
  };
}

export async function GET(request: Request) {
  const context = await requireMiniappSession(request);
  if (context.response) return context.response;

  try {
    const profile = await loadProfile(
      context.supabase,
      context.session.user_id,
    );
    return miniappJson({ profile, options: getProfileOptions() });
  } catch {
    return miniappJson({ error: "profile_load_failed" }, 500);
  }
}

export async function PUT(request: Request) {
  const context = await requireMiniappSession(request);
  if (context.response) return context.response;

  const payload = (await request
    .json()
    .catch(() => null)) as ProfilePayload | null;
  const displayName = readText(payload?.displayName, 60);
  const wechat = readText(payload?.wechat, 80);
  const city = readText(payload?.city, 40);
  const roleLabel = readText(payload?.roleLabel, 80);
  const organization = readText(payload?.organization, 120);
  const monthlyTime = readText(payload?.monthlyTime, 80);
  const bio = readText(payload?.bio, 500);
  const industryTags =
    payload?.industryTags === undefined
      ? undefined
      : readList(payload.industryTags, 8);
  const skills = readList(payload?.skills);
  const interests = readList(payload?.interests);
  const capabilitySummary =
    payload?.capabilitySummary === undefined
      ? undefined
      : readText(payload.capabilitySummary, 300);
  const seekingSummary =
    payload?.seekingSummary === undefined
      ? undefined
      : readText(payload.seekingSummary, 300);

  if (
    !displayName ||
    !wechat ||
    city === null ||
    roleLabel === null ||
    organization === null ||
    monthlyTime === null ||
    bio === null ||
    industryTags === null ||
    skills === null ||
    interests === null ||
    capabilitySummary === null ||
    seekingSummary === null ||
    typeof payload?.willingToAttend !== "boolean" ||
    typeof payload.willingToShare !== "boolean" ||
    typeof payload.willingToJoinProjects !== "boolean" ||
    (payload.isPubliclyVisible !== undefined &&
      typeof payload.isPubliclyVisible !== "boolean")
  ) {
    return miniappJson({ error: "invalid_profile" }, 400);
  }

  if (payload.privacyAccepted !== true) {
    return miniappJson({ error: "privacy_consent_required" }, 400);
  }

  const now = new Date().toISOString();
  const userId = context.session.user_id;
  const profileUpdate = {
    display_name: displayName,
    wechat,
    city: city || "常州",
    role_label: roleLabel || null,
    organization: organization || null,
    monthly_time: monthlyTime || null,
    bio: bio || null,
    skills,
    interests,
    ...(industryTags === undefined ? {} : { industry_tags: industryTags }),
    ...(capabilitySummary === undefined
      ? {}
      : { capability_summary: capabilitySummary || null }),
    ...(seekingSummary === undefined
      ? {}
      : { seeking_summary: seekingSummary || null }),
  };
  const memberUpdate = {
    willing_to_attend: payload.willingToAttend,
    willing_to_share: payload.willingToShare,
    willing_to_join_projects: payload.willingToJoinProjects,
    onboarding_completed_at: now,
    ...(typeof payload.isPubliclyVisible === "boolean"
      ? { is_publicly_visible: payload.isPubliclyVisible }
      : {}),
  };
  const [profileResult, memberResult, consentResult] = await Promise.all([
    context.supabase.from("profiles").update(profileUpdate).eq("id", userId),
    context.supabase.from("members").update(memberUpdate).eq("id", userId),
    context.supabase.from("miniapp_consents").upsert(
      {
        user_id: userId,
        policy_version: MINIAPP_PRIVACY_POLICY_VERSION,
        accepted_at: now,
      },
      { onConflict: "user_id,policy_version" },
    ),
  ]);

  if (profileResult.error || memberResult.error || consentResult.error) {
    console.error("Failed to update mini-program profile.", {
      userId,
      profileError: profileResult.error?.code,
      memberError: memberResult.error?.code,
      consentError: consentResult.error?.code,
    });
    return miniappJson({ error: "profile_update_failed" }, 500);
  }

  const [profile, user] = await Promise.all([
    loadProfile(context.supabase, userId),
    loadMiniappAccountSnapshot(context.supabase, userId),
  ]);

  return miniappJson({ profile, user, options: getProfileOptions() });
}
