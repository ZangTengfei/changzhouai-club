import { unstable_cache } from "next/cache";

import { hasSupabaseEnv } from "@/lib/env";
import { isUuidLike } from "@/lib/member-public-slug";
import { memberTags } from "@/lib/site-data";
import { createPublicServerClient } from "@/lib/supabase/public-server";

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

type PublicMemberStatsRow = {
  registered_members: number;
  public_members: number;
};

export type PublicMember = {
  id: string;
  publicSlug: string | null;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  roleLabel: string | null;
  organization: string | null;
  bio: string | null;
  skills: string[];
  status: string;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  isCoBuilder: boolean;
  isPubliclyVisible: boolean;
  isFeaturedOnHome: boolean;
  joinedAt: string;
};

export type PublicMembersDirectory = {
  members: PublicMember[];
  skillTags: string[];
  featuredGroups: Array<{
    id: string;
    title: string;
    description: string;
    members: PublicMember[];
  }>;
  stats: {
    registeredMembers: number;
    publicMembers: number;
    organizers: number;
    coBuilders: number;
    willingToShare: number;
    willingToJoinProjects: number;
    cities: number;
  };
};

const PUBLIC_MEMBERS_REVALIDATE_SECONDS = 60;
const PUBLIC_MEMBER_TAG_LIMIT = 18;
const coreMemberStatuses = new Set(["admin", "organizer"]);

export function isCorePublicMember(member: Pick<PublicMember, "status">) {
  return coreMemberStatuses.has(member.status);
}

export function getPublicMemberTierWeight(
  member: Pick<PublicMember, "status" | "isCoBuilder">,
) {
  if (isCorePublicMember(member)) {
    return 0;
  }

  if (member.isCoBuilder) {
    return 1;
  }

  return 2;
}

function pickMembers(
  members: PublicMember[],
  predicate: (member: PublicMember) => boolean,
  limit: number,
) {
  return members.filter(predicate).slice(0, limit);
}

function pickMembersExcluding(
  members: PublicMember[],
  predicate: (member: PublicMember) => boolean,
  excludedMemberIds: Set<string>,
  limit: number,
) {
  return pickMembers(
    members,
    (member) => !excludedMemberIds.has(member.id) && predicate(member),
    limit,
  );
}

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
    isCoBuilder: Boolean(row.is_co_builder),
    isPubliclyVisible: row.is_publicly_visible,
    isFeaturedOnHome: row.is_featured_on_home,
    joinedAt: row.joined_at,
  };
}

function comparePublicMembers(a: PublicMember, b: PublicMember) {
  const tierDiff = getPublicMemberTierWeight(a) - getPublicMemberTierWeight(b);

  if (tierDiff !== 0) {
    return tierDiff;
  }

  const joinedAtDiff = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();

  if (joinedAtDiff !== 0) {
    return joinedAtDiff;
  }

  return a.displayName.localeCompare(b.displayName, "zh-CN");
}

function buildTopSkillTags(members: PublicMember[]) {
  const counts = new Map<string, number>();

  members.forEach((member) => {
    member.skills.forEach((skill) => {
      const normalized = skill.trim();

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
    .slice(0, PUBLIC_MEMBER_TAG_LIMIT)
    .map(([skill]) => skill);
}

function buildDirectorySkillTags(members: PublicMember[]) {
  const realTags = buildTopSkillTags(members);
  const mergedTags = new Set<string>();

  [...realTags, ...memberTags].forEach((tag) => {
    const normalized = tag.trim();

    if (!normalized || mergedTags.has(normalized)) {
      return;
    }

    mergedTags.add(normalized);
  });

  return Array.from(mergedTags).slice(0, PUBLIC_MEMBER_TAG_LIMIT);
}

export async function getPublicMembersDirectory(): Promise<PublicMembersDirectory> {
  if (!hasSupabaseEnv()) {
    return {
      members: [],
      skillTags: [],
      featuredGroups: [],
      stats: {
        registeredMembers: 0,
        publicMembers: 0,
        organizers: 0,
        coBuilders: 0,
        willingToShare: 0,
        willingToJoinProjects: 0,
        cities: 0,
      },
    };
  }

  return getCachedPublicMembersDirectory();
}

export async function getPublicMemberByHandle(handle: string) {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return getCachedPublicMemberByHandle(handle);
}

const getCachedPublicMembersDirectory = unstable_cache(
  async (): Promise<PublicMembersDirectory> => {
    const supabase = createPublicServerClient();
    const [{ data }, { data: statsDataRaw }] = await Promise.all([
      supabase.rpc("list_public_members"),
      supabase.rpc("get_public_member_stats").maybeSingle(),
    ]);
    const members = ((data ?? []) as PublicMemberRow[])
      .map(mapPublicMember)
      .sort(comparePublicMembers);
    const statsData = (statsDataRaw ?? null) as PublicMemberStatsRow | null;
    const cityCount = new Set(members.map((member) => member.city)).size;
    const registeredMembers =
      typeof statsData?.registered_members === "number"
        ? statsData.registered_members
        : members.length;
    const coreMemberIds = new Set(
      members.filter(isCorePublicMember).map((member) => member.id),
    );
    const organizers = pickMembers(
      members,
      isCorePublicMember,
      4,
    );
    const coBuilders = pickMembersExcluding(
      members,
      (member) => member.isCoBuilder,
      coreMemberIds,
      4,
    );
    const highlightedMembers = pickMembersExcluding(
      members,
      (member) => !member.isCoBuilder,
      new Set([...coreMemberIds, ...coBuilders.map((member) => member.id)]),
      4,
    );

    return {
      members,
      skillTags: buildDirectorySkillTags(members),
      featuredGroups: [
        {
          id: "organizers",
          title: "核心成员 / 发起人",
          description: "负责社区方向、活动节奏与长期维护，是最先被看见的组织角色。",
          members: organizers,
        },
        {
          id: "co-builders",
          title: "共建成员",
          description: "已经开始参与活动组织、内容运营、项目协作或社区支持的小伙伴。",
          members: coBuilders,
        },
        {
          id: "members",
          title: "社区成员",
          description: "公开展示的普通成员，包含愿意分享、愿意参与共建等不同意向。",
          members: highlightedMembers,
        },
      ].filter((group) => group.members.length > 0),
      stats: {
        registeredMembers,
        publicMembers: members.length,
        organizers: members.filter(isCorePublicMember).length,
        coBuilders: members.filter(
          (member) => !isCorePublicMember(member) && member.isCoBuilder,
        ).length,
        willingToShare: members.filter((member) => member.willingToShare).length,
        willingToJoinProjects: members.filter((member) => member.willingToJoinProjects).length,
        cities: cityCount,
      },
    };
  },
  ["public-members-directory"],
  { revalidate: PUBLIC_MEMBERS_REVALIDATE_SECONDS },
);

const getCachedPublicMemberByHandle = unstable_cache(
  async (handle: string) => {
    const normalizedHandle = handle.trim().toLowerCase();

    if (!normalizedHandle) {
      return null;
    }

    const supabase = createPublicServerClient();
    const { data } = await supabase.rpc("list_public_members");
    const members = ((data ?? []) as PublicMemberRow[]).map(mapPublicMember);
    const member = isUuidLike(normalizedHandle)
      ? members.find((item) => item.id === normalizedHandle)
      : members.find((item) => item.publicSlug === normalizedHandle);

    return member ?? null;
  },
  ["public-member-detail-by-handle"],
  { revalidate: PUBLIC_MEMBERS_REVALIDATE_SECONDS },
);
