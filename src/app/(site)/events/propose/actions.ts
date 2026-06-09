"use server";

import { redirect } from "next/navigation";

import { sendAdminEventProposalNotification } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

const PROPOSAL_PATH = "/events/propose";
const REQUIREMENT_TYPE = "成员活动发起申请";

function getOptionalValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function buildRequirementSummary({
  topicTitle,
  proposalSummary,
  initiatorRole,
  preferredFormat,
  expectedSupport,
}: {
  topicTitle: string;
  proposalSummary: string;
  initiatorRole: string | null;
  preferredFormat: string | null;
  expectedSupport: string | null;
}) {
  return [
    `分享主题：${topicTitle}`,
    initiatorRole ? `发起人背景：${initiatorRole}` : null,
    preferredFormat ? `建议形式：${preferredFormat}` : null,
    "",
    "主题简介：",
    proposalSummary,
    expectedSupport ? `\n希望社区支持：\n${expectedSupport}` : null,
  ]
    .filter((item): item is string => item !== null)
    .join("\n");
}

export async function submitEventProposal(formData: FormData) {
  const supabase = await createClient();

  const initiatorName = String(formData.get("initiator_name") ?? "").trim();
  const contactWechat = getOptionalValue(formData, "contact_wechat");
  const contactPhone = getOptionalValue(formData, "contact_phone");
  const organization = getOptionalValue(formData, "organization");
  const initiatorRole = getOptionalValue(formData, "initiator_role");
  const topicTitle = String(formData.get("topic_title") ?? "").trim();
  const preferredFormat = getOptionalValue(formData, "preferred_format");
  const desiredTimeline = getOptionalValue(formData, "desired_timeline");
  const proposalSummary = String(formData.get("proposal_summary") ?? "").trim();
  const expectedSupport = getOptionalValue(formData, "expected_support");

  if (!initiatorName || !topicTitle || !proposalSummary) {
    redirect(`${PROPOSAL_PATH}?error=missing_required_fields`);
  }

  if (!contactWechat && !contactPhone) {
    redirect(`${PROPOSAL_PATH}?error=missing_contact_channel`);
  }

  const companyName = organization
    ? `${initiatorName} / ${organization}`
    : `社区成员：${initiatorName}`;
  const requirementSummary = buildRequirementSummary({
    topicTitle,
    proposalSummary,
    initiatorRole,
    preferredFormat,
    expectedSupport,
  });

  const { error } = await supabase.from("cooperation_leads").insert({
    company_name: companyName,
    contact_name: initiatorName,
    contact_wechat: contactWechat,
    contact_phone: contactPhone,
    requirement_type: REQUIREMENT_TYPE,
    requirement_summary: requirementSummary,
    budget_range: null,
    desired_timeline: desiredTimeline,
  });

  if (error) {
    redirect(`${PROPOSAL_PATH}?error=submit_failed`);
  }

  try {
    await sendAdminEventProposalNotification({
      initiatorName,
      contactWechat,
      contactPhone,
      organization,
      initiatorRole,
      topicTitle,
      preferredFormat,
      desiredTimeline,
      proposalSummary,
      expectedSupport,
    });
  } catch (notificationError) {
    console.error("Failed to send event proposal notification.", {
      notificationError,
      initiatorName,
      topicTitle,
    });
  }

  redirect(`${PROPOSAL_PATH}?submitted=1`);
}
