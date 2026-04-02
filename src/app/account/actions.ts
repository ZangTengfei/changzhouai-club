"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendAdminRegistrationNotification } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

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

export async function updateAccountProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  const [{ data: existingProfile }, { data: existingMember }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, wechat, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("members")
      .select("onboarding_completed_at, admin_registration_notified_at")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const displayName = String(formData.get("display_name") ?? "").trim();
  const rawAvatarUrl = String(formData.get("avatar_url") ?? "");
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

  if (!displayName || !wechat) {
    redirect("/account?error=missing_required_fields");
  }

  if (rawAvatarUrl.trim() && !avatarUrl) {
    redirect("/account?error=invalid_avatar_url");
  }

  const completedProfileNow = Boolean(displayName && wechat);
  const shouldMarkOnboardingComplete =
    completedProfileNow && !existingMember?.onboarding_completed_at;
  const shouldNotifyAdmin =
    completedProfileNow && !existingMember?.admin_registration_notified_at;
  const completionTimestamp =
    shouldMarkOnboardingComplete
      ? new Date().toISOString()
      : existingMember?.onboarding_completed_at ?? null;

  const [{ error: profileError }, { error: memberError }] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
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
        ...(completionTimestamp ? { onboarding_completed_at: completionTimestamp } : {}),
      })
      .eq("id", user.id),
  ]);

  if (profileError || memberError) {
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
  redirect("/account?updated=profile");
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
