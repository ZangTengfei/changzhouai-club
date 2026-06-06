"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendAdminRegistrationNotification } from "@/lib/email";
import {
  getMemberPublicSlugPath,
  isValidMemberPublicSlug,
  normalizeMemberPublicSlug,
} from "@/lib/member-public-slug";
import { createClient } from "@/lib/supabase/server";

const WORK_TYPES = new Set([
  "product",
  "project",
  "tool",
  "open_source",
  "case",
  "demo",
  "service",
]);
const WORK_STATUSES = new Set(["idea", "building", "launched", "paused", "archived"]);

function isMissingSchemaColumnError(error: { code?: string | null } | null | undefined) {
  return error?.code === "PGRST204";
}

function normalizeSkills(raw: string) {
  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTags(raw: string) {
  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAvatarUrl(raw: string) {
  const value = raw.trim();

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeOptionalUrl(raw: string) {
  const value = raw.trim();

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function getWorkType(value: string) {
  const normalized = value.trim();
  return WORK_TYPES.has(normalized) ? normalized : "product";
}

function getWorkStatus(value: string) {
  const normalized = value.trim();
  return WORK_STATUSES.has(normalized) ? normalized : "building";
}

function isUniqueViolationError(error: { code?: string | null } | null | undefined) {
  return error?.code === "23505";
}

export async function updateAccountProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const [{ data: existingProfile }, existingMemberResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, wechat, email, public_slug")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("members")
      .select("onboarding_completed_at, admin_registration_notified_at")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  const existingMember = existingMemberResult.data;
  const supportsRegistrationTracking = !isMissingSchemaColumnError(
    existingMemberResult.error,
  );

  if (existingMemberResult.error && supportsRegistrationTracking) {
    console.error("Failed to load account member tracking fields.", {
      memberError: existingMemberResult.error,
      userId: user.id,
    });
  }

  const displayName = String(formData.get("display_name") ?? "").trim();
  const rawAvatarUrl = String(formData.get("avatar_url") ?? "");
  const rawPublicSlug = String(formData.get("public_slug") ?? "");
  const wechat = String(formData.get("wechat") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || "常州";
  const roleLabel = String(formData.get("role_label") ?? "").trim();
  const organization = String(formData.get("organization") ?? "").trim();
  const monthlyTime = String(formData.get("monthly_time") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const skills = normalizeSkills(String(formData.get("skills") ?? ""));
  const interests = normalizeTags(String(formData.get("interests") ?? ""));
  const willingToAttend = formData.get("willing_to_attend") === "on";
  const willingToShare = formData.get("willing_to_share") === "on";
  const willingToJoinProjects = formData.get("willing_to_join_projects") === "on";
  const avatarUrl = normalizeAvatarUrl(rawAvatarUrl);
  const publicSlug = normalizeMemberPublicSlug(rawPublicSlug);

  if (!displayName || !wechat) {
    redirect("/account?error=missing_required_fields");
  }

  if (rawAvatarUrl.trim() && !avatarUrl) {
    redirect("/account?error=invalid_avatar_url");
  }

  if (publicSlug && !isValidMemberPublicSlug(publicSlug)) {
    redirect("/account?error=invalid_public_slug");
  }

  const completedProfileNow = Boolean(displayName && wechat);
  const shouldMarkOnboardingComplete =
    supportsRegistrationTracking &&
    completedProfileNow &&
    !existingMember?.onboarding_completed_at;
  const shouldNotifyAdmin =
    supportsRegistrationTracking &&
    completedProfileNow &&
    !existingMember?.admin_registration_notified_at;
  const completionTimestamp =
    shouldMarkOnboardingComplete
      ? new Date().toISOString()
      : existingMember?.onboarding_completed_at ?? null;

  const [{ error: profileError }, { error: memberError }] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        public_slug: publicSlug,
        avatar_url: avatarUrl,
        wechat,
        city,
        role_label: roleLabel || null,
        organization: organization || null,
        monthly_time: monthlyTime || null,
        bio: bio || null,
        skills,
        interests,
      })
      .eq("id", user.id),
    supabase
      .from("members")
      .update({
        willing_to_attend: willingToAttend,
        willing_to_share: willingToShare,
        willing_to_join_projects: willingToJoinProjects,
        ...(supportsRegistrationTracking && completionTimestamp
          ? { onboarding_completed_at: completionTimestamp }
          : {}),
      })
      .eq("id", user.id),
  ]);

  if (profileError || memberError) {
    if (isUniqueViolationError(profileError)) {
      redirect("/account?error=public_slug_taken");
    }

    console.error("Failed to update account profile.", {
      profileError,
      memberError,
      userId: user.id,
    });
    redirect("/account?error=save_failed");
  }

  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: {
      avatar_url: avatarUrl,
    },
  });

  if (authUpdateError) {
    console.error("Failed to update auth avatar metadata.", {
      authUpdateError,
      userId: user.id,
    });
  }

  if (shouldNotifyAdmin) {
    const notificationSent = await sendAdminRegistrationNotification({
      userId: user.id,
      email: user.email ?? existingProfile?.email ?? null,
      displayName,
      wechat,
      city,
      roleLabel: roleLabel || null,
      organization: organization || null,
      monthlyTime: monthlyTime || null,
      bio: bio || null,
      skills,
      interests,
      willingToAttend,
      willingToShare,
      willingToJoinProjects,
    });

    if (notificationSent) {
      await supabase
        .from("members")
        .update({
          admin_registration_notified_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .is("admin_registration_notified_at", null);
    }
  }

  revalidatePath("/account");
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath(`/members/${user.id}`);

  if (existingProfile?.public_slug) {
    revalidatePath(`/members/${existingProfile.public_slug}`);
  }

  if (publicSlug) {
    revalidatePath(getMemberPublicSlugPath({ id: user.id, publicSlug }));
  }

  redirect("/account?updated=profile");
}

export async function saveAccountMemberWork(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const workId = String(formData.get("work_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const websiteUrl = normalizeOptionalUrl(String(formData.get("website_url") ?? ""));
  const demoUrl = normalizeOptionalUrl(String(formData.get("demo_url") ?? ""));
  const repoUrl = normalizeOptionalUrl(String(formData.get("repo_url") ?? ""));
  const coverImageUrl = normalizeOptionalUrl(String(formData.get("cover_image_url") ?? ""));
  const hasInvalidUrl =
    (String(formData.get("website_url") ?? "").trim() && !websiteUrl) ||
    (String(formData.get("demo_url") ?? "").trim() && !demoUrl) ||
    (String(formData.get("repo_url") ?? "").trim() && !repoUrl) ||
    (String(formData.get("cover_image_url") ?? "").trim() && !coverImageUrl);

  if (!title || !summary) {
    redirect("/account?error=missing_work_fields#works");
  }

  if (hasInvalidUrl) {
    redirect("/account?error=invalid_work_url#works");
  }

  const payload = {
    member_id: user.id,
    title,
    summary,
    description: String(formData.get("description") ?? "").trim() || null,
    work_type: getWorkType(String(formData.get("work_type") ?? "")),
    status: getWorkStatus(String(formData.get("status") ?? "")),
    review_status: "pending",
    role_label: String(formData.get("role_label") ?? "").trim() || null,
    cover_image_url: coverImageUrl,
    website_url: websiteUrl,
    repo_url: repoUrl,
    demo_url: demoUrl,
    tags: normalizeTags(String(formData.get("tags") ?? "")),
    sort_order: 0,
    is_public: false,
    is_featured: false,
  };

  if (workId) {
    const { error } = await supabase
      .from("member_works")
      .update(payload)
      .eq("id", workId)
      .eq("member_id", user.id);

    if (error) {
      console.error("Failed to update account member work.", {
        error,
        workId,
        userId: user.id,
      });
      redirect("/account?error=work_save_failed#works");
    }
  } else {
    const { error } = await supabase.from("member_works").insert({
      ...payload,
      created_by: user.id,
    });

    if (error) {
      console.error("Failed to submit account member work.", {
        error,
        userId: user.id,
      });
      redirect("/account?error=work_save_failed#works");
    }
  }

  revalidatePath("/account");
  revalidatePath("/works");
  revalidatePath(`/members/${user.id}`);
  redirect("/account?updated=work#works");
}

export async function deleteAccountMemberWork(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const workId = String(formData.get("work_id") ?? "").trim();

  if (workId) {
    const { error } = await supabase
      .from("member_works")
      .delete()
      .eq("id", workId)
      .eq("member_id", user.id)
      .eq("is_public", false);

    if (error) {
      console.error("Failed to delete account member work.", {
        error,
        workId,
        userId: user.id,
      });
      redirect("/account?error=work_save_failed#works");
    }
  }

  revalidatePath("/account");
  revalidatePath("/works");
  revalidatePath(`/members/${user.id}`);
  redirect("/account?updated=work_deleted#works");
}

export async function cancelRegistration(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const registrationId = String(formData.get("registration_id") ?? "").trim();

  if (registrationId) {
    await supabase
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("id", registrationId)
      .eq("user_id", user.id);
  }

  revalidatePath("/account");
  revalidatePath("/events");
  redirect("/account?updated=registration");
}
