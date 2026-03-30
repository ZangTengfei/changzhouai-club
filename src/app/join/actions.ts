"use server";

import { redirect } from "next/navigation";

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

  if (!displayName || !wechat) {
    redirect("/join?error=missing_required_fields");
  }

  const { error } = await supabase.from("community_join_requests").insert({
    display_name: displayName,
    wechat,
    city: getOptionalValue(formData, "city") ?? "常州",
    role_label: getOptionalValue(formData, "role_label"),
    organization: getOptionalValue(formData, "organization"),
    monthly_time: getOptionalValue(formData, "monthly_time"),
    skills: parseTags(String(formData.get("skills") ?? "")),
    interests: parseTags(String(formData.get("interests") ?? "")),
    note: getOptionalValue(formData, "note"),
    willing_to_attend: formData.get("willing_to_attend") === "on",
    willing_to_share: formData.get("willing_to_share") === "on",
    willing_to_join_projects: formData.get("willing_to_join_projects") === "on",
  });

  if (error) {
    redirect("/join?error=submit_failed");
  }

  redirect("/join?submitted=1");
}
