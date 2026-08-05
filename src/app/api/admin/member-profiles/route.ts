import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { loadAdminPrivateProfilesData } from "@/lib/admin/member-private-profiles";
import { canAdmin } from "@/lib/supabase/guards";

export async function GET() {
  const { context, response } = await requireAdminApiPermission(
    "members.read_private_profile",
  );
  if (response) return response;

  const data = await loadAdminPrivateProfilesData(
    context,
    canAdmin(context, "members.write_private_profile"),
  );
  return NextResponse.json(data);
}
