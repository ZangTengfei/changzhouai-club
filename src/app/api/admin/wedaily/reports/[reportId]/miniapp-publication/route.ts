import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { listAdminWeDailyReports } from "@/lib/admin/wedaily-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const { response } = await requireAdminApiPermission("updates.publish");
  if (response) return response;

  const reportId = await getReportId(context);
  if (!reportId) return NextResponse.json({ error: "invalid_report_id" }, { status: 400 });

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  const { data, error } = await supabase
    .from("miniapp_group_digest_publications")
    .select("is_published")
    .eq("report_id", reportId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "publication_load_failed" }, { status: 500 });

  return NextResponse.json({ published: data?.is_published ?? true });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  const { context: adminContext, response } = await requireAdminApiPermission("updates.publish");
  if (response) return response;

  const reportId = await getReportId(context);
  const payload = (await request.json().catch(() => null)) as { published?: unknown } | null;
  if (!reportId || typeof payload?.published !== "boolean") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const reports = await listAdminWeDailyReports({ limit: 200 });
    if (!reports.some((report) => report.id === reportId)) {
      return NextResponse.json({ error: "report_not_found" }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "wedaily_admin_request_failed" },
      { status: 502 },
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  const now = new Date().toISOString();
  const { error } = await supabase.from("miniapp_group_digest_publications").upsert(
    {
      report_id: reportId,
      is_published: payload.published,
      published_at: payload.published ? now : null,
      reviewed_by: adminContext.user.id,
    },
    { onConflict: "report_id" },
  );
  if (error) return NextResponse.json({ error: "publication_save_failed" }, { status: 500 });

  return NextResponse.json({ published: payload.published });
}

async function getReportId(context: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await context.params;
  const parsed = Number.parseInt(reportId, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
