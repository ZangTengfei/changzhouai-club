import { unstable_cache } from "next/cache";

import { hasSupabaseEnv } from "@/lib/env";
import {
  getMemberPublicSlugPath,
} from "@/lib/member-public-slug";
import {
  type PublicMember,
} from "@/lib/community-members";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export const workTypeLabels = {
  product: "产品",
  project: "项目",
  tool: "工具",
  open_source: "开源",
  case: "案例",
  demo: "Demo",
  service: "服务",
} as const;

export const workStatusLabels = {
  idea: "想法中",
  building: "建设中",
  launched: "已上线",
  paused: "暂停中",
  archived: "已归档",
} as const;

export type PublicWorkType = keyof typeof workTypeLabels;
export type PublicWorkStatus = keyof typeof workStatusLabels;

type PublicMemberWorkRow = {
  id: string;
  member_id: string;
  title: string;
  summary: string;
  description: string | null;
  work_type: PublicWorkType;
  status: PublicWorkStatus;
  role_label: string | null;
  cover_image_url: string | null;
  website_url: string | null;
  repo_url: string | null;
  demo_url: string | null;
  tags: string[] | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
};

type PublicMemberRow = {
  id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  role_label: string | null;
  organization: string | null;
  bio: string | null;
  skills: string[] | null;
  status: string;
  willing_to_share: boolean;
  willing_to_join_projects: boolean;
  is_publicly_visible: boolean;
  is_featured_on_home: boolean;
  joined_at: string;
};

export type PublicWorkMember = Pick<
  PublicMember,
  "id" | "publicSlug" | "displayName" | "avatarUrl" | "city" | "roleLabel" | "organization"
> & {
  href: string;
};

export type PublicMemberWork = {
  id: string;
  memberId: string;
  title: string;
  summary: string;
  description: string | null;
  type: PublicWorkType;
  typeLabel: string;
  status: PublicWorkStatus;
  statusLabel: string;
  roleLabel: string | null;
  coverImageUrl: string | null;
  websiteUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  tags: string[];
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  member: PublicWorkMember;
};

export type PublicWorksDirectory = {
  works: PublicMemberWork[];
  featuredWorks: PublicMemberWork[];
  tags: string[];
  stats: {
    works: number;
    featuredWorks: number;
    makers: number;
    launchedWorks: number;
  };
};

const PUBLIC_WORKS_REVALIDATE_SECONDS = 60;
const PUBLIC_WORK_TAG_LIMIT = 18;

function mapPublicMember(row: PublicMemberRow): PublicMember {
  return {
    id: row.id,
    publicSlug: row.public_slug?.trim() || null,
    displayName: row.display_name?.trim() || "社区成员",
    avatarUrl: row.avatar_url,
    city: row.city?.trim() || "常州",
    roleLabel: row.role_label?.trim() || null,
    organization: row.organization?.trim() || null,
    bio: row.bio,
    skills: row.skills ?? [],
    status: row.status,
    willingToShare: row.willing_to_share,
    willingToJoinProjects: row.willing_to_join_projects,
    isPubliclyVisible: row.is_publicly_visible,
    isFeaturedOnHome: row.is_featured_on_home,
    joinedAt: row.joined_at,
  };
}

function mapPublicWork(
  row: PublicMemberWorkRow,
  member: PublicMember,
): PublicMemberWork {
  return {
    id: row.id,
    memberId: row.member_id,
    title: row.title.trim(),
    summary: row.summary.trim(),
    description: row.description,
    type: row.work_type,
    typeLabel: workTypeLabels[row.work_type] ?? row.work_type,
    status: row.status,
    statusLabel: workStatusLabels[row.status] ?? row.status,
    roleLabel: row.role_label?.trim() || null,
    coverImageUrl: row.cover_image_url,
    websiteUrl: row.website_url,
    repoUrl: row.repo_url,
    demoUrl: row.demo_url,
    tags: row.tags ?? [],
    sortOrder: row.sort_order,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
    member: {
      id: member.id,
      publicSlug: member.publicSlug,
      displayName: member.displayName,
      avatarUrl: member.avatarUrl,
      city: member.city,
      roleLabel: member.roleLabel,
      organization: member.organization,
      href: getMemberPublicSlugPath(member),
    },
  };
}

function buildTags(works: PublicMemberWork[]) {
  const counts = new Map<string, number>();

  works.forEach((work) => {
    work.tags.forEach((tag) => {
      const normalized = tag.trim();

      if (!normalized) {
        return;
      }

      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0], "zh-CN");
    })
    .slice(0, PUBLIC_WORK_TAG_LIMIT)
    .map(([tag]) => tag);
}

async function loadPublicWorks() {
  const supabase = createPublicServerClient();
  const [{ data: worksData }, { data: membersData }] = await Promise.all([
    supabase
      .from("member_works")
      .select(
        "id, member_id, title, summary, description, work_type, status, role_label, cover_image_url, website_url, repo_url, demo_url, tags, sort_order, is_featured, created_at",
      )
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.rpc("list_public_members"),
  ]);

  const membersById = new Map(
    ((membersData ?? []) as PublicMemberRow[]).map((row) => {
      const member = mapPublicMember(row);
      return [member.id, member] as const;
    }),
  );

  return ((worksData ?? []) as PublicMemberWorkRow[])
    .map((work) => {
      const member = membersById.get(work.member_id);

      return member ? mapPublicWork(work, member) : null;
    })
    .filter(Boolean) as PublicMemberWork[];
}

export async function getPublicWorksDirectory(): Promise<PublicWorksDirectory> {
  if (!hasSupabaseEnv()) {
    return {
      works: [],
      featuredWorks: [],
      tags: [],
      stats: {
        works: 0,
        featuredWorks: 0,
        makers: 0,
        launchedWorks: 0,
      },
    };
  }

  return getCachedPublicWorksDirectory();
}

export async function getPublicWorksByMemberId(memberId: string) {
  if (!hasSupabaseEnv()) {
    return [];
  }

  return getCachedPublicWorksByMemberId(memberId);
}

const getCachedPublicWorksDirectory = unstable_cache(
  async (): Promise<PublicWorksDirectory> => {
    const works = await loadPublicWorks();
    const makerIds = new Set(works.map((work) => work.memberId));

    return {
      works,
      featuredWorks: works.filter((work) => work.isFeatured).slice(0, 6),
      tags: buildTags(works),
      stats: {
        works: works.length,
        featuredWorks: works.filter((work) => work.isFeatured).length,
        makers: makerIds.size,
        launchedWorks: works.filter((work) => work.status === "launched").length,
      },
    };
  },
  ["public-works-directory"],
  { revalidate: PUBLIC_WORKS_REVALIDATE_SECONDS },
);

const getCachedPublicWorksByMemberId = unstable_cache(
  async (memberId: string) => {
    const works = await loadPublicWorks();

    return works.filter((work) => work.memberId === memberId);
  },
  ["public-works-by-member-id"],
  { revalidate: PUBLIC_WORKS_REVALIDATE_SECONDS },
);
