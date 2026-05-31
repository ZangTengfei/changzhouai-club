import { notFound } from "next/navigation";

import { redactSensitiveValue } from "@/lib/admin/permissions";
import {
  canAdmin,
  getAdminContextResult,
  requireAdminPermission,
} from "@/lib/supabase/guards";

type AdminProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  public_slug: string | null;
  avatar_url: string | null;
  wechat: string | null;
  city: string | null;
  role_label: string | null;
  organization: string | null;
  monthly_time: string | null;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
};

type AdminMemberRow = {
  id: string;
  status: string;
  willing_to_attend: boolean;
  willing_to_share: boolean;
  willing_to_join_projects: boolean;
  is_co_builder: boolean;
  is_publicly_visible: boolean;
  is_featured_on_home: boolean;
  joined_at: string;
  last_active_at: string | null;
};

type AdminRegistrationRow = {
  user_id: string;
  status: string;
};

type AdminJoinRequestRow = {
  id: string;
  display_name: string;
  wechat: string;
  city: string | null;
  role_label: string | null;
  organization: string | null;
  monthly_time: string | null;
  skills: string[] | null;
  interests: string[] | null;
  note: string | null;
  willing_to_attend: boolean;
  willing_to_share: boolean;
  willing_to_join_projects: boolean;
  status: string;
  admin_note: string | null;
  contacted_at: string | null;
  approved_at: string | null;
  invited_to_register_at: string | null;
  joined_group_at: string | null;
  first_attended_event_at: string | null;
  converted_to_member_at: string | null;
  converted_member_id: string | null;
  created_at: string;
};

export type AdminMember = {
  id: string;
  email: string | null;
  displayName: string;
  publicSlug: string | null;
  avatarUrl: string | null;
  wechat: string | null;
  city: string;
  roleLabel: string | null;
  organization: string | null;
  monthlyTime: string | null;
  bio: string | null;
  skills: string[];
  interests: string[];
  willingToAttend: boolean;
  status: string;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  isCoBuilder: boolean;
  isPubliclyVisible: boolean;
  isFeaturedOnHome: boolean;
  joinedAt: string;
  lastActiveAt: string | null;
  registrationCount: number;
  adminRoles: AdminMemberAdminRole[];
  availableAdminRoles: AdminRoleOption[];
};

export type AdminMemberAdminRole = {
  roleId: string;
  roleKey: string;
  name: string;
  description: string | null;
  expiresAt: string | null;
  note: string | null;
};

export type AdminRoleOption = {
  id: string;
  roleKey: string;
  name: string;
  description: string | null;
};

export type AdminJoinRequest = {
  id: string;
  displayName: string;
  wechat: string;
  city: string;
  roleLabel: string | null;
  organization: string | null;
  monthlyTime: string | null;
  skills: string[];
  interests: string[];
  note: string | null;
  willingToAttend: boolean;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  status: string;
  adminNote: string | null;
  contactedAt: string | null;
  approvedAt: string | null;
  invitedToRegisterAt: string | null;
  joinedGroupAt: string | null;
  firstAttendedEventAt: string | null;
  convertedToMemberAt: string | null;
  convertedMemberId: string | null;
  convertedMemberDisplayName: string | null;
  createdAt: string;
};

export type AdminMemberOption = {
  id: string;
  displayName: string;
  email: string | null;
};

export type AdminMembersData = {
  members: AdminMember[];
  joinRequests: AdminJoinRequest[];
  stats: {
    totalMembers: number;
    activeMembers: number;
    coBuilders: number;
    willingToShare: number;
    willingToJoinProjects: number;
    joinRequests: number;
  };
  queryErrors: string[];
};

type AdminContext = Awaited<ReturnType<typeof getAdminContextResult>>;
type AdminRoleRow = {
  id: string;
  role_key: string;
  name: string;
  description: string | null;
};

type MemberAdminRoleRow = {
  member_id: string;
  role_id: string;
  expires_at: string | null;
  note: string | null;
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

function getJoinRequestSortWeight(status: string) {
  switch (status) {
    case "new":
      return 0;
    case "contacted":
      return 1;
    case "approved":
      return 2;
    case "archived":
      return 3;
    default:
      return 4;
  }
}

export async function loadAdminMembersData(
  context?: AdminContext,
): Promise<AdminMembersData> {
  const adminContext = context ?? (await requireAdminPermission("members.read"));
  const { supabase } = adminContext;
  const canReadContact = canAdmin(adminContext, "members.read_contact");
  const canManageRoles = canAdmin(adminContext, "system.manage_roles");

  const [
    { data: profilesData, error: profilesError },
    { data: membersData, error: membersError },
    { data: registrationsData, error: registrationsError },
    { data: joinRequestsData, error: joinRequestsError },
    { data: rolesData, error: rolesError },
    { data: memberRolesData, error: memberRolesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, display_name, public_slug, avatar_url, wechat, city, role_label, organization, monthly_time, bio, skills, interests",
      ),
    supabase
      .from("members")
      .select(
        "id, status, willing_to_attend, willing_to_share, willing_to_join_projects, is_co_builder, is_publicly_visible, is_featured_on_home, joined_at, last_active_at",
      ),
    supabase.from("event_registrations").select("user_id, status"),
    supabase
      .from("community_join_requests")
      .select(
        "id, display_name, wechat, city, role_label, organization, monthly_time, skills, interests, note, willing_to_attend, willing_to_share, willing_to_join_projects, status, admin_note, contacted_at, approved_at, invited_to_register_at, joined_group_at, first_attended_event_at, converted_to_member_at, converted_member_id, created_at",
      )
      .order("created_at", { ascending: false }),
    canManageRoles
      ? supabase.from("admin_roles").select("id, role_key, name, description").order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    canManageRoles
      ? supabase.from("member_admin_roles").select("member_id, role_id, expires_at, note")
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profiles = (profilesData ?? []) as AdminProfileRow[];
  const members = (membersData ?? []) as AdminMemberRow[];
  const registrations = (registrationsData ?? []) as AdminRegistrationRow[];
  const joinRequests = (joinRequestsData ?? []) as AdminJoinRequestRow[];
  const queryErrors = [
    profilesError?.message,
    membersError?.message,
    registrationsError?.message,
    joinRequestsError?.message,
    rolesError?.message,
    memberRolesError?.message,
  ].filter(Boolean) as string[];

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const roles = (rolesData ?? []) as AdminRoleRow[];
  const memberRoles = (memberRolesData ?? []) as MemberAdminRoleRow[];
  const rolesById = new Map(roles.map((role) => [role.id, role]));
  const availableAdminRoles = roles.map((role) => ({
    id: role.id,
    roleKey: role.role_key,
    name: role.name,
    description: role.description,
  }));
  const adminRolesByMemberId = new Map<string, AdminMemberAdminRole[]>();
  const registrationsByUserId = new Map<string, number>();

  memberRoles.forEach((assignment) => {
    const role = rolesById.get(assignment.role_id);

    if (!role) {
      return;
    }

    const assignments = adminRolesByMemberId.get(assignment.member_id) ?? [];
    assignments.push({
      roleId: assignment.role_id,
      roleKey: role.role_key,
      name: role.name,
      description: role.description,
      expiresAt: assignment.expires_at,
      note: assignment.note,
    });
    adminRolesByMemberId.set(assignment.member_id, assignments);
  });

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
        email: canReadContact ? profile?.email ?? null : redactSensitiveValue(profile?.email),
        displayName: profile?.display_name?.trim() || "未填写显示名",
        publicSlug: profile?.public_slug?.trim() || null,
        avatarUrl: profile?.avatar_url ?? null,
        wechat: canReadContact ? profile?.wechat?.trim() || null : redactSensitiveValue(profile?.wechat),
        city: profile?.city?.trim() || "常州",
        roleLabel: profile?.role_label?.trim() || null,
        organization: profile?.organization?.trim() || null,
        monthlyTime: profile?.monthly_time?.trim() || null,
        bio: profile?.bio ?? null,
        skills: profile?.skills ?? [],
        interests: profile?.interests ?? [],
        willingToAttend: member.willing_to_attend,
        status: member.status,
        willingToShare: member.willing_to_share,
        willingToJoinProjects: member.willing_to_join_projects,
        isCoBuilder: member.is_co_builder,
        isPubliclyVisible: member.is_publicly_visible,
        isFeaturedOnHome: member.is_featured_on_home,
        joinedAt: member.joined_at,
        lastActiveAt: member.last_active_at,
        registrationCount: registrationsByUserId.get(member.id) ?? 0,
        adminRoles: adminRolesByMemberId.get(member.id) ?? [],
        availableAdminRoles,
      };
    })
    .sort((a, b) => {
      const joinedAtDiff = new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();

      if (joinedAtDiff !== 0) {
        return joinedAtDiff;
      }

      const weightDiff = getMemberSortWeight(a.status) - getMemberSortWeight(b.status);

      if (weightDiff !== 0) {
        return weightDiff;
      }

      return a.displayName.localeCompare(b.displayName, "zh-CN");
    });
  const memberNamesById = new Map(mergedMembers.map((member) => [member.id, member.displayName]));

  const mappedJoinRequests = joinRequests
    .map((request) => ({
      id: request.id,
      displayName: request.display_name,
      wechat: canReadContact ? request.wechat : redactSensitiveValue(request.wechat) ?? "",
      city: request.city?.trim() || "常州",
      roleLabel: request.role_label,
      organization: request.organization,
      monthlyTime: request.monthly_time,
      skills: request.skills ?? [],
      interests: request.interests ?? [],
      note: canReadContact ? request.note : redactSensitiveValue(request.note),
      willingToAttend: request.willing_to_attend,
      willingToShare: request.willing_to_share,
      willingToJoinProjects: request.willing_to_join_projects,
      status: request.status,
      adminNote: canReadContact ? request.admin_note : redactSensitiveValue(request.admin_note),
      contactedAt: request.contacted_at,
      approvedAt: request.approved_at,
      invitedToRegisterAt: request.invited_to_register_at,
      joinedGroupAt: request.joined_group_at,
      firstAttendedEventAt: request.first_attended_event_at,
      convertedToMemberAt: request.converted_to_member_at,
      convertedMemberId: request.converted_member_id,
      convertedMemberDisplayName: request.converted_member_id
        ? memberNamesById.get(request.converted_member_id) ?? null
        : null,
      createdAt: request.created_at,
    }))
    .sort((a, b) => {
      const weightDiff = getJoinRequestSortWeight(a.status) - getJoinRequestSortWeight(b.status);

      if (weightDiff !== 0) {
        return weightDiff;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return {
    members: mergedMembers,
    joinRequests: mappedJoinRequests,
    stats: {
      totalMembers: mergedMembers.length,
      activeMembers: mergedMembers.filter((member) =>
        ["active", "organizer", "admin"].includes(member.status),
      ).length,
      coBuilders: mergedMembers.filter(
        (member) => !["organizer", "admin"].includes(member.status) && member.isCoBuilder,
      ).length,
      willingToShare: mergedMembers.filter((member) => member.willingToShare).length,
      willingToJoinProjects: mergedMembers.filter(
        (member) => member.willingToJoinProjects,
      ).length,
      joinRequests: mappedJoinRequests.length,
    },
    queryErrors,
  };
}

export async function loadAdminMemberOrThrow(memberId: string) {
  const { members, queryErrors } = await loadAdminMembersData();
  const member = members.find((item) => item.id === memberId);

  if (!member) {
    notFound();
  }

  return {
    member,
    queryErrors,
  };
}

export async function loadAdminJoinRequestOrThrow(requestId: string) {
  const { members, joinRequests, queryErrors } = await loadAdminMembersData();
  const joinRequest = joinRequests.find((item) => item.id === requestId);

  if (!joinRequest) {
    notFound();
  }

  return {
    joinRequest,
    memberOptions: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      email: member.email,
    })) as AdminMemberOption[],
    queryErrors,
  };
}
