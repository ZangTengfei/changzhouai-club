import type { Metadata } from "next";
import Link from "next/link";

import { updateAdminLead } from "@/app/admin/actions";
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
  saved?: string;
  error?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN");
}

function buildLeadsFilterHref(status: string) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  const query = params.toString();
  return query ? `/admin/leads?${query}` : "/admin/leads";
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { leads, stats, queryErrors } = await loadAdminLeadsData();
  const statusFilter = params.status ?? "all";
  const filteredLeads = leads.filter((lead) =>
    statusFilter === "all" ? true : lead.status === statusFilter,
  );

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Leads</p>
            <h2>合作线索</h2>
            <p>这里现在已经能承接公开合作页提交的线索，并在后台持续筛选和更新跟进状态。</p>
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
          <p>先按线索状态快速扫盘，后面再逐步补负责人、备注和更完整的跟进记录。</p>
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
                href={buildLeadsFilterHref(value)}
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
      </section>

      <section className="surface admin-card">
        {filteredLeads.length > 0 ? (
          <div className="admin-list">
            <div className="admin-list-header admin-lead-list-grid">
              <span>公司与联系人</span>
              <span>联系方式</span>
              <span>需求概况</span>
              <span>预算与时间</span>
              <span>状态更新</span>
            </div>

            {filteredLeads.map((lead) => (
              <article className="admin-list-row admin-lead-list-grid" key={lead.id}>
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

                <form action={updateAdminLead} className="admin-inline-form">
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <input type="hidden" name="redirect_to" value={buildLeadsFilterHref(statusFilter)} />

                  <div className="admin-list-actions">
                    <span
                      className={`pill admin-status-pill admin-status-pill-${getAdminLeadStatusTone(
                        lead.status,
                      )}`}
                    >
                      {formatAdminLeadStatus(lead.status)}
                    </span>

                    <select className="input" name="status" defaultValue={lead.status}>
                      <option value="new">新线索</option>
                      <option value="contacted">已联系</option>
                      <option value="qualified">已判断可跟进</option>
                      <option value="won">已成交</option>
                      <option value="lost">已关闭</option>
                    </select>

                    <button type="submit" className="button button-secondary">
                      保存状态
                    </button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="note-strip">当前筛选条件下还没有合作线索。</div>
        )}
      </section>
    </div>
  );
}
