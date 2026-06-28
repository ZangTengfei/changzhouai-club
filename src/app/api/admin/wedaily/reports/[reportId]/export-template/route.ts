import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { fetchAdminWeDailyReportExportTemplate } from "@/lib/admin/wedaily-admin";

export async function GET(
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
    const template = await fetchAdminWeDailyReportExportTemplate(parsedReportId);

    return NextResponse.json(template);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "wedaily_admin_export_template_failed" },
      { status: 502 },
    );
  }
}
