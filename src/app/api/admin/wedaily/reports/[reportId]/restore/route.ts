import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { restoreAdminWeDailyReport } from "@/lib/admin/wedaily-admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const { response } = await requireAdminApiPermission("updates.publish");
  if (response) return response;

  const { reportId } = await context.params;
  const parsedReportId = Number.parseInt(reportId, 10);

  if (!Number.isFinite(parsedReportId)) {
    return NextResponse.json({ error: "invalid_report_id" }, { status: 400 });
  }

  try {
    const report = await restoreAdminWeDailyReport(parsedReportId);
    revalidatePath("/news");

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "wedaily_admin_restore_failed" },
      { status: 502 },
    );
  }
}
