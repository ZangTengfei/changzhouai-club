import { unstable_cache } from "next/cache";

import { hasSupabaseEnv } from "@/lib/env";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import { getAvatarImageUrl, getCommunityUpdateImageUrl } from "@/lib/public-image-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export const communityUpdateTypeLabels = {
  activity: "活动瞬间",
  project: "项目进展",
  share: "经验分享",
  help: "提问求助",
  collab: "协作招募",
  official: "官方公告",
} as const;

export const communityUpdateStatusLabels = {
  pending: "待审核",
  published: "已发布",
  changes_requested: "需修改",
  rejected: "已拒绝",
  archived: "已归档",
} as const;

export const communityUpdateRelatedTypeLabels = {
  event: "活动",
  work: "作品",
  project: "项目",
  doc: "文档",
  external: "外部链接",
} as const;

export type CommunityUpdateType = keyof typeof communityUpdateTypeLabels;
export type CommunityUpdateStatus = keyof typeof communityUpdateStatusLabels;
export type CommunityUpdateRelatedType = keyof typeof communityUpdateRelatedTypeLabels;

type PublicCommunityUpdateRow = {
  id: string;
  author_id: string;
  update_type: CommunityUpdateType;
  title: string | null;
  content: string;
  tags: string[] | null;
  related_type: CommunityUpdateRelatedType | null;
  related_url: string | null;
  status: CommunityUpdateStatus;
  like_count: number;
  comment_count: number;
  view_count: number;
  sort_order: number;
  is_featured: boolean;
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type PublicCommunityUpdateImageRow = {
  id: string;
  update_id: string;
  image_url: string;
  alt: string | null;
  sort_order: number;
};

type PublicUpdateAuthorRow = {
  id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  role_label: string | null;
  organization: string | null;
};

export type PublicCommunityUpdateAuthor = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  roleLabel: string | null;
  organization: string | null;
  href: string;
};

export type PublicCommunityUpdateImage = {
  id: string;
  imageUrl: string;
  alt: string | null;
  sortOrder: number;
};

export type PublicCommunityUpdate = {
  id: string;
  href: string;
  authorId: string;
  type: CommunityUpdateType;
  typeLabel: string;
  title: string | null;
  content: string;
  excerpt: string;
  tags: string[];
  relatedType: CommunityUpdateRelatedType | null;
  relatedTypeLabel: string | null;
  relatedUrl: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  sortOrder: number;
  isFeatured: boolean;
  isPinned: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: PublicCommunityUpdateAuthor;
  images: PublicCommunityUpdateImage[];
};

export type PublicCommunityUpdatesDirectory = {
  updates: PublicCommunityUpdate[];
  featuredUpdates: PublicCommunityUpdate[];
  tags: string[];
  stats: {
    updates: number;
    featured: number;
    authors: number;
    images: number;
  };
};

const PUBLIC_COMMUNITY_UPDATES_REVALIDATE_SECONDS = 60;
const PUBLIC_UPDATE_SELECT = [
  "id",
  "author_id",
  "update_type",
  "title",
  "content",
  "tags",
  "related_type",
  "related_url",
  "status",
  "like_count",
  "comment_count",
  "view_count",
  "sort_order",
  "is_featured",
  "is_pinned",
  "published_at",
  "created_at",
  "updated_at",
].join(", ");
const PUBLIC_PROFILE_SELECT = [
  "id",
  "public_slug",
  "display_name",
  "avatar_url",
  "city",
  "role_label",
  "organization",
].join(", ");
const PUBLIC_IMAGE_SELECT = "id, update_id, image_url, alt, sort_order";

function createPublicCommunityUpdatesReadClient() {
  return createSupabaseAdminClient() ?? createPublicServerClient();
}

function shouldIgnoreCommunityUpdateError(error: { code?: string | null }) {
  return error.code === "PGRST205" || error.code === "42P01";
}

function createExcerpt(content: string) {
  const normalized = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[*_~`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 150 ? `${normalized.slice(0, 150)}...` : normalized;
}

function buildTags(updates: PublicCommunityUpdate[]) {
  const counts = new Map<string, number>();

  updates.forEach((update) => {
    update.tags.forEach((tag) => {
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
    .slice(0, 16)
    .map(([tag]) => tag);
}

function mapAuthor(row: PublicUpdateAuthorRow | undefined): PublicCommunityUpdateAuthor {
  const author = {
    id: row?.id ?? "",
    publicSlug: row?.public_slug?.trim() || null,
  };

  return {
    id: row?.id ?? "",
    displayName: row?.display_name?.trim() || "社区成员",
    avatarUrl: getAvatarImageUrl(row?.avatar_url),
    city: row?.city?.trim() || "常州",
    roleLabel: row?.role_label?.trim() || null,
    organization: row?.organization?.trim() || null,
    href: row?.id ? getMemberPublicSlugPath(author) : "/members",
  };
}

function mapUpdate(
  row: PublicCommunityUpdateRow,
  author: PublicCommunityUpdateAuthor,
  images: PublicCommunityUpdateImage[],
): PublicCommunityUpdate {
  return {
    id: row.id,
    href: `/updates/${row.id}`,
    authorId: row.author_id,
    type: row.update_type,
    typeLabel: communityUpdateTypeLabels[row.update_type] ?? row.update_type,
    title: row.title?.trim() || null,
    content: row.content.trim(),
    excerpt: createExcerpt(row.content),
    tags: row.tags ?? [],
    relatedType: row.related_type,
    relatedTypeLabel: row.related_type
      ? communityUpdateRelatedTypeLabels[row.related_type] ?? row.related_type
      : null,
    relatedUrl: row.related_url,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    viewCount: row.view_count,
    sortOrder: row.sort_order,
    isFeatured: row.is_featured,
    isPinned: row.is_pinned,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author,
    images,
  };
}

async function loadPublicCommunityUpdates(type?: CommunityUpdateType | null, limit?: number) {
  const supabase = createPublicCommunityUpdatesReadClient();
  let query = supabase
    .from("community_updates")
    .select(PUBLIC_UPDATE_SELECT)
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("update_type", type);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: updateRows, error: updatesError } = await query;

  if (updatesError) {
    if (!shouldIgnoreCommunityUpdateError(updatesError)) {
      console.error("Failed to load public community updates.", updatesError);
    }

    return [];
  }

  const rows = (updateRows ?? []) as unknown as PublicCommunityUpdateRow[];
  const updateIds = rows.map((row) => row.id);
  const authorIds = [...new Set(rows.map((row) => row.author_id))];

  const [{ data: imageRows }, { data: profileRows }] = await Promise.all([
    updateIds.length > 0
      ? supabase
          .from("community_update_images")
          .select(PUBLIC_IMAGE_SELECT)
          .in("update_id", updateIds)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    authorIds.length > 0
      ? supabase.from("profiles").select(PUBLIC_PROFILE_SELECT).in("id", authorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profilesById = new Map(
    ((profileRows ?? []) as unknown as PublicUpdateAuthorRow[]).map((row) => [row.id, row]),
  );
  const imagesByUpdateId = new Map<string, PublicCommunityUpdateImage[]>();

  ((imageRows ?? []) as unknown as PublicCommunityUpdateImageRow[]).forEach((image) => {
    const images = imagesByUpdateId.get(image.update_id) ?? [];
    images.push({
      id: image.id,
      imageUrl: getCommunityUpdateImageUrl(image.image_url) ?? image.image_url,
      alt: image.alt,
      sortOrder: image.sort_order,
    });
    imagesByUpdateId.set(image.update_id, images);
  });

  return rows.map((row) =>
    mapUpdate(
      row,
      mapAuthor(profilesById.get(row.author_id)),
      imagesByUpdateId.get(row.id) ?? [],
    ),
  );
}

function emptyCommunityUpdatesDirectory(): PublicCommunityUpdatesDirectory {
  return {
    updates: [],
    featuredUpdates: [],
    tags: [],
    stats: {
      updates: 0,
      featured: 0,
      authors: 0,
      images: 0,
    },
  };
}

async function buildCommunityUpdatesDirectory(type?: CommunityUpdateType | null) {
  const updates = await loadPublicCommunityUpdates(type);
  const authorIds = new Set(updates.map((update) => update.authorId));

  return {
    updates,
    featuredUpdates: updates.filter((update) => update.isFeatured || update.isPinned).slice(0, 6),
    tags: buildTags(updates),
    stats: {
      updates: updates.length,
      featured: updates.filter((update) => update.isFeatured).length,
      authors: authorIds.size,
      images: updates.reduce((total, update) => total + update.images.length, 0),
    },
  };
}

const getCachedPublicCommunityUpdatesDirectory = unstable_cache(
  buildCommunityUpdatesDirectory,
  ["public-community-updates-directory"],
  { revalidate: PUBLIC_COMMUNITY_UPDATES_REVALIDATE_SECONDS },
);

const getCachedHomeCommunityUpdates = unstable_cache(
  () => loadPublicCommunityUpdates(null, 3),
  ["home-community-updates"],
  { revalidate: PUBLIC_COMMUNITY_UPDATES_REVALIDATE_SECONDS },
);

export async function getPublicCommunityUpdatesDirectory(
  type?: CommunityUpdateType | null,
): Promise<PublicCommunityUpdatesDirectory> {
  if (!hasSupabaseEnv()) {
    return emptyCommunityUpdatesDirectory();
  }

  return getCachedPublicCommunityUpdatesDirectory(type ?? null);
}

export async function getHomeCommunityUpdates() {
  if (!hasSupabaseEnv()) {
    return [];
  }

  return getCachedHomeCommunityUpdates();
}

export async function getPublicCommunityUpdateById(id: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const updates = await loadPublicCommunityUpdates(null);
  return updates.find((update) => update.id === id) ?? null;
}

export function isCommunityUpdateType(value: string): value is CommunityUpdateType {
  return value in communityUpdateTypeLabels;
}
