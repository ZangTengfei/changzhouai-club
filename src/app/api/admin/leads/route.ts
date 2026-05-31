import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { loadAdminLeadsData } from "@/lib/admin/leads";

export async function GET() {
  const { context, response } = await requireAdminApiPermission("leads.read");
  if (response) return response;

  const data = await loadAdminLeadsData(context);
  return NextResponse.json(data);
}
