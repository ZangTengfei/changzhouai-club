import { redirect } from "next/navigation";

import {
  getLegacyAdminPermissionsForMemberStatus,
  hasAdminPermission,
  type AdminPermissionKey,
} from "@/lib/admin/permissions";
import { createClient } from "@/lib/supabase/server";

type AdminPermissionRow = {
  permission_key: string | null;
};

async function loadCurrentAdminPermissions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberStatus: string | null | undefined,
) {
  const legacyPermissions = getLegacyAdminPermissionsForMemberStatus(memberStatus);
  const permissionKeys = new Set<string>(legacyPermissions);

  const { data, error } = await supabase.rpc("list_current_admin_permissions");

  if (!error) {
    ((data ?? []) as AdminPermissionRow[]).forEach((row) => {
      if (row.permission_key) {
        permissionKeys.add(row.permission_key);
      }
    });
  }

  return Array.from(permissionKeys);
}

export async function getAdminContextResult(requiredPermission?: AdminPermissionKey) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      member: null,
      permissions: [],
      isAdmin: false,
      isAuthorized: false,
      isStaff: false,
    };
  }

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();
  const permissions = await loadCurrentAdminPermissions(supabase, member?.status);
  const isAdmin = hasAdminPermission(permissions, "admin.access");
  const isAuthorized = requiredPermission
    ? hasAdminPermission(permissions, requiredPermission)
    : isAdmin;

  return {
    supabase,
    user,
    member,
    permissions,
    isAdmin,
    isAuthorized,
    isStaff: isAdmin,
  };
}

export async function getStaffContextResult() {
  return getAdminContextResult();
}

export async function getAdminContext() {
  const context = await getAdminContextResult();

  if (!context.user) {
    redirect("/login?next=/admin");
  }

  return context;
}

export async function getStaffContext() {
  return getAdminContext();
}

export async function requireAdminAccess() {
  const context = await getAdminContext();

  if (!context.isAdmin) {
    redirect("/account?updated=staff_required");
  }

  return context;
}

export async function requireStaffContext() {
  return requireAdminAccess();
}

export async function requireAdminPermission(permission: AdminPermissionKey) {
  const context = await getAdminContextResult(permission);

  if (!context.user) {
    redirect("/login?next=/admin");
  }

  if (!context.isAuthorized) {
    redirect(`/admin?error=permission_required&permission=${encodeURIComponent(permission)}`);
  }

  return context;
}

export function canAdmin(
  context: Pick<Awaited<ReturnType<typeof getAdminContextResult>>, "permissions">,
  permission: AdminPermissionKey,
) {
  return hasAdminPermission(context.permissions, permission);
}
