"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AdminField,
  AdminFilterLink,
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
  type AdminTone,
} from "@/components/admin-ui";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminLeadsData } from "@/lib/admin/leads";
import {
  formatAdminLeadStatus,
  getAdminErrorMessage,
  getAdminLeadStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN");
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

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Leads"
          title="合作线索"
          actions={
            <>
              <AdminMetric label="线索总数" value={data?.stats.total ?? "..."} />
              <AdminMetric label="新线索" value={data?.stats.newCount ?? "..."} />
              <AdminMetric label="已联系" value={data?.stats.contactedCount ?? "..."} />
              <AdminMetric label="可跟进" value={data?.stats.qualifiedCount ?? "..."} />
              <AdminMetric label="已匹配" value={data?.stats.matchedCount ?? "..."} />
            </>
          }
        />
      </AdminPanel>

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="Filters" title="线索筛选" />
        <AdminPanelBody className="space-y-4">
          <div className="grid gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              状态
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "全部"],
                ["new", "新线索"],
                ["contacted", "已联系"],
                ["qualified", "可跟进"],
                ["won", "已成交"],
                ["lost", "已关闭"],
              ].map(([value, label]) => (
                <AdminFilterLink
                  key={value}
                  href={buildLeadsFilterHref(value, queryInput)}
                  active={statusFilter === value}
                >
                  {label}
                </AdminFilterLink>
              ))}
            </div>
          </div>

          <form action="/admin/leads" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="status" value={statusFilter} />

            <AdminField label="线索搜索">
              <Input
                type="search"
                name="query"
                defaultValue={queryInput}
                placeholder="搜索公司、联系人、微信、电话、需求、备注"
              />
            </AdminField>

            <div className="flex flex-wrap items-end gap-2">
              <Button type="submit" variant="secondary">
                搜索线索
              </Button>
              {queryInput ? (
                <Button asChild variant="outline">
                  <Link href={buildLeadsFilterHref(statusFilter, "")}>清空搜索</Link>
                </Button>
              ) : null}
            </div>
          </form>
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader eyebrow="Results" title="线索结果" />
        <AdminPanelBody className="p-0">
          {isLoading ? (
            <div className="p-4">
              <AdminNotice>正在加载合作线索...</AdminNotice>
            </div>
          ) : filteredLeads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司与联系人</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>需求概况</TableHead>
                  <TableHead>预算与时间</TableHead>
                  <TableHead>负责人与进度</TableHead>
                  <TableHead className="w-[96px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="grid gap-1">
                        <Link
                          href={buildLeadDetailHref(lead.id, currentPath)}
                          className="font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {lead.companyName}
                        </Link>
                        <span className="text-sm text-muted-foreground">
                          {lead.contactName ?? "未填写联系人"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <span>{lead.contactWechat ? `微信 ${lead.contactWechat}` : "未填微信"}</span>
                        <span>{lead.contactPhone ? `电话 ${lead.contactPhone}` : "未填电话"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <span className="font-medium text-foreground">
                          {lead.requirementType ?? "未填写需求类型"}
                        </span>
                        <span>{lead.requirementSummary}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <span>{lead.budgetRange ?? "预算待沟通"}</span>
                        <span>{lead.desiredTimeline ?? "时间待沟通"}</span>
                        <span>提交于 {formatDate(lead.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="grid gap-1">
                        <AdminStatusBadge
                          tone={getAdminLeadStatusTone(lead.status) as AdminTone}
                          className="w-fit"
                        >
                          {formatAdminLeadStatus(lead.status)}
                        </AdminStatusBadge>
                        <span>
                          负责人：{lead.ownerDisplayName ?? "暂未分配"}
                          {lead.ownerEmail ? ` · ${lead.ownerEmail}` : ""}
                        </span>
                        <span>候选成员：{lead.matchCount > 0 ? `${lead.matchCount} 位` : "暂未匹配"}</span>
                        <span>
                          下一步：{lead.nextAction ?? "待补充"}
                          {lead.nextActionAt ? ` · ${formatDate(lead.nextActionAt)}` : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={buildLeadDetailHref(lead.id, currentPath)}>查看</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-4">
              <AdminNotice>当前筛选条件下没有合作线索。</AdminNotice>
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
