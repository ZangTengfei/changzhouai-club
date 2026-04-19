"use server";

import { redirect } from "next/navigation";

import { sendAdminCooperationLeadNotification } from "@/lib/email";
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
  const requirementType = getOptionalValue(formData, "requirement_type");
  const requirementSummary = String(formData.get("requirement_summary") ?? "").trim();
  const budgetRange = getOptionalValue(formData, "budget_range");
  const desiredTimeline = getOptionalValue(formData, "desired_timeline");

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
    requirement_type: requirementType,
    requirement_summary: requirementSummary,
    budget_range: budgetRange,
    desired_timeline: desiredTimeline,
  });

  if (error) {
    redirect("/cooperate?error=submit_failed");
  }

  try {
    await sendAdminCooperationLeadNotification({
      companyName,
      contactName,
      contactWechat,
      contactPhone,
      requirementType,
      requirementSummary,
      budgetRange,
      desiredTimeline,
    });
  } catch (notificationError) {
    console.error("Failed to send cooperation lead notification.", {
      notificationError,
      companyName,
    });
  }

  redirect("/cooperate?submitted=1");
}
