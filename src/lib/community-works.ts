import { unstable_cache } from "next/cache";

import { type PublicMember } from "@/lib/community-members";
import { hasSupabaseEnv } from "@/lib/env";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import { getAvatarImageUrl, getWorkCoverImageUrl } from "@/lib/public-image-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

export const workReviewStatusLabels = {
  pending: "待审核",
  approved: "已通过",
  changes_requested: "需修改",
  rejected: "已拒绝",
} as const;

export const externalCaseCardTypeLabels = {
  external: "外部",
  project: "项目",
  case: "案例",
  tool: "工具",
  service: "服务",
} as const;

export type PublicWorkType = keyof typeof workTypeLabels;
export type PublicWorkStatus = keyof typeof workStatusLabels;
export type PublicWorkReviewStatus = keyof typeof workReviewStatusLabels;
export type PublicExternalCaseCardType = keyof typeof externalCaseCardTypeLabels;

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
  qr_code_image_url: string | null;
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
  is_co_builder: boolean;
  is_publicly_visible: boolean;
  is_featured_on_home: boolean;
  joined_at: string;
};

type PublicExternalCaseCardRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  card_type: PublicExternalCaseCardType;
  source_label: string | null;
  cover_image_url: string | null;
  external_url: string;
  cta_label: string;
  tags: string[] | null;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
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
  qrCodeImageUrl: string | null;
  websiteUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  tags: string[];
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
  member: PublicWorkMember;
};

export type PublicExternalCaseCard = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  type: PublicExternalCaseCardType;
  typeLabel: string;
  sourceLabel: string | null;
  coverImageUrl: string | null;
  externalUrl: string;
  ctaLabel: string;
  tags: string[];
  sortOrder: number;
  isFeatured: boolean;
  createdAt: string;
};

export type PublicWorksDirectory = {
  works: PublicMemberWork[];
  externalCards: PublicExternalCaseCard[];
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
const REMOTE_CASE_LIBRARY_BASE_URL = "http://abbs.fun:25181";
export const remoteCaseLibraryUrl = `${REMOTE_CASE_LIBRARY_BASE_URL}/?tab=library`;
const REMOTE_CASE_IMAGE_PROXY_PATH = "/api/external-case-image";
const REMOTE_CASE_LIBRARY_SOURCE_LABEL = "AI 应用案例档案库";
const REMOTE_CASE_LIBRARY_SUMMARY_LENGTH = 132;
const REMOTE_IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
const REMOTE_CASE_LIBRARY_TIMEOUT_MS = 5_000;

type RemoteCaseLibraryTag = {
  name?: string | null;
};

type RemoteCaseLibraryCase = {
  id?: number | string | null;
  name?: string | null;
  description?: string | null;
  images?: string[] | null;
  tags?: RemoteCaseLibraryTag[] | null;
  sort_order?: number | string | null;
  upload_time?: string | null;
  is_hidden?: boolean | null;
};

function isRemoteCaseLibraryCase(value: unknown): value is RemoteCaseLibraryCase {
  return typeof value === "object" && value !== null;
}

function normalizeRemoteText(value: number | string | null | undefined) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function toRemoteNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildRemoteCaseUrl(caseId: string) {
  const url = new URL(REMOTE_CASE_LIBRARY_BASE_URL);
  url.searchParams.set("tab", "library");
  url.searchParams.set("caseId", caseId);

  return url.toString();
}

function toRemoteAssetUrl(value: string) {
  const assetPath = normalizeRemoteText(value);

  if (!assetPath) {
    return null;
  }

  try {
    const assetUrl = new URL(assetPath, REMOTE_CASE_LIBRARY_BASE_URL);

    if (assetUrl.protocol !== "http:" && assetUrl.protocol !== "https:") {
      return null;
    }

    return assetUrl.toString();
  } catch {
    return null;
  }
}

function isRemoteImageUrl(url: string) {
  try {
    return REMOTE_IMAGE_EXTENSION_PATTERN.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function toRemoteCaseImageProxyUrl(url: string) {
  const params = new URLSearchParams({ src: url });

  return `${REMOTE_CASE_IMAGE_PROXY_PATH}?${params.toString()}`;
}

function getRemoteCaseCoverImageUrl(images: string[] | null | undefined) {
  for (const image of images ?? []) {
    const url = toRemoteAssetUrl(image);

    if (url && isRemoteImageUrl(url)) {
      return toRemoteCaseImageProxyUrl(url);
    }
  }

  return null;
}

function getRemoteCaseTags(tags: RemoteCaseLibraryTag[] | null | undefined) {
  const seen = new Set<string>();
  const tagNames: string[] = [];

  (tags ?? []).forEach((tag) => {
    const name = normalizeRemoteText(tag.name);

    if (!name || seen.has(name)) {
      return;
    }

    seen.add(name);
    tagNames.push(name);
  });

  return tagNames;
}

function getRemoteCaseSummary(description: string) {
  if (!description) {
    return "来自 AI 应用案例档案库的公开案例。";
  }

  if (description.length <= REMOTE_CASE_LIBRARY_SUMMARY_LENGTH) {
    return description;
  }

  return `${description.slice(0, REMOTE_CASE_LIBRARY_SUMMARY_LENGTH)}...`;
}

function mapPublicMember(row: PublicMemberRow): PublicMember {
  return {
    id: row.id,
    publicSlug: row.public_slug?.trim() || null,
    displayName: row.display_name?.trim() || "社区成员",
    avatarUrl: getAvatarImageUrl(row.avatar_url),
    city: row.city?.trim() || "常州",
    roleLabel: row.role_label?.trim() || null,
    organization: row.organization?.trim() || null,
    bio: row.bio,
    skills: row.skills ?? [],
    status: row.status,
    willingToShare: row.willing_to_share,
    willingToJoinProjects: row.willing_to_join_projects,
    isCoBuilder: Boolean(row.is_co_builder),
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
    coverImageUrl: getWorkCoverImageUrl(row.cover_image_url),
    qrCodeImageUrl: getWorkCoverImageUrl(row.qr_code_image_url),
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

function mapPublicExternalCaseCard(
  row: PublicExternalCaseCardRow,
): PublicExternalCaseCard {
  return {
    id: row.id,
    slug: row.slug.trim(),
    title: row.title.trim(),
    summary: row.summary.trim(),
    description: row.description,
    type: row.card_type,
    typeLabel: externalCaseCardTypeLabels[row.card_type] ?? row.card_type,
    sourceLabel: row.source_label?.trim() || null,
    coverImageUrl: getWorkCoverImageUrl(row.cover_image_url),
    externalUrl: row.external_url,
    ctaLabel: row.cta_label.trim() || "查看详情",
    tags: row.tags ?? [],
    sortOrder: row.sort_order,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}

function mapRemoteCaseLibraryCard(
  row: RemoteCaseLibraryCase,
  index: number,
): PublicExternalCaseCard | null {
  const remoteId = normalizeRemoteText(row.id);
  const title = normalizeRemoteText(row.name);
  const description = normalizeRemoteText(row.description);

  if (!remoteId || !title || row.is_hidden === true) {
    return null;
  }

  return {
    id: `remote-case-library-${remoteId}`,
    slug: `remote-case-library-${remoteId}`,
    title,
    summary: getRemoteCaseSummary(description),
    description: description || null,
    type: "case",
    typeLabel: externalCaseCardTypeLabels.case,
    sourceLabel: REMOTE_CASE_LIBRARY_SOURCE_LABEL,
    coverImageUrl: getRemoteCaseCoverImageUrl(row.images),
    externalUrl: buildRemoteCaseUrl(remoteId),
    ctaLabel: "查看档案详情",
    tags: getRemoteCaseTags(row.tags),
    sortOrder: toRemoteNumber(row.sort_order) ?? index,
    isFeatured: false,
    createdAt: normalizeRemoteText(row.upload_time),
  };
}

async function loadRemoteCaseLibraryCards() {
  try {
    const response = await fetch(`${REMOTE_CASE_LIBRARY_BASE_URL}/api/cases`, {
      signal: AbortSignal.timeout(REMOTE_CASE_LIBRARY_TIMEOUT_MS),
      next: { revalidate: PUBLIC_WORKS_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .filter(isRemoteCaseLibraryCase)
      .map((caseItem, index) => mapRemoteCaseLibraryCard(caseItem, index))
      .filter(Boolean) as PublicExternalCaseCard[];
  } catch {
    return [];
  }
}

function buildTags(items: Array<{ tags: string[] }>) {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    item.tags.forEach((tag) => {
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

function createPublicWorksReadClient() {
  return createSupabaseAdminClient() ?? createPublicServerClient();
}

async function loadPublicWorks() {
  const supabase = createPublicWorksReadClient();
  const [{ data: worksData }, { data: membersData }] = await Promise.all([
    supabase
      .from("member_works")
      .select(
        "id, member_id, title, summary, description, work_type, status, role_label, cover_image_url, qr_code_image_url, website_url, repo_url, demo_url, tags, sort_order, is_featured, created_at",
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

async function loadPublicExternalCaseCards() {
  const supabase = createPublicWorksReadClient();
  const { data, error } = await supabase
    .from("external_case_cards")
    .select(
      "id, slug, title, summary, description, card_type, source_label, cover_image_url, external_url, cta_label, tags, sort_order, is_featured, created_at",
    )
    .eq("is_public", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as PublicExternalCaseCardRow[]).map(mapPublicExternalCaseCard);
}

function buildPublicWorksDirectory(
  works: PublicMemberWork[],
  externalCards: PublicExternalCaseCard[],
): PublicWorksDirectory {
  const makerIds = new Set(works.map((work) => work.memberId));

  return {
    works,
    externalCards,
    featuredWorks: works.filter((work) => work.isFeatured).slice(0, 6),
    tags: buildTags([...works, ...externalCards]),
    stats: {
      works: works.length + externalCards.length,
      featuredWorks:
        works.filter((work) => work.isFeatured).length +
        externalCards.filter((card) => card.isFeatured).length,
      makers: makerIds.size,
      launchedWorks: works.filter((work) => work.status === "launched").length,
    },
  };
}

export async function getPublicWorksDirectory(): Promise<PublicWorksDirectory> {
  if (!hasSupabaseEnv()) {
    const remoteCaseCards = await loadRemoteCaseLibraryCards();

    return buildPublicWorksDirectory([], remoteCaseCards);
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
    const [works, externalCards, remoteCaseCards] = await Promise.all([
      loadPublicWorks(),
      loadPublicExternalCaseCards(),
      loadRemoteCaseLibraryCards(),
    ]);

    return buildPublicWorksDirectory(works, [...externalCards, ...remoteCaseCards]);
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
