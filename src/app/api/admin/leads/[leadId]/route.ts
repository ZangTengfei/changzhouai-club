import { NextResponse } from "next/server";

import { loadAdminLeadsData } from "@/lib/admin/leads";
import { revalidateAdminLeadPaths } from "@/lib/admin/revalidate";
import { getStaffContextResult } from "@/lib/supabase/guards";

function getOptionalValue(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();
  return value || null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { leadId } = await context.params;
  const data = await loadAdminLeadsData(staffContext);
  const lead = data.leads.find((item) => item.id === leadId);

  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    lead,
    staffOptions: data.staffOptions,
    memberOptions: data.memberOptions,
    queryErrors: data.queryErrors,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  const staffContext = await getStaffContextResult();

  if (!staffContext.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!staffContext.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { leadId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const status = String(payload.status ?? "").trim();

  if (!leadId || !status) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const { error } = await staffContext.supabase
    .from("cooperation_leads")
    .update({
      status,
      admin_note: getOptionalValue(payload, "admin_note"),
      owner_id: getOptionalValue(payload, "owner_id"),
      next_action: getOptionalValue(payload, "next_action"),
      next_action_at: getOptionalValue(payload, "next_action_at"),
      last_contacted_at: getOptionalValue(payload, "last_contacted_at"),
    })
    .eq("id", leadId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminLeadPaths(leadId);
  return NextResponse.json({ saved: "lead_detail" });
}
