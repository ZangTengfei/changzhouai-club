import { getStaffContext } from "@/lib/supabase/guards";

type AdminProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  skills: string[] | null;
};

type AdminMemberRow = {
  id: string;
  status: string;
  willing_to_share: boolean;
  willing_to_join_projects: boolean;
  joined_at: string;
  last_active_at: string | null;
};

type AdminRegistrationRow = {
  user_id: string;
  status: string;
};

export type AdminMember = {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  bio: string | null;
  skills: string[];
  status: string;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  joinedAt: string;
  lastActiveAt: string | null;
  registrationCount: number;
};

export type AdminMembersData = {
  members: AdminMember[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    willingToShare: number;
    willingToJoinProjects: number;
  };
  queryErrors: string[];
};

function getMemberSortWeight(status: string) {
  switch (status) {
    case "admin":
      return 0;
    case "organizer":
      return 1;
    case "active":
      return 2;
    case "pending":
      return 3;
    case "paused":
      return 4;
    default:
      return 5;
  }
}

export async function loadAdminMembersData(): Promise<AdminMembersData> {
  const { supabase } = await getStaffContext();

  const [
    { data: profilesData, error: profilesError },
    { data: membersData, error: membersError },
    { data: registrationsData, error: registrationsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, display_name, avatar_url, city, bio, skills"),
    supabase
      .from("members")
      .select("id, status, willing_to_share, willing_to_join_projects, joined_at, last_active_at"),
    supabase.from("event_registrations").select("user_id, status"),
  ]);

  const profiles = (profilesData ?? []) as AdminProfileRow[];
  const members = (membersData ?? []) as AdminMemberRow[];
  const registrations = (registrationsData ?? []) as AdminRegistrationRow[];
  const queryErrors = [
    profilesError?.message,
    membersError?.message,
    registrationsError?.message,
  ].filter(Boolean) as string[];

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const registrationsByUserId = new Map<string, number>();

  registrations.forEach((registration) => {
    registrationsByUserId.set(
      registration.user_id,
      (registrationsByUserId.get(registration.user_id) ?? 0) + 1,
    );
  });

  const mergedMembers = members
    .map((member) => {
      const profile = profilesById.get(member.id);

      return {
        id: member.id,
        email: profile?.email ?? null,
        displayName: profile?.display_name?.trim() || "未填写显示名",
        avatarUrl: profile?.avatar_url ?? null,
        city: profile?.city?.trim() || "常州",
        bio: profile?.bio ?? null,
        skills: profile?.skills ?? [],
        status: member.status,
        willingToShare: member.willing_to_share,
        willingToJoinProjects: member.willing_to_join_projects,
        joinedAt: member.joined_at,
        lastActiveAt: member.last_active_at,
        registrationCount: registrationsByUserId.get(member.id) ?? 0,
      };
    })
    .sort((a, b) => {
      const weightDiff = getMemberSortWeight(a.status) - getMemberSortWeight(b.status);

      if (weightDiff !== 0) {
        return weightDiff;
      }

      return a.displayName.localeCompare(b.displayName, "zh-CN");
    });

  return {
    members: mergedMembers,
    stats: {
      totalMembers: mergedMembers.length,
      activeMembers: mergedMembers.filter((member) =>
        ["active", "organizer", "admin"].includes(member.status),
      ).length,
      willingToShare: mergedMembers.filter((member) => member.willingToShare).length,
      willingToJoinProjects: mergedMembers.filter(
        (member) => member.willingToJoinProjects,
      ).length,
    },
    queryErrors,
  };
}
