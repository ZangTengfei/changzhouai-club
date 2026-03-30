import { notFound } from "next/navigation";

import { getStaffContext } from "@/lib/supabase/guards";

type AdminLeadRow = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_wechat: string | null;
  contact_phone: string | null;
  requirement_type: string | null;
  requirement_summary: string;
  budget_range: string | null;
  desired_timeline: string | null;
  status: string;
  owner_id: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type AdminLeadProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

type AdminLeadMemberRow = {
  id: string;
  status: string;
};

export type AdminLead = {
  id: string;
  companyName: string;
  contactName: string | null;
  contactWechat: string | null;
  contactPhone: string | null;
  requirementType: string | null;
  requirementSummary: string;
  budgetRange: string | null;
  desiredTimeline: string | null;
  status: string;
  ownerId: string | null;
  ownerDisplayName: string | null;
  ownerEmail: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminLeadStaffOption = {
  id: string;
  displayName: string;
  email: string | null;
};

export type AdminLeadsData = {
  leads: AdminLead[];
  staffOptions: AdminLeadStaffOption[];
  stats: {
    total: number;
    newCount: number;
    contactedCount: number;
    qualifiedCount: number;
  };
  queryErrors: string[];
};

function getLeadSortWeight(status: string) {
  switch (status) {
    case "new":
      return 0;
    case "contacted":
      return 1;
    case "qualified":
      return 2;
    case "won":
      return 3;
    case "lost":
      return 4;
    default:
      return 5;
  }
}

export async function loadAdminLeadsData(): Promise<AdminLeadsData> {
  const { supabase } = await getStaffContext();

  const [
    { data, error },
    { data: profilesData, error: profilesError },
    { data: membersData, error: membersError },
  ] = await Promise.all([
    supabase
      .from("cooperation_leads")
      .select(
        "id, company_name, contact_name, contact_wechat, contact_phone, requirement_type, requirement_summary, budget_range, desired_timeline, status, owner_id, admin_note, created_at, updated_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, email"),
    supabase.from("members").select("id, status"),
  ]);

  const profiles = (profilesData ?? []) as AdminLeadProfileRow[];
  const members = (membersData ?? []) as AdminLeadMemberRow[];
  const staffIds = new Set(
    members
      .filter((member) => ["organizer", "admin"].includes(member.status))
      .map((member) => member.id),
  );
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const staffOptions = profiles
    .filter((profile) => staffIds.has(profile.id))
    .map((profile) => ({
      id: profile.id,
      displayName: profile.display_name?.trim() || profile.email || "未填写显示名",
      email: profile.email,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "zh-CN"));

  const leads = ((data ?? []) as AdminLeadRow[])
    .map((lead) => ({
      id: lead.id,
      companyName: lead.company_name,
      contactName: lead.contact_name,
      contactWechat: lead.contact_wechat,
      contactPhone: lead.contact_phone,
      requirementType: lead.requirement_type,
      requirementSummary: lead.requirement_summary,
      budgetRange: lead.budget_range,
      desiredTimeline: lead.desired_timeline,
      status: lead.status,
      ownerId: lead.owner_id,
      ownerDisplayName: lead.owner_id
        ? profilesById.get(lead.owner_id)?.display_name?.trim() ||
          profilesById.get(lead.owner_id)?.email ||
          "未填写显示名"
        : null,
      ownerEmail: lead.owner_id ? profilesById.get(lead.owner_id)?.email ?? null : null,
      adminNote: lead.admin_note,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
    }))
    .sort((a, b) => {
      const weightDiff = getLeadSortWeight(a.status) - getLeadSortWeight(b.status);

      if (weightDiff !== 0) {
        return weightDiff;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return {
    leads,
    staffOptions,
    stats: {
      total: leads.length,
      newCount: leads.filter((lead) => lead.status === "new").length,
      contactedCount: leads.filter((lead) => lead.status === "contacted").length,
      qualifiedCount: leads.filter((lead) => lead.status === "qualified").length,
    },
    queryErrors: [error?.message, profilesError?.message, membersError?.message].filter(
      Boolean,
    ) as string[],
  };
}

export async function loadAdminLeadOrThrow(leadId: string) {
  const { leads, staffOptions, queryErrors } = await loadAdminLeadsData();
  const lead = leads.find((item) => item.id === leadId);

  if (!lead) {
    notFound();
  }

  return {
    lead,
    staffOptions,
    queryErrors,
  };
}
