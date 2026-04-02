import { unstable_cache } from "next/cache";

import { hasSupabaseEnv } from "@/lib/env";
import { memberTags } from "@/lib/site-data";
import { createPublicServerClient } from "@/lib/supabase/public-server";

type PublicMemberRow = {
  id: string;
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
  joined_at: string;
};

export type PublicMember = {
  id: string;
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
  isPubliclyVisible: boolean;
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
    publicMembers: number;
    organizers: number;
    willingToShare: number;
    willingToJoinProjects: number;
    cities: number;
  };
};

const PUBLIC_MEMBERS_REVALIDATE_SECONDS = 60;
const PUBLIC_MEMBER_TAG_LIMIT = 18;

function pickMembers(
  members: PublicMember[],
  predicate: (member: PublicMember) => boolean,
  limit: number,
) {
  return members.filter(predicate).slice(0, limit);
}

function mapPublicMember(row: PublicMemberRow): PublicMember {
  return {
    id: row.id,
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
    joinedAt: row.joined_at,
  };
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
        publicMembers: 0,
        organizers: 0,
        willingToShare: 0,
        willingToJoinProjects: 0,
        cities: 0,
      },
    };
  }

  return getCachedPublicMembersDirectory();
}

const getCachedPublicMembersDirectory = unstable_cache(
  async (): Promise<PublicMembersDirectory> => {
    const supabase = createPublicServerClient();
    const { data } = await supabase.rpc("list_public_members");
    const members = ((data ?? []) as PublicMemberRow[]).map(mapPublicMember);
    const cityCount = new Set(members.map((member) => member.city)).size;
    const organizers = pickMembers(
      members,
      (member) => ["admin", "organizer"].includes(member.status),
      4,
    );
    const sharers = pickMembers(members, (member) => member.willingToShare, 4);
    const builders = pickMembers(members, (member) => member.willingToJoinProjects, 4);

    return {
      members,
      skillTags: buildDirectorySkillTags(members),
      featuredGroups: [
        {
          id: "organizers",
          title: "核心组织者",
          description: "帮助你快速了解社区节奏、活动方向与组织角色。",
          members: organizers,
        },
        {
          id: "sharers",
          title: "愿意分享的成员",
          description: "适合作为活动嘉宾、主题共创者与内容交流对象。",
          members: sharers,
        },
        {
          id: "builders",
          title: "愿意参与共建",
          description: "适合项目协作、需求对接与小范围试点推进。",
          members: builders,
        },
      ].filter((group) => group.members.length > 0),
      stats: {
        publicMembers: members.length,
        organizers: members.filter((member) =>
          ["admin", "organizer"].includes(member.status),
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
