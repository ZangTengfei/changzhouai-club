import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { updateAdminWeDailyReport } from "@/lib/admin/wedaily-admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const { response } = await requireAdminApiPermission("updates.publish");
  if (response) return response;

  const { reportId } = await context.params;
  const parsedReportId = Number.parseInt(reportId, 10);
  const payload = (await request.json().catch(() => null)) as { markdown?: unknown } | null;

  if (!Number.isFinite(parsedReportId)) {
    return NextResponse.json({ error: "invalid_report_id" }, { status: 400 });
  }

  if (!payload || typeof payload.markdown !== "string") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const report = await updateAdminWeDailyReport(parsedReportId, payload.markdown);
    revalidatePath("/news");

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "wedaily_admin_update_failed" },
      { status: 502 },
    );
  }
}
