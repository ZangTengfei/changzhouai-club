import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const projectOpportunityTypeLabels = {
  crowdsource: "众包任务",
  project: "项目协作",
  project_manager: "项目经理",
  enterprise: "政企项目",
  role: "角色招募",
  idea: "早期想法",
} as const;

export const projectOpportunityStatusLabels = {
  draft: "草稿",
  recruiting: "招募中",
  matching: "匹配中",
  in_progress: "推进中",
  filled: "已满员",
  closed: "已关闭",
  archived: "已归档",
} as const;

export const projectOpportunityVisibilityLabels = {
  public: "公开可见",
  members: "成员可见",
  private: "仅后台",
} as const;

export const projectApplicationStatusLabels = {
  new: "新申请",
  reviewing: "筛选中",
  contacted: "已联系",
  shortlisted: "初步合适",
  introduced: "已引荐",
  active: "进入推进",
  not_fit: "暂不匹配",
  withdrawn: "已撤回",
} as const;

export type PublicProjectOpportunityType = keyof typeof projectOpportunityTypeLabels;
export type PublicProjectOpportunityStatus = keyof typeof projectOpportunityStatusLabels;
export type PublicProjectOpportunityVisibility = keyof typeof projectOpportunityVisibilityLabels;
export type PublicProjectApplicationStatus = keyof typeof projectApplicationStatusLabels;

type PublicProjectOpportunityRow = {
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
  application_requires_login: boolean;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicProjectOpportunity = {
  id: string;
  slug: string;
  href: string;
  title: string;
  summary: string;
  description: string | null;
  type: PublicProjectOpportunityType;
  typeLabel: string;
  status: PublicProjectOpportunityStatus;
  statusLabel: string;
  visibility: PublicProjectOpportunityVisibility;
  visibilityLabel: string;
  roleTags: string[];
  topicTags: string[];
  headcountLabel: string | null;
  timeCommitment: string | null;
  compensation: string | null;
  deadlineAt: string | null;
  deadlineLabel: string | null;
  location: string | null;
  applicationCta: string;
  applicationNote: string | null;
  applicationRequiresLogin: boolean;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicProjectOpportunityDirectory = {
  opportunities: PublicProjectOpportunity[];
  featuredOpportunities: PublicProjectOpportunity[];
  stats: {
    opportunities: number;
    recruiting: number;
    enterprise: number;
    roleCount: number;
  };
};

const visibleProjectSelect = [
  "id",
  "slug",
  "title",
  "summary",
  "description",
  "opportunity_type",
  "status",
  "visibility",
  "role_tags",
  "topic_tags",
  "headcount_label",
  "time_commitment",
  "compensation",
  "deadline_at",
  "location",
  "application_cta",
  "application_note",
  "application_requires_login",
  "sort_order",
  "is_featured",
  "created_at",
  "updated_at",
].join(", ");

function formatDeadline(value: string | null) {
  if (!value) {
    return null;
  }

  return formatChangzhouDateTime(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function mapProjectOpportunity(row: PublicProjectOpportunityRow): PublicProjectOpportunity {
  return {
    id: row.id,
    slug: row.slug,
    href: `/projects/${row.slug}`,
    title: row.title.trim(),
    summary: row.summary.trim(),
    description: row.description,
    type: row.opportunity_type,
    typeLabel: projectOpportunityTypeLabels[row.opportunity_type] ?? row.opportunity_type,
    status: row.status,
    statusLabel: projectOpportunityStatusLabels[row.status] ?? row.status,
    visibility: row.visibility,
    visibilityLabel: projectOpportunityVisibilityLabels[row.visibility] ?? row.visibility,
    roleTags: row.role_tags ?? [],
    topicTags: row.topic_tags ?? [],
    headcountLabel: row.headcount_label,
    timeCommitment: row.time_commitment,
    compensation: row.compensation,
    deadlineAt: row.deadline_at,
    deadlineLabel: formatDeadline(row.deadline_at),
    location: row.location,
    applicationCta: row.application_cta?.trim() || "申请参与",
    applicationNote: row.application_note,
    applicationRequiresLogin: Boolean(row.application_requires_login),
    sortOrder: row.sort_order,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function emptyProjectOpportunityDirectory(): PublicProjectOpportunityDirectory {
  return {
    opportunities: [],
    featuredOpportunities: [],
    stats: {
      opportunities: 0,
      recruiting: 0,
      enterprise: 0,
      roleCount: 0,
    },
  };
}

function shouldIgnoreProjectOpportunityError(error: { code?: string }) {
  return error.code === "PGRST205" || error.code === "PGRST204";
}

export async function getVisibleProjectOpportunities(): Promise<PublicProjectOpportunityDirectory> {
  if (!hasSupabaseEnv()) {
    return emptyProjectOpportunityDirectory();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_opportunities")
    .select(visibleProjectSelect)
    .neq("status", "draft")
    .neq("status", "archived")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    if (!shouldIgnoreProjectOpportunityError(error)) {
      console.error("Failed to load public project opportunities.", error);
    }

    return emptyProjectOpportunityDirectory();
  }

  const opportunities = ((data ?? []) as unknown as PublicProjectOpportunityRow[]).map(
    mapProjectOpportunity,
  );
  const roleTags = new Set(opportunities.flatMap((opportunity) => opportunity.roleTags));

  return {
    opportunities,
    featuredOpportunities: opportunities.filter((opportunity) => opportunity.isFeatured).slice(0, 3),
    stats: {
      opportunities: opportunities.length,
      recruiting: opportunities.filter((opportunity) => opportunity.status === "recruiting").length,
      enterprise: opportunities.filter((opportunity) => opportunity.type === "enterprise").length,
      roleCount: roleTags.size,
    },
  };
}

export async function getVisibleProjectOpportunityBySlug(slug: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_opportunities")
    .select(visibleProjectSelect)
    .eq("slug", slug)
    .neq("status", "draft")
    .maybeSingle();

  if (error) {
    if (!shouldIgnoreProjectOpportunityError(error)) {
      console.error("Failed to load project opportunity.", { slug, error });
    }

    return null;
  }

  return data ? mapProjectOpportunity(data as unknown as PublicProjectOpportunityRow) : null;
}
