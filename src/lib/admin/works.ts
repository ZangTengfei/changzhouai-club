import { requireStaffContext } from "@/lib/supabase/guards";

export type AdminWorkType =
  | "product"
  | "project"
  | "tool"
  | "open_source"
  | "case"
  | "demo"
  | "service";

export type AdminWorkStatus = "idea" | "building" | "launched" | "paused" | "archived";
export type AdminWorkReviewStatus = "pending" | "approved" | "changes_requested" | "rejected";

export type AdminMemberWorkRow = {
  id: string;
  member_id: string;
  title: string;
  summary: string;
  description: string | null;
  work_type: AdminWorkType;
  status: AdminWorkStatus;
  review_status: AdminWorkReviewStatus;
  role_label: string | null;
  cover_image_url: string | null;
  website_url: string | null;
  repo_url: string | null;
  demo_url: string | null;
  tags: string[];
  sort_order: number;
  is_public: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

type AdminProfileOptionRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

export type AdminWorkMemberOption = {
  id: string;
  displayName: string;
  email: string | null;
};

export type AdminMemberWork = AdminMemberWorkRow & {
  memberDisplayName: string;
  memberEmail: string | null;
};

export type AdminWorksData = {
  works: AdminMemberWork[];
  memberOptions: AdminWorkMemberOption[];
  queryErrors: string[];
};

function getDisplayName(profile?: AdminProfileOptionRow) {
  return profile?.display_name?.trim() || profile?.email || "未填写显示名";
}

export async function loadAdminWorksData(): Promise<AdminWorksData> {
  const { supabase } = await requireStaffContext();

  const [
    { data: worksData, error: worksError },
    { data: profilesData, error: profilesError },
    { data: membersData, error: membersError },
  ] = await Promise.all([
    supabase
      .from("member_works")
      .select(
        "id, member_id, title, summary, description, work_type, status, review_status, role_label, cover_image_url, website_url, repo_url, demo_url, tags, sort_order, is_public, is_featured, created_at, updated_at",
      )
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, email"),
    supabase
      .from("members")
      .select("id, status")
      .in("status", ["active", "organizer", "admin"]),
  ]);

  const profiles = (profilesData ?? []) as AdminProfileOptionRow[];
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const memberIds = new Set(((membersData ?? []) as Array<{ id: string }>).map((member) => member.id));
  const memberOptions = profiles
    .filter((profile) => memberIds.has(profile.id))
    .map((profile) => ({
      id: profile.id,
      displayName: getDisplayName(profile),
      email: profile.email,
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "zh-CN"));

  return {
    works: ((worksData ?? []) as AdminMemberWorkRow[]).map((work) => {
      const profile = profileById.get(work.member_id);

      return {
        ...work,
        tags: work.tags ?? [],
        memberDisplayName: getDisplayName(profile),
        memberEmail: profile?.email ?? null,
      };
    }),
    memberOptions,
    queryErrors: [
      worksError?.message,
      profilesError?.message,
      membersError?.message,
    ].filter(Boolean) as string[],
  };
}
