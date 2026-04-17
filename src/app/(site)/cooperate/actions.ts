"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getOptionalValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function submitCooperationLead(formData: FormData) {
  const supabase = await createClient();

  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = getOptionalValue(formData, "contact_name");
  const contactWechat = getOptionalValue(formData, "contact_wechat");
  const contactPhone = getOptionalValue(formData, "contact_phone");
  const requirementSummary = String(formData.get("requirement_summary") ?? "").trim();

  if (!companyName || !requirementSummary) {
    redirect("/cooperate?error=missing_required_fields");
  }

  if (!contactWechat && !contactPhone) {
    redirect("/cooperate?error=missing_contact_channel");
  }

  const { error } = await supabase.from("cooperation_leads").insert({
    company_name: companyName,
    contact_name: contactName,
    contact_wechat: contactWechat,
    contact_phone: contactPhone,
    requirement_type: getOptionalValue(formData, "requirement_type"),
    requirement_summary: requirementSummary,
    budget_range: getOptionalValue(formData, "budget_range"),
    desired_timeline: getOptionalValue(formData, "desired_timeline"),
  });

  if (error) {
    redirect("/cooperate?error=submit_failed");
  }

  redirect("/cooperate?submitted=1");
}
