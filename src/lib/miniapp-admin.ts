import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getLegacyAdminPermissionsForMemberStatus,
  hasAdminPermission,
} from "@/lib/admin/permissions";
import { resolveCommunityUserId } from "@/lib/community-user";

type AdminRoleAssignment = {
  role_id: string;
  expires_at: string | null;
};

export async function canPreviewMiniappDraftEvents(
  supabase: SupabaseClient,
  userId: string,
) {
  const communityUserId = await resolveCommunityUserId(supabase, userId);
  const [
    { data: member, error: memberError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabase
      .from("members")
      .select("status")
      .eq("id", communityUserId)
      .maybeSingle(),
    supabase
      .from("member_admin_roles")
      .select("role_id, expires_at")
      .eq("member_id", communityUserId),
  ]);

  if (memberError || assignmentsError) {
    throw new Error("miniapp_admin_context_load_failed");
  }
  if (!member || member.status === "paused") return false;

  if (
    hasAdminPermission(
      getLegacyAdminPermissionsForMemberStatus(member.status),
      "events.read",
    )
  ) {
    return true;
  }
  const now = Date.now();
  const roleIds = ((assignments ?? []) as AdminRoleAssignment[])
    .filter(
      (assignment) =>
        !assignment.expires_at || new Date(assignment.expires_at).getTime() > now,
    )
    .map((assignment) => assignment.role_id);
  if (roleIds.length === 0) return false;

  const { data: permission, error: permissionError } = await supabase
    .from("admin_role_permissions")
    .select("role_id")
    .in("role_id", roleIds)
    .eq("permission_key", "events.read")
    .limit(1)
    .maybeSingle();

  if (permissionError) throw new Error("miniapp_admin_permissions_load_failed");
  return Boolean(permission);
}
