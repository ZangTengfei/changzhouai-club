import type { Metadata } from "next";
import Link from "next/link";

import { updateAdminLeadDetail } from "@/app/admin/actions";
import {
  formatAdminLeadStatus,
  getAdminErrorMessage,
  getAdminLeadStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminLeadOrThrow } from "@/lib/admin/leads";

export const metadata: Metadata = {
  title: "合作线索详情",
  description: "查看合作线索详情并记录管理员备注。",
};

type SearchParams = {
  from?: string;
  saved?: string;
  error?: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN");
}

function getBackHref(from?: string) {
  if (from?.startsWith("/admin/leads")) {
    return from;
  }

  return "/admin/leads";
}

function buildCurrentPath(leadId: string, from?: string) {
  const params = new URLSearchParams();

  if (from?.startsWith("/admin/leads")) {
    params.set("from", from);
  }

  const query = params.toString();
  return query ? `/admin/leads/${leadId}?${query}` : `/admin/leads/${leadId}`;
}

export default async function AdminLeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [routeParams, query] = await Promise.all([params, searchParams]);
  const { lead, staffOptions, queryErrors } = await loadAdminLeadOrThrow(
    routeParams.leadId,
  );
  const backHref = getBackHref(query.from);
  const currentPath = buildCurrentPath(routeParams.leadId, query.from);

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Lead Detail</p>
            <h2>{lead.companyName}</h2>
            <p>这里集中查看合作背景、联系方式、预算时间和管理员备注，适合作为轻量 CRM 的详情页。</p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>{formatAdminLeadStatus(lead.status)}</strong>
              <span>当前状态</span>
            </div>

            <Link href={backHref} className="button button-secondary">
              返回线索列表
            </Link>
          </div>
        </div>

        <div className="pill-row">
          <span
            className={`pill admin-status-pill admin-status-pill-${getAdminLeadStatusTone(
              lead.status,
            )}`}
          >
            {formatAdminLeadStatus(lead.status)}
          </span>
          <span className="pill">{lead.requirementType ?? "未填写需求类型"}</span>
          <span className="pill">{lead.budgetRange ?? "预算待沟通"}</span>
        </div>
      </section>

      {query.saved ? (
        <div className="note-strip">{getAdminSavedMessage(query.saved)}</div>
      ) : null}

      {query.error ? (
        <div className="note-strip">{getAdminErrorMessage(query.error)}</div>
      ) : null}

      {queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{queryErrors.join(" | ")}</div>
      ) : null}

      <section className="surface admin-card admin-member-card">
        <div className="admin-member-card-meta">
          <div className="admin-note-panel">
            <span className="admin-card-label">基础信息</span>
            <p className="admin-member-bio">公司 / 机构：{lead.companyName}</p>
            <p className="admin-member-bio">联系人：{lead.contactName ?? "未填写"}</p>
            <p className="admin-member-bio">需求类型：{lead.requirementType ?? "未填写"}</p>
          </div>

          <div className="admin-note-panel">
            <span className="admin-card-label">联系与时间</span>
            <p className="admin-member-bio">微信号：{lead.contactWechat ?? "未填写"}</p>
            <p className="admin-member-bio">手机号：{lead.contactPhone ?? "未填写"}</p>
            <p className="admin-member-bio">期望时间：{lead.desiredTimeline ?? "待沟通"}</p>
          </div>
        </div>

        <div className="admin-note-panel">
          <span className="admin-card-label">需求简介</span>
          <p className="admin-member-bio">{lead.requirementSummary}</p>
        </div>

        <div className="admin-member-card-meta">
          <div className="admin-note-panel">
            <span className="admin-card-label">预算与提交时间</span>
            <p className="admin-member-bio">预算范围：{lead.budgetRange ?? "待沟通"}</p>
            <p className="admin-member-bio">提交时间：{formatDate(lead.createdAt)}</p>
            <p className="admin-member-bio">最近更新：{formatDate(lead.updatedAt)}</p>
          </div>

          <div className="admin-note-panel">
            <span className="admin-card-label">负责人与备注</span>
            <p className="admin-member-bio">
              负责人：{lead.ownerDisplayName ?? "暂未分配"}
            </p>
            <p className="admin-member-bio">
              {lead.adminNote ?? "暂时还没有管理员备注。"}
            </p>
          </div>
        </div>

        <form action={updateAdminLeadDetail} className="admin-inline-form">
          <input type="hidden" name="lead_id" value={lead.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="form-grid admin-join-request-settings-grid">
            <label className="form-field">
              <span>线索状态</span>
              <select className="input" name="status" defaultValue={lead.status}>
                <option value="new">新线索</option>
                <option value="contacted">已联系</option>
                <option value="qualified">已判断可跟进</option>
                <option value="won">已成交</option>
                <option value="lost">已关闭</option>
              </select>
            </label>

            <label className="form-field">
              <span>负责人</span>
              <select className="input" name="owner_id" defaultValue={lead.ownerId ?? ""}>
                <option value="">暂不分配</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.displayName}
                    {staff.email ? ` · ${staff.email}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field admin-join-request-note-field">
              <span>管理员备注</span>
              <textarea
                className="input textarea"
                name="admin_note"
                rows={5}
                defaultValue={lead.adminNote ?? ""}
                placeholder="例如：已电话沟通、需要先做内部分享、适合匹配哪位社区成员、预算仍待确认"
              />
            </label>
          </div>

          <div className="cta-row">
            <button type="submit" className="button">
              保存线索详情
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
