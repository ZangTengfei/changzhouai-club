import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import { loadAdminProjectsData } from "@/lib/admin/projects";
import {
  projectApplicationStatusLabels,
  projectOpportunityStatusLabels,
  projectOpportunityVisibilityLabels,
} from "@/lib/community-projects";

const csvHeaders = [
  "项目标题",
  "项目链接",
  "项目状态",
  "项目可见性",
  "申请状态",
  "申请人称呼",
  "职业/当前身份",
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

function buildExportFileName(projectSlug: string) {
  const date = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\//g, "");

  return `project-applications-${projectSlug}-${date}.csv`;
}

export async function GET(request: Request) {
  const { context, response } = await requireAdminApiPermission("projects.export_applications");
  if (response) return response;

  const projectId = new URL(request.url).searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json({ error: "project_id_required" }, { status: 400 });
  }

  const { opportunities } = await loadAdminProjectsData();
  const opportunity = opportunities.find((item) => item.id === projectId);

  if (!opportunity) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }

  await recordAdminAuditLog(context.supabase, {
    actorId: context.user.id,
    action: "project_applications.export",
    resourceType: "project_opportunity",
    resourceId: projectId,
    metadata: {
      applicationCount: opportunity.applications.length,
    },
  });

  const rows = opportunity.applications.map((application) => [
    opportunity.title,
    `/projects/${opportunity.slug}`,
    projectOpportunityStatusLabels[opportunity.status],
    projectOpportunityVisibilityLabels[opportunity.visibility],
    projectApplicationStatusLabels[application.status],
    application.applicant_name,
    application.applicant_occupation ?? "",
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
  ]);
  const csv = `\uFEFF${buildCsv(rows)}`;

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${buildExportFileName(opportunity.slug)}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
