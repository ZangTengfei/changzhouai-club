import { requireStaffContext } from "@/lib/supabase/guards";

import type {
  PublicProjectApplicationStatus,
  PublicProjectOpportunityStatus,
  PublicProjectOpportunityType,
  PublicProjectOpportunityVisibility,
} from "@/lib/community-projects";

export type AdminProjectOpportunityRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  opportunity_type: PublicProjectOpportunityType;
  status: PublicProjectOpportunityStatus;
  visibility: PublicProjectOpportunityVisibility;
  role_tags: string[] | null;
  topic_tags: string[] | null;
  headcount_label: string | null;
  time_commitment: string | null;
  compensation: string | null;
  deadline_at: string | null;
  location: string | null;
  application_cta: string | null;
  application_note: string | null;
  source_lead_id: string | null;
  owner_id: string | null;
  created_by: string | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminProjectApplicationRow = {
  id: string;
  project_id: string;
  applicant_user_id: string | null;
  applicant_name: string;
  contact_wechat: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  role_interest: string | null;
  available_time: string | null;
  experience_summary: string | null;
  portfolio_url: string | null;
  note: string | null;
  status: PublicProjectApplicationStatus;
  admin_note: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

type AdminProjectProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

export type AdminProjectApplication = AdminProjectApplicationRow & {
  applicantDisplayName: string;
  applicantEmail: string | null;
};

export type AdminProjectOpportunity = Omit<
  AdminProjectOpportunityRow,
  "role_tags" | "topic_tags"
> & {
  role_tags: string[];
  topic_tags: string[];
  ownerDisplayName: string | null;
  ownerEmail: string | null;
  applications: AdminProjectApplication[];
  applicationCount: number;
};

export type AdminProjectsData = {
  opportunities: AdminProjectOpportunity[];
  stats: {
    total: number;
    recruiting: number;
    visible: number;
    applications: number;
  };
  queryErrors: string[];
};

function getDisplayName(profile?: AdminProjectProfileRow) {
  return profile?.display_name?.trim() || profile?.email || "未填写显示名";
}

export async function loadAdminProjectsData(): Promise<AdminProjectsData> {
  const { supabase } = await requireStaffContext();
  const [
    { data: opportunitiesData, error: opportunitiesError },
    { data: applicationsData, error: applicationsError },
    { data: profilesData, error: profilesError },
  ] = await Promise.all([
    supabase
      .from("project_opportunities")
      .select(
        "id, slug, title, summary, description, opportunity_type, status, visibility, role_tags, topic_tags, headcount_label, time_commitment, compensation, deadline_at, location, application_cta, application_note, source_lead_id, owner_id, created_by, sort_order, is_featured, created_at, updated_at",
      )
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .from("project_applications")
      .select(
        "id, project_id, applicant_user_id, applicant_name, contact_wechat, contact_phone, contact_email, role_interest, available_time, experience_summary, portfolio_url, note, status, admin_note, owner_id, created_at, updated_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, email"),
  ]);

  const profiles = (profilesData ?? []) as AdminProjectProfileRow[];
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const applicationsByProjectId = new Map<string, AdminProjectApplication[]>();

  ((applicationsData ?? []) as AdminProjectApplicationRow[]).forEach((application) => {
    const profile = application.applicant_user_id
      ? profilesById.get(application.applicant_user_id)
      : undefined;
    const applications = applicationsByProjectId.get(application.project_id) ?? [];

    applications.push({
      ...application,
      applicantDisplayName: profile ? getDisplayName(profile) : application.applicant_name,
      applicantEmail: profile?.email ?? application.contact_email,
    });
    applicationsByProjectId.set(application.project_id, applications);
  });

  const opportunities = ((opportunitiesData ?? []) as AdminProjectOpportunityRow[]).map(
    (opportunity) => {
      const ownerProfile = opportunity.owner_id ? profilesById.get(opportunity.owner_id) : undefined;
      const applications = applicationsByProjectId.get(opportunity.id) ?? [];

      return {
        ...opportunity,
        role_tags: opportunity.role_tags ?? [],
        topic_tags: opportunity.topic_tags ?? [],
        ownerDisplayName: ownerProfile ? getDisplayName(ownerProfile) : null,
        ownerEmail: ownerProfile?.email ?? null,
        applications,
        applicationCount: applications.length,
      };
    },
  );

  return {
    opportunities,
    stats: {
      total: opportunities.length,
      recruiting: opportunities.filter((opportunity) => opportunity.status === "recruiting").length,
      visible: opportunities.filter((opportunity) => opportunity.visibility !== "private").length,
      applications: ((applicationsData ?? []) as AdminProjectApplicationRow[]).length,
    },
    queryErrors: [
      opportunitiesError?.message,
      applicationsError?.message,
      profilesError?.message,
    ].filter(Boolean) as string[],
  };
}
