import { NextResponse } from "next/server";

import type { AdminPermissionKey } from "@/lib/admin/permissions";
import { getAdminContextResult } from "@/lib/supabase/guards";

type AdminContext = Awaited<ReturnType<typeof getAdminContextResult>>;
type AuthorizedAdminContext = AdminContext & {
  user: NonNullable<AdminContext["user"]>;
};

export async function requireAdminApiPermission(
  permission: AdminPermissionKey,
): Promise<
  | { context: null; response: NextResponse }
  | { context: AuthorizedAdminContext; response: null }
> {
  const context = await getAdminContextResult(permission);

  if (!context.user) {
    return {
      context: null,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    };
  }

  if (!context.isAuthorized) {
    return {
      context: null,
      response: NextResponse.json(
        {
          error: "forbidden",
          permission,
        },
        { status: 403 },
      ),
    };
  }

  return {
    context: context as AuthorizedAdminContext,
    response: null,
  };
}
