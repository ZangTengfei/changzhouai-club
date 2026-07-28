"use client";

import Link from "next/link";
import { Empty, Table, type TableColumnsType } from "antd";

import { AdminStatusBadge, type AdminTone } from "@/components/admin-ui";
import { Button } from "@/components/admin-antd/button";
import type { AdminProjectOpportunity } from "@/lib/admin/projects";
import {
  projectOpportunityStatusLabels,
  projectOpportunityTypeLabels,
  projectOpportunityVisibilityLabels,
} from "@/lib/community-projects";

function formatDateTime(value: string | null) {
  if (!value) {
    return "待定";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getProjectStatusTone(status: string): AdminTone {
  switch (status) {
    case "draft":
      return "draft";
    case "recruiting":
      return "scheduled";
    case "matching":
      return "registered";
    case "in_progress":
      return "completed";
    case "filled":
      return "qualified";
    case "closed":
    case "archived":
      return "cancelled";
    default:
      return "neutral";
  }
}

export function AdminProjectsTable({
  opportunities,
}: {
  opportunities: AdminProjectOpportunity[];
}) {
  const columns: TableColumnsType<AdminProjectOpportunity> = [
    {
      title: "项目",
      key: "project",
      width: 360,
      render: (_, opportunity) => (
        <div className="grid gap-1">
          <span className="font-semibold leading-6 text-foreground">
            {opportunity.title}
          </span>
          <span className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {opportunity.summary}
          </span>
          <span className="text-xs text-muted-foreground">
            /projects/{opportunity.slug}
          </span>
        </div>
      ),
    },
    {
      title: "状态",
      key: "status",
      width: 130,
      render: (_, opportunity) => (
        <div className="grid justify-items-start gap-1.5">
          <AdminStatusBadge tone={getProjectStatusTone(opportunity.status)}>
            {projectOpportunityStatusLabels[opportunity.status]}
          </AdminStatusBadge>
          {opportunity.is_featured ? (
            <AdminStatusBadge tone="registered">精选</AdminStatusBadge>
          ) : null}
        </div>
      ),
    },
    {
      title: "类型 / 可见性",
      key: "type",
      width: 180,
      render: (_, opportunity) => (
        <div className="grid gap-1 text-sm text-muted-foreground">
          <span>
            {projectOpportunityTypeLabels[opportunity.opportunity_type]}
          </span>
          <span>
            {projectOpportunityVisibilityLabels[opportunity.visibility]}
          </span>
          <span>
            {opportunity.external_application_url
              ? "外部表单"
              : opportunity.application_requires_login
                ? "需登录申请"
                : "匿名可申请"}
          </span>
        </div>
      ),
    },
    {
      title: "申请",
      dataIndex: "applicationCount",
      key: "applicationCount",
      width: 90,
      align: "center",
      render: (count: number) => (
        <span className="text-sm text-muted-foreground">{count} 条</span>
      ),
    },
    {
      title: "截止 / 更新",
      key: "time",
      width: 230,
      render: (_, opportunity) => (
        <div className="grid gap-1 text-sm text-muted-foreground">
          <span>截止：{formatDateTime(opportunity.deadline_at)}</span>
          <span>更新：{formatDateTime(opportunity.updated_at)}</span>
        </div>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 190,
      align: "right",
      fixed: "right",
      render: (_, opportunity) => (
        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="outline" size="sm">
            <a
              href={`/api/admin/projects/applications/export?project_id=${encodeURIComponent(opportunity.id)}`}
              download
              aria-label={`导出 ${opportunity.title} 的申请记录 CSV`}
            >
              导出
            </a>
          </Button>
          {opportunity.visibility !== "private" &&
          opportunity.status !== "draft" ? (
            <Button asChild type="button" variant="outline" size="sm">
              <Link href={`/projects/${opportunity.slug}`}>前台</Link>
            </Button>
          ) : null}
          <Button asChild type="button" variant="secondary" size="sm">
            <a href={`#manage-project-${opportunity.id}`}>管理</a>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table<AdminProjectOpportunity>
      rowKey="id"
      columns={columns}
      dataSource={opportunities}
      size="middle"
      tableLayout="fixed"
      scroll={{ x: 1180 }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有共建机会"
          />
        ),
      }}
      pagination={
        opportunities.length > 10
          ? {
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) =>
                `第 ${range[0]}–${range[1]} 个，共 ${total} 个项目`,
            }
          : false
      }
    />
  );
}
