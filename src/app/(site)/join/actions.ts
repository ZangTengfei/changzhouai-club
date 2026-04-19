"use server";

import { redirect } from "next/navigation";

import { sendAdminJoinRequestNotification } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

function parseTags(raw: string) {
  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getOptionalValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function submitJoinRequest(formData: FormData) {
  const supabase = await createClient();

  const displayName = String(formData.get("display_name") ?? "").trim();
  const wechat = String(formData.get("wechat") ?? "").trim();
  const city = getOptionalValue(formData, "city") ?? "常州";
  const roleLabel = getOptionalValue(formData, "role_label");
  const organization = getOptionalValue(formData, "organization");
  const monthlyTime = getOptionalValue(formData, "monthly_time");
  const skills = parseTags(String(formData.get("skills") ?? ""));
  const interests = parseTags(String(formData.get("interests") ?? ""));
  const note = getOptionalValue(formData, "note");
  const willingToAttend = formData.get("willing_to_attend") === "on";
  const willingToShare = formData.get("willing_to_share") === "on";
  const willingToJoinProjects = formData.get("willing_to_join_projects") === "on";

  if (!displayName || !wechat) {
    redirect("/join?error=missing_required_fields");
  }

  const { error } = await supabase.from("community_join_requests").insert({
    display_name: displayName,
    wechat,
    city,
    role_label: roleLabel,
    organization,
    monthly_time: monthlyTime,
    skills,
    interests,
    note,
    willing_to_attend: willingToAttend,
    willing_to_share: willingToShare,
    willing_to_join_projects: willingToJoinProjects,
  });

  if (error) {
    redirect("/join?error=submit_failed");
  }

  try {
    await sendAdminJoinRequestNotification({
      displayName,
      wechat,
      city,
      roleLabel,
      organization,
      monthlyTime,
      skills,
      interests,
      note,
      willingToAttend,
      willingToShare,
      willingToJoinProjects,
    });
  } catch (notificationError) {
    console.error("Failed to send join request notification.", {
      notificationError,
      displayName,
      wechat,
    });
  }

  redirect("/join?submitted=1");
}
