import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { loadAdminSpacesData } from "@/lib/admin/spaces";

export async function GET() {
  const { context, response } = await requireAdminApiPermission("spaces.read");
  if (response) return response;

  try {
    const data = await loadAdminSpacesData(context);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "admin_spaces_load_failed" }, { status: 500 });
  }
}
