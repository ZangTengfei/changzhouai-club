import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type PublicMemberRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  skills: string[] | null;
  status: string;
  willing_to_share: boolean;
  willing_to_join_projects: boolean;
  joined_at: string;
};

export type PublicMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  bio: string | null;
  skills: string[];
  status: string;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  joinedAt: string;
};

export type PublicMembersDirectory = {
  members: PublicMember[];
  skillTags: string[];
  stats: {
    publicMembers: number;
    willingToShare: number;
    willingToJoinProjects: number;
  };
};

function mapPublicMember(row: PublicMemberRow): PublicMember {
  return {
    id: row.id,
    displayName: row.display_name?.trim() || "社区成员",
    avatarUrl: row.avatar_url,
    city: row.city?.trim() || "常州",
    bio: row.bio,
    skills: row.skills ?? [],
    status: row.status,
    willingToShare: row.willing_to_share,
    willingToJoinProjects: row.willing_to_join_projects,
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
    .slice(0, 18)
    .map(([skill]) => skill);
}

export async function getPublicMembersDirectory(): Promise<PublicMembersDirectory> {
  if (!hasSupabaseEnv()) {
    return {
      members: [],
      skillTags: [],
      stats: {
        publicMembers: 0,
        willingToShare: 0,
        willingToJoinProjects: 0,
      },
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("list_public_members");
  const members = ((data ?? []) as PublicMemberRow[]).map(mapPublicMember);

  return {
    members,
    skillTags: buildTopSkillTags(members),
    stats: {
      publicMembers: members.length,
      willingToShare: members.filter((member) => member.willingToShare).length,
      willingToJoinProjects: members.filter((member) => member.willingToJoinProjects).length,
    },
  };
}
