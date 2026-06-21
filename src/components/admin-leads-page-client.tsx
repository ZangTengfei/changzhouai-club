"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ClearOutlined,
  EyeOutlined,
  SearchOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Input,
  Space,
  Statistic,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";

import { AdminStatusTag } from "@/components/admin-antd";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminLead, AdminLeadsData } from "@/lib/admin/leads";
import {
  formatAdminLeadStatus,
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesKeyword(fields: Array<string | null | undefined>, keyword: string) {
  if (!keyword) {
    return true;
  }

  return fields.some((field) => normalizeSearchText(field ?? "").includes(keyword));
}

function buildLeadsFilterHref(status: string, query: string) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (query.trim()) {
    params.set("query", query.trim());
  }

  const nextQuery = params.toString();
  return nextQuery ? `/admin/leads?${nextQuery}` : "/admin/leads";
}

function buildLeadDetailHref(leadId: string, currentPath: string) {
  const params = new URLSearchParams();
  params.set("from", currentPath);
  return `/admin/leads/${leadId}?${params.toString()}`;
}

const statusFilters = [
  ["all", "全部"],
  ["new", "新线索"],
  ["contacted", "已联系"],
  ["qualified", "可跟进"],
  ["won", "已成交"],
  ["lost", "已关闭"],
] as const;

export function AdminLeadsPageClient() {
  const searchParams = useSearchParams();
  const { data, error, isLoading } = useAdminResource<AdminLeadsData>("/api/admin/leads");

  const statusFilter = searchParams.get("status") ?? "all";
  const queryInput = (searchParams.get("query") ?? "").trim();
  const keyword = normalizeSearchText(queryInput);
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const currentPath = buildLeadsFilterHref(statusFilter, queryInput);

  const filteredLeads =
    data?.leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false;
      }

      return matchesKeyword(
        [
          lead.companyName,
          lead.contactName,
          lead.contactWechat,
          lead.contactPhone,
          lead.requirementType,
          lead.requirementSummary,
          lead.budgetRange,
          lead.desiredTimeline,
          lead.ownerDisplayName,
          lead.ownerEmail,
          lead.adminNote,
          lead.nextAction,
          lead.matches.map((match) => match.memberDisplayName).join(" "),
        ],
        keyword,
      );
    }) ?? [];

  const columns: TableColumnsType<AdminLead> = [
    {
      title: "公司与联系人",
      dataIndex: "companyName",
      render: (_, lead) => (
        <Space orientation="vertical" size={2}>
          <Link className="font-semibold text-foreground hover:text-primary" href={buildLeadDetailHref(lead.id, currentPath)}>
            {lead.companyName}
          </Link>
          <Typography.Text type="secondary">{lead.contactName ?? "未填写联系人"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "联系方式",
      width: 170,
      render: (_, lead) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary">{lead.contactWechat ? `微信 ${lead.contactWechat}` : "未填微信"}</Typography.Text>
          <Typography.Text type="secondary">{lead.contactPhone ? `电话 ${lead.contactPhone}` : "未填电话"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "需求概况",
      render: (_, lead) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{lead.requirementType ?? "未填写需求类型"}</Typography.Text>
          <Typography.Text type="secondary">{lead.requirementSummary}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "预算与时间",
      width: 190,
      render: (_, lead) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text type="secondary">{lead.budgetRange ?? "预算待沟通"}</Typography.Text>
          <Typography.Text type="secondary">{lead.desiredTimeline ?? "时间待沟通"}</Typography.Text>
          <Typography.Text type="secondary">提交于 {formatDate(lead.createdAt)}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "负责人",
      width: 210,
      render: (_, lead) => (
        <Space orientation="vertical" size={4}>
          <AdminStatusTag status={lead.status} label={formatAdminLeadStatus(lead.status)} />
          <Typography.Text type="secondary">
            {lead.ownerDisplayName ?? "暂未分配"}
            {lead.ownerEmail ? ` · ${lead.ownerEmail}` : ""}
          </Typography.Text>
          <Typography.Text type="secondary">候选成员：{lead.matchCount > 0 ? `${lead.matchCount} 位` : "暂未匹配"}</Typography.Text>
          <Typography.Text type="secondary">
            下一步：{lead.nextAction ?? "待补充"}
            {lead.nextActionAt ? ` · ${formatDate(lead.nextActionAt)}` : ""}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "操作",
      width: 96,
      align: "right",
      render: (_, lead) => (
        <Button icon={<EyeOutlined />} href={buildLeadDetailHref(lead.id, currentPath)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Typography.Text type="secondary">Leads</Typography.Text>
            <Typography.Title level={2} style={{ margin: "4px 0 0" }}>
              合作线索
            </Typography.Title>
          </div>
          <Space wrap size="large">
            <Statistic title="线索总数" value={data?.stats.total ?? 0} prefix={<TeamOutlined />} />
            <Statistic title="新线索" value={data?.stats.newCount ?? 0} />
            <Statistic title="已联系" value={data?.stats.contactedCount ?? 0} />
            <Statistic title="可跟进" value={data?.stats.qualifiedCount ?? 0} />
            <Statistic title="已匹配" value={data?.stats.matchedCount ?? 0} />
          </Space>
        </div>
      </Card>

      {error ? <Alert title={`后台数据读取出现问题：${error}`} type="warning" showIcon /> : null}
      {data && data.queryErrors.length > 0 ? (
        <Alert title={`后台数据读取出现问题：${data.queryErrors.join(" | ")}`} type="warning" showIcon />
      ) : null}

      <Card title="线索筛选">
        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          <Space wrap>
            {statusFilters.map(([value, label]) => (
              <Button
                key={value}
                type={statusFilter === value ? "primary" : "default"}
                href={buildLeadsFilterHref(value, queryInput)}
              >
                {label}
              </Button>
            ))}
          </Space>

          <form action="/admin/leads" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="status" value={statusFilter} />
            <Input
              type="search"
              name="query"
              defaultValue={queryInput}
              placeholder="搜索公司、联系人、微信、电话、需求、备注"
              prefix={<SearchOutlined />}
            />
            <Space wrap>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索线索
              </Button>
              {queryInput ? (
                <Button href={buildLeadsFilterHref(statusFilter, "")} icon={<ClearOutlined />}>
                  清空
                </Button>
              ) : null}
            </Space>
          </form>
        </Space>
      </Card>

      <Card title="线索结果">
        <Table
          columns={columns}
          dataSource={filteredLeads}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1080 }}
          locale={{
            emptyText: "当前筛选条件下没有合作线索。",
          }}
        />
      </Card>
    </div>
  );
}
