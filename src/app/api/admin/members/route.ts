import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { loadAdminMembersData } from "@/lib/admin/members";

export async function GET() {
  const { context, response } = await requireAdminApiPermission("members.read");
  if (response) return response;

  const data = await loadAdminMembersData(context);
  return NextResponse.json(data);
}
