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
  created_at: string;
  updated_at: string;
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
  createdAt: string;
  updatedAt: string;
};

export type AdminLeadsData = {
  leads: AdminLead[];
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

  const { data, error } = await supabase
    .from("cooperation_leads")
    .select(
      "id, company_name, contact_name, contact_wechat, contact_phone, requirement_type, requirement_summary, budget_range, desired_timeline, status, owner_id, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

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
    stats: {
      total: leads.length,
      newCount: leads.filter((lead) => lead.status === "new").length,
      contactedCount: leads.filter((lead) => lead.status === "contacted").length,
      qualifiedCount: leads.filter((lead) => lead.status === "qualified").length,
    },
    queryErrors: error?.message ? [error.message] : [],
  };
}
