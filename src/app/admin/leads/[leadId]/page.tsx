import type { Metadata } from "next";
import Link from "next/link";

import {
  deleteAdminLeadMatch,
  saveAdminLeadMatch,
  updateAdminLeadDetail,
} from "@/app/admin/actions";
import {
  formatAdminLeadMatchStatus,
  formatAdminLeadStatus,
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminLeadMatchStatusTone,
  getAdminLeadStatusTone,
  getAdminSavedMessage,
  getAdminMemberStatusTone,
} from "@/lib/admin/event-feedback";
import { loadAdminLeadOrThrow } from "@/lib/admin/leads";

export const metadata: Metadata = {
  title: "合作线索详情",
  description: "查看合作线索详情、记录跟进动作并匹配候选成员。",
};

type SearchParams = {
  from?: string;
  saved?: string;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
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
  const { lead, staffOptions, memberOptions, queryErrors } = await loadAdminLeadOrThrow(
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
            <p>这里不只是记录线索本身，也负责把它推进到具体成员匹配和下一步动作上。</p>
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
          <span className="pill">候选成员 {lead.matchCount}</span>
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
            <span className="admin-card-label">预算与时间</span>
            <p className="admin-member-bio">预算范围：{lead.budgetRange ?? "待沟通"}</p>
            <p className="admin-member-bio">提交时间：{formatDate(lead.createdAt)}</p>
            <p className="admin-member-bio">最近更新：{formatDate(lead.updatedAt)}</p>
          </div>

          <div className="admin-note-panel">
            <span className="admin-card-label">负责人与推进</span>
            <p className="admin-member-bio">
              负责人：{lead.ownerDisplayName ?? "暂未分配"}
              {lead.ownerEmail ? ` · ${lead.ownerEmail}` : ""}
            </p>
            <p className="admin-member-bio">最近联系：{formatDate(lead.lastContactedAt)}</p>
            <p className="admin-member-bio">
              下一步：{lead.nextAction ?? "暂未填写"}
              {lead.nextActionAt ? ` · ${formatDate(lead.nextActionAt)}` : ""}
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

            <label className="form-field form-field-wide">
              <span>下一步动作</span>
              <input
                className="input"
                name="next_action"
                defaultValue={lead.nextAction ?? ""}
                placeholder="例如：约一次需求澄清电话、邀请参加下一场活动、匹配 2 位候选成员"
              />
            </label>

            <label className="form-field">
              <span>下一步时间</span>
              <input
                className="input"
                type="datetime-local"
                name="next_action_at"
                defaultValue={toDatetimeLocal(lead.nextActionAt)}
              />
            </label>

            <label className="form-field">
              <span>最近联系时间</span>
              <input
                className="input"
                type="datetime-local"
                name="last_contacted_at"
                defaultValue={toDatetimeLocal(lead.lastContactedAt)}
              />
            </label>

            <label className="form-field admin-join-request-note-field">
              <span>管理员备注</span>
              <textarea
                className="input textarea"
                name="admin_note"
                rows={5}
                defaultValue={lead.adminNote ?? ""}
                placeholder="例如：已电话沟通、适合安排专题分享、预算仍待确认、适合匹配哪类社区成员"
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

      <section className="surface admin-card">
        <div className="section-heading">
          <p className="eyebrow">Matches</p>
          <h2>候选成员匹配</h2>
          <p>为这条线索维护候选成员、匹配状态与引荐记录，方便持续推进合作。</p>
        </div>

        {lead.matches.length > 0 ? (
          <div className="admin-lead-match-list">
            {lead.matches.map((match) => (
              <article className="admin-lead-match-card" key={match.id}>
                <div className="admin-lead-match-head">
                  <div className="admin-list-primary">
                    <h3 className="admin-list-title">{match.memberDisplayName}</h3>
                    <p className="admin-compact-note">
                      {match.memberCity}
                      {match.memberEmail ? ` · ${match.memberEmail}` : ""}
                    </p>
                  </div>

                  <div className="pill-row">
                    <span
                      className={`pill admin-status-pill admin-status-pill-${getAdminMemberStatusTone(
                        match.memberStatus,
                      )}`}
                    >
                      {formatAdminMemberStatus(match.memberStatus)}
                    </span>
                    <span
                      className={`pill admin-status-pill admin-status-pill-${getAdminLeadMatchStatusTone(
                        match.status,
                      )}`}
                    >
                      {formatAdminLeadMatchStatus(match.status)}
                    </span>
                  </div>
                </div>

                {match.memberSkills.length > 0 ? (
                  <div className="member-skill-list">
                    {match.memberSkills.map((skill) => (
                      <span key={`${match.id}-${skill}`}>{skill}</span>
                    ))}
                  </div>
                ) : null}

                <form action={saveAdminLeadMatch} className="admin-inline-form">
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <input type="hidden" name="match_id" value={match.id} />
                  <input type="hidden" name="member_id" value={match.memberId} />
                  <input type="hidden" name="redirect_to" value={currentPath} />

                  <div className="form-grid admin-join-request-settings-grid">
                    <label className="form-field">
                      <span>匹配状态</span>
                      <select className="input" name="status" defaultValue={match.status}>
                        <option value="suggested">候选建议</option>
                        <option value="contacted">已联系成员</option>
                        <option value="introduced">已引荐对接</option>
                        <option value="active">进入推进</option>
                        <option value="not_fit">暂不匹配</option>
                      </select>
                    </label>

                    <label className="form-field admin-join-request-note-field">
                      <span>匹配备注</span>
                      <textarea
                        className="input textarea"
                        name="note"
                        rows={4}
                        defaultValue={match.note ?? ""}
                        placeholder="例如：成员对这个方向有经验、已经私聊过、建议先参加下一场活动再正式引荐"
                      />
                    </label>
                  </div>

                  <div className="cta-row">
                    <button type="submit" className="button button-secondary">
                      保存匹配
                    </button>
                  </div>
                </form>

                <form action={deleteAdminLeadMatch}>
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <input type="hidden" name="match_id" value={match.id} />
                  <input type="hidden" name="redirect_to" value={currentPath} />
                  <button type="submit" className="button button-secondary">
                    删除匹配
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="note-strip">
            这条线索暂未匹配候选成员，可先补充最合适的成员人选。
          </div>
        )}

        <article className="admin-lead-match-create">
          <div className="section-heading">
            <p className="eyebrow">New Match</p>
            <h3>新增候选成员</h3>
            <p>补充适合参与该需求的成员，便于联系、引荐和协作安排。</p>
          </div>

          <form action={saveAdminLeadMatch} className="admin-inline-form">
            <input type="hidden" name="lead_id" value={lead.id} />
            <input type="hidden" name="redirect_to" value={currentPath} />

            <div className="form-grid admin-join-request-settings-grid">
              <label className="form-field">
                <span>候选成员</span>
                <select className="input" name="member_id" defaultValue="">
                  <option value="">请选择成员</option>
                  {memberOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName}
                      {member.city ? ` · ${member.city}` : ""}
                      {member.skills.length > 0 ? ` · ${member.skills.slice(0, 2).join(" / ")}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>初始状态</span>
                <select className="input" name="status" defaultValue="suggested">
                  <option value="suggested">候选建议</option>
                  <option value="contacted">已联系成员</option>
                  <option value="introduced">已引荐对接</option>
                  <option value="active">进入推进</option>
                  <option value="not_fit">暂不匹配</option>
                </select>
              </label>

              <label className="form-field admin-join-request-note-field">
                <span>匹配备注</span>
                <textarea
                  className="input textarea"
                  name="note"
                  rows={4}
                  placeholder="例如：擅长做企业场景 AI 应用、适合参与需求澄清、已经在线下活动里交流过"
                />
              </label>
            </div>

            <div className="cta-row">
              <button type="submit" className="button">
                添加候选成员
              </button>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}
