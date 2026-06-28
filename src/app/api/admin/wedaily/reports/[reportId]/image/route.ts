import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { fetchAdminWeDailyReportImage } from "@/lib/admin/wedaily-admin";

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
    const image = await fetchAdminWeDailyReportImage(parsedReportId);

    return new Response(image.bytes, {
      headers: {
        "content-disposition": `attachment; filename="${image.fileName}"`,
        "content-type": image.contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "wedaily_admin_image_failed" },
      { status: 502 },
    );
  }
}
