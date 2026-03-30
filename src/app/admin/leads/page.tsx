import type { Metadata } from "next";
import Link from "next/link";

import {
  formatAdminLeadStatus,
  getAdminErrorMessage,
  getAdminLeadStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminLeadsData } from "@/lib/admin/leads";

export const metadata: Metadata = {
  title: "合作线索",
  description: "查看和管理合作需求线索。",
};

type SearchParams = {
  status?: string;
  query?: string;
  saved?: string;
  error?: string;
};

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

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { leads, stats, queryErrors } = await loadAdminLeadsData();
  const statusFilter = params.status ?? "all";
  const queryInput = (params.query ?? "").trim();
  const keyword = normalizeSearchText(queryInput);
  const currentPath = buildLeadsFilterHref(statusFilter, queryInput);

  const filteredLeads = leads.filter((lead) => {
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
  });

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Leads</p>
            <h2>合作线索</h2>
            <p>查看全部合作需求，快速了解状态、负责人、候选成员与跟进动作。</p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>{stats.total}</strong>
              <span>线索总数</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{stats.newCount}</strong>
              <span>新线索</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{stats.contactedCount}</strong>
              <span>已联系</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{stats.qualifiedCount}</strong>
              <span>可跟进</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{stats.matchedCount}</strong>
              <span>已匹配成员</span>
            </div>
          </div>
        </div>
      </section>

      {params.saved ? (
        <div className="note-strip">{getAdminSavedMessage(params.saved)}</div>
      ) : null}

      {params.error ? (
        <div className="note-strip">{getAdminErrorMessage(params.error)}</div>
      ) : null}

      {queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{queryErrors.join(" | ")}</div>
      ) : null}

      <section className="surface admin-card">
        <div className="section-heading">
          <p className="eyebrow">Filters</p>
          <h2>线索筛选</h2>
          <p>按线索状态和关键词筛选，快速定位需要优先推进的合作需求。</p>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">状态</span>
          <div className="admin-filter-row">
            {[
              ["all", "全部"],
              ["new", "新线索"],
              ["contacted", "已联系"],
              ["qualified", "可跟进"],
              ["won", "已成交"],
              ["lost", "已关闭"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildLeadsFilterHref(value, queryInput)}
                className={
                  statusFilter === value
                    ? "admin-filter-chip admin-filter-chip-active"
                    : "admin-filter-chip"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <form action="/admin/leads" className="admin-search-form">
          <input type="hidden" name="status" value={statusFilter} />

          <label className="form-field admin-search-field">
            <span>线索搜索</span>
            <input
              className="input"
              type="search"
              name="query"
              defaultValue={queryInput}
              placeholder="搜索公司、联系人、微信、电话、需求、备注"
            />
          </label>

          <div className="admin-search-actions">
            <button type="submit" className="button button-secondary">
              搜索线索
            </button>
            {queryInput ? (
              <Link
                href={buildLeadsFilterHref(statusFilter, "")}
                className="button button-secondary"
              >
                清空搜索
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="surface admin-card">
        <div className="section-heading">
          <p className="eyebrow">Lead List</p>
          <h2>线索结果</h2>
          <p>当前筛选后共有 {filteredLeads.length} 条线索。点击任意一行可进入详情页。</p>
        </div>

        {filteredLeads.length > 0 ? (
          <div className="admin-list">
            <div className="admin-list-header admin-lead-list-grid">
              <span>公司与联系人</span>
              <span>联系方式</span>
              <span>需求概况</span>
              <span>预算与时间</span>
              <span>负责人与进度</span>
            </div>

            {filteredLeads.map((lead) => (
              <Link
                key={lead.id}
                href={buildLeadDetailHref(lead.id, currentPath)}
                className="admin-list-row admin-lead-list-grid admin-list-link"
              >
                <div className="admin-list-primary">
                  <h3 className="admin-list-title">{lead.companyName}</h3>
                  <p className="admin-compact-note">
                    {lead.contactName ?? "未填写联系人"}
                  </p>
                </div>

                <div className="admin-list-cell">
                  <span>{lead.contactWechat ? `微信 ${lead.contactWechat}` : "未填微信"}</span>
                  <span>{lead.contactPhone ? `电话 ${lead.contactPhone}` : "未填电话"}</span>
                </div>

                <div className="admin-list-cell">
                  <strong>{lead.requirementType ?? "未填写需求类型"}</strong>
                  <span>{lead.requirementSummary}</span>
                </div>

                <div className="admin-list-cell">
                  <span>{lead.budgetRange ?? "预算待沟通"}</span>
                  <span>{lead.desiredTimeline ?? "时间待沟通"}</span>
                  <span>提交于 {formatDate(lead.createdAt)}</span>
                </div>

                <div className="admin-list-cell">
                  <span
                    className={`pill admin-status-pill admin-status-pill-${getAdminLeadStatusTone(
                      lead.status,
                    )}`}
                  >
                    {formatAdminLeadStatus(lead.status)}
                  </span>
                  <span>
                    负责人：{lead.ownerDisplayName ?? "暂未分配"}
                    {lead.ownerEmail ? ` · ${lead.ownerEmail}` : ""}
                  </span>
                  <span>
                    候选成员：{lead.matchCount > 0 ? `${lead.matchCount} 位` : "暂未匹配"}
                  </span>
                  <span>
                    下一步：{lead.nextAction ?? "待补充"}
                    {lead.nextActionAt
                      ? ` · ${formatDate(lead.nextActionAt)}`
                      : ""}
                  </span>
                  <span>最近更新：{formatDate(lead.updatedAt)}</span>
                  <span className="admin-list-snippet">
                    {lead.adminNote ?? "暂时还没有管理员备注"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="note-strip">当前筛选条件下没有合作线索。</div>
        )}
      </section>
    </div>
  );
}
