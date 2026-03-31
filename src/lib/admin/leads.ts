import { notFound } from "next/navigation";

import { getStaffContextResult, requireStaffContext } from "@/lib/supabase/guards";

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
  next_action: string | null;
  next_action_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

type AdminLeadProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  city: string | null;
  skills: string[] | null;
};

type AdminLeadMemberRow = {
  id: string;
  status: string;
};

type AdminLeadMatchRow = {
  id: string;
  lead_id: string;
  member_id: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminLeadMatch = {
  id: string;
  memberId: string;
  memberDisplayName: string;
  memberEmail: string | null;
  memberCity: string;
  memberSkills: string[];
  memberStatus: string;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
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
  nextAction: string | null;
  nextActionAt: string | null;
  lastContactedAt: string | null;
  matchCount: number;
  matches: AdminLeadMatch[];
  createdAt: string;
  updatedAt: string;
};

export type AdminLeadStaffOption = {
  id: string;
  displayName: string;
  email: string | null;
};

export type AdminLeadMemberOption = {
  id: string;
  displayName: string;
  email: string | null;
  city: string;
  skills: string[];
  status: string;
};

export type AdminLeadsData = {
  leads: AdminLead[];
  staffOptions: AdminLeadStaffOption[];
  memberOptions: AdminLeadMemberOption[];
  stats: {
    total: number;
    newCount: number;
    contactedCount: number;
    qualifiedCount: number;
    matchedCount: number;
  };
  queryErrors: string[];
};

type StaffContext = Awaited<ReturnType<typeof getStaffContextResult>>;

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

function getProfileDisplayName(profile?: AdminLeadProfileRow) {
  return profile?.display_name?.trim() || profile?.email || "未填写显示名";
}

export async function loadAdminLeadsData(
  context?: StaffContext,
): Promise<AdminLeadsData> {
  const { supabase } = context ?? (await requireStaffContext());

  const [
    { data, error },
    { data: profilesData, error: profilesError },
    { data: membersData, error: membersError },
    { data: matchesData, error: matchesError },
  ] = await Promise.all([
    supabase
      .from("cooperation_leads")
      .select(
        "id, company_name, contact_name, contact_wechat, contact_phone, requirement_type, requirement_summary, budget_range, desired_timeline, status, owner_id, admin_note, next_action, next_action_at, last_contacted_at, created_at, updated_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, email, city, skills"),
    supabase.from("members").select("id, status"),
    supabase
      .from("cooperation_lead_matches")
      .select("id, lead_id, member_id, status, note, created_at, updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  const profiles = (profilesData ?? []) as AdminLeadProfileRow[];
  const members = (membersData ?? []) as AdminLeadMemberRow[];
  const matches = (matchesData ?? []) as AdminLeadMatchRow[];
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const membersById = new Map(members.map((member) => [member.id, member]));

  const staffIds = new Set(
    members
      .filter((member) => ["organizer", "admin"].includes(member.status))
      .map((member) => member.id),
  );

  const staffOptions = profiles
    .filter((profile) => staffIds.has(profile.id))
    .map((profile) => ({
      id: profile.id,
      displayName: getProfileDisplayName(profile),
      email: profile.email,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "zh-CN"));

  const memberOptions = members
    .filter((member) => ["active", "organizer", "admin"].includes(member.status))
    .map((member) => {
      const profile = profilesById.get(member.id);

      return {
        id: member.id,
        displayName: getProfileDisplayName(profile),
        email: profile?.email ?? null,
        city: profile?.city?.trim() || "常州",
        skills: profile?.skills ?? [],
        status: member.status,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "zh-CN"));

  const matchesByLeadId = new Map<string, AdminLeadMatch[]>();

  matches.forEach((match) => {
    const profile = profilesById.get(match.member_id);
    const member = membersById.get(match.member_id);
    const items = matchesByLeadId.get(match.lead_id) ?? [];

    items.push({
      id: match.id,
      memberId: match.member_id,
      memberDisplayName: getProfileDisplayName(profile),
      memberEmail: profile?.email ?? null,
      memberCity: profile?.city?.trim() || "常州",
      memberSkills: profile?.skills ?? [],
      memberStatus: member?.status ?? "active",
      status: match.status,
      note: match.note,
      createdAt: match.created_at,
      updatedAt: match.updated_at,
    });

    matchesByLeadId.set(match.lead_id, items);
  });

  const leads = ((data ?? []) as AdminLeadRow[])
    .map((lead) => {
      const leadMatches = matchesByLeadId.get(lead.id) ?? [];

      return {
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
          ? getProfileDisplayName(profilesById.get(lead.owner_id))
          : null,
        ownerEmail: lead.owner_id ? profilesById.get(lead.owner_id)?.email ?? null : null,
        adminNote: lead.admin_note,
        nextAction: lead.next_action,
        nextActionAt: lead.next_action_at,
        lastContactedAt: lead.last_contacted_at,
        matchCount: leadMatches.length,
        matches: leadMatches,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      };
    })
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
    memberOptions,
    stats: {
      total: leads.length,
      newCount: leads.filter((lead) => lead.status === "new").length,
      contactedCount: leads.filter((lead) => lead.status === "contacted").length,
      qualifiedCount: leads.filter((lead) => lead.status === "qualified").length,
      matchedCount: leads.filter((lead) => lead.matchCount > 0).length,
    },
    queryErrors: [
      error?.message,
      profilesError?.message,
      membersError?.message,
      matchesError?.message,
    ].filter(Boolean) as string[],
  };
}

export async function loadAdminLeadOrThrow(leadId: string) {
  const { leads, staffOptions, memberOptions, queryErrors } = await loadAdminLeadsData();
  const lead = leads.find((item) => item.id === leadId);

  if (!lead) {
    notFound();
  }

  return {
    lead,
    staffOptions,
    memberOptions,
    queryErrors,
  };
}
