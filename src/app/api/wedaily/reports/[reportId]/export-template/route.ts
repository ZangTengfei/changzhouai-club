import { NextResponse } from "next/server";

import { fetchAdminWeDailyReportExportTemplate } from "@/lib/admin/wedaily-admin";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
      { error: error instanceof Error ? error.message : "wedaily_export_template_failed" },
      { status: 502 },
    );
  }
}
