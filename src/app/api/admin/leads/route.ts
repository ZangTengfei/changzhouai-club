import { NextResponse } from "next/server";

import { loadAdminLeadsData } from "@/lib/admin/leads";
import { getStaffContextResult } from "@/lib/supabase/guards";

export async function GET() {
  const context = await getStaffContextResult();

  if (!context.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!context.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const data = await loadAdminLeadsData(context);
  return NextResponse.json(data);
}
