import { NextResponse } from "next/server";

import { revalidateAdminLeadPaths } from "@/lib/admin/revalidate";
import { getStaffContextResult } from "@/lib/supabase/guards";

function getOptionalValue(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();
  return value || null;
}

export async function POST(
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

  const memberId = String(payload.member_id ?? "").trim();
  const status = String(payload.status ?? "suggested").trim();

  if (!leadId || !memberId || !status) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  const { error } = await staffContext.supabase.from("cooperation_lead_matches").insert({
    lead_id: leadId,
    member_id: memberId,
    status,
    note: getOptionalValue(payload, "note"),
    created_by: staffContext.user.id,
  });

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  revalidateAdminLeadPaths(leadId);
  return NextResponse.json({ saved: "lead_match" });
}
