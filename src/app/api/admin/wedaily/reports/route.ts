import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { getAdminWeDailyConfig, listAdminWeDailyReports } from "@/lib/admin/wedaily-admin";

export async function GET(request: Request) {
  const { response } = await requireAdminApiPermission("updates.publish");
  if (response) return response;

  if (!getAdminWeDailyConfig()) {
    return NextResponse.json({ error: "wedaily_admin_not_configured" }, { status: 503 });
  }

  const params = new URL(request.url).searchParams;
  const limit = Number.parseInt(params.get("limit") ?? "20", 10);

  try {
    const reports = await listAdminWeDailyReports({
      date: params.get("date"),
      limit: Number.isFinite(limit) ? limit : 20,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "wedaily_admin_request_failed" },
      { status: 502 },
    );
  }
}
