import { NextResponse } from "next/server";

import { loadAdminProjectsData } from "@/lib/admin/projects";
import {
  projectApplicationStatusLabels,
  projectOpportunityStatusLabels,
  projectOpportunityVisibilityLabels,
} from "@/lib/community-projects";
import { getStaffContextResult } from "@/lib/supabase/guards";

const csvHeaders = [
  "项目标题",
  "项目链接",
  "项目状态",
  "项目可见性",
  "申请状态",
  "申请人称呼",
  "关联账号名",
  "账号邮箱",
  "微信",
  "手机号",
  "联系邮箱",
  "申请角色/参与方式",
  "可投入时间",
  "相关经验",
  "作品/案例链接",
  "申请备注",
  "管理员备注",
  "提交时间",
  "更新时间",
  "申请 ID",
  "项目 ID",
];

function formatCsvDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replace(/\//g, "-");
}

function escapeCsvCell(value: string | number | null | undefined) {
  const normalized = String(value ?? "").replace(/\r?\n/g, "\n");

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function buildCsv(rows: string[][]) {
  return [
    csvHeaders.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\r\n");
}

function buildExportFileName() {
  const date = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\//g, "");

  return `project-applications-${date}.csv`;
}

export async function GET() {
  const context = await getStaffContextResult();

  if (!context.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!context.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { opportunities } = await loadAdminProjectsData();
  const rows = opportunities.flatMap((opportunity) =>
    opportunity.applications.map((application) => [
      opportunity.title,
      `/projects/${opportunity.slug}`,
      projectOpportunityStatusLabels[opportunity.status],
      projectOpportunityVisibilityLabels[opportunity.visibility],
      projectApplicationStatusLabels[application.status],
      application.applicant_name,
      application.applicantDisplayName,
      application.applicantEmail ?? "",
      application.contact_wechat ?? "",
      application.contact_phone ?? "",
      application.contact_email ?? "",
      application.role_interest ?? "",
      application.available_time ?? "",
      application.experience_summary ?? "",
      application.portfolio_url ?? "",
      application.note ?? "",
      application.admin_note ?? "",
      formatCsvDateTime(application.created_at),
      formatCsvDateTime(application.updated_at),
      application.id,
      opportunity.id,
    ]),
  );
  const csv = `\uFEFF${buildCsv(rows)}`;

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${buildExportFileName()}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
