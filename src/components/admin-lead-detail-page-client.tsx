"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { ToneBadge } from "@/components/tone-badge";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  formatAdminLeadMatchStatus,
  formatAdminLeadStatus,
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminLeadMatchStatusTone,
  getAdminLeadStatusTone,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminLead, AdminLeadMemberOption, AdminLeadStaffOption } from "@/lib/admin/leads";

type AdminLeadDetailData = {
  lead: AdminLead;
  staffOptions: AdminLeadStaffOption[];
  memberOptions: AdminLeadMemberOption[];
  queryErrors: string[];
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

function getBackHref(from?: string | null) {
  if (from?.startsWith("/admin/leads")) {
    return from;
  }

  return "/admin/leads";
}

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; saved?: string }
    | null;

  if (!response.ok) {
    throw new Error(getAdminErrorMessage(payload?.error) ?? "提交失败，请稍后再试。");
  }

  return payload;
}

export function AdminLeadDetailPageClient({ leadId }: { leadId: string }) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminLeadDetailData>(
    `/api/admin/leads/${leadId}`,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const lead = data?.lead;
  const staffOptions = data?.staffOptions ?? [];
  const memberOptions = data?.memberOptions ?? [];
  const backHref = getBackHref(searchParams.get("from"));
  const querySaved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;

  function handleLeadSubmit(formData: FormData) {
    startTransition(async () => {
      setFeedback(null);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/admin/leads/${leadId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: String(formData.get("status") ?? ""),
            owner_id: String(formData.get("owner_id") ?? ""),
            next_action: String(formData.get("next_action") ?? ""),
            next_action_at: String(formData.get("next_action_at") ?? ""),
            last_contacted_at: String(formData.get("last_contacted_at") ?? ""),
            admin_note: String(formData.get("admin_note") ?? ""),
          }),
        });
        const result = await readApiResult(response);
        setFeedback(getAdminSavedMessage(result?.saved ?? "lead_detail"));
        reload();
      } catch (requestError) {
        setSubmitError(
          requestError instanceof Error ? requestError.message : "保存失败，请稍后再试。",
        );
      }
    });
  }

  function handleCreateMatch(formData: FormData) {
    startTransition(async () => {
      setFeedback(null);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/admin/leads/${leadId}/matches`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            member_id: String(formData.get("member_id") ?? ""),
            status: String(formData.get("status") ?? "suggested"),
            note: String(formData.get("note") ?? ""),
          }),
        });
        const result = await readApiResult(response);
        setFeedback(getAdminSavedMessage(result?.saved ?? "lead_match"));
        reload();
      } catch (requestError) {
        setSubmitError(
          requestError instanceof Error ? requestError.message : "保存失败，请稍后再试。",
        );
      }
    });
  }

  function handleUpdateMatch(matchId: string, memberId: string, formData: FormData) {
    startTransition(async () => {
      setFeedback(null);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/admin/leads/${leadId}/matches/${matchId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            member_id: memberId,
            status: String(formData.get("status") ?? ""),
            note: String(formData.get("note") ?? ""),
          }),
        });
        const result = await readApiResult(response);
        setFeedback(getAdminSavedMessage(result?.saved ?? "lead_match"));
        reload();
      } catch (requestError) {
        setSubmitError(
          requestError instanceof Error ? requestError.message : "保存失败，请稍后再试。",
        );
      }
    });
  }

  function handleDeleteMatch(matchId: string) {
    if (!window.confirm("确认删除这条成员匹配记录吗？")) {
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/admin/leads/${leadId}/matches/${matchId}`, {
          method: "DELETE",
        });
        const result = await readApiResult(response);
        setFeedback(getAdminSavedMessage(result?.saved ?? "lead_match_deleted"));
        reload();
      } catch (requestError) {
        setSubmitError(
          requestError instanceof Error ? requestError.message : "删除失败，请稍后再试。",
        );
      }
    });
  }

  return (
    <div className="admin-page-stack">
      {lead ? (
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
      ) : null}

      {querySaved ? <div className="note-strip">{getAdminSavedMessage(querySaved)}</div> : null}
      {queryError ? <div className="note-strip">{getAdminErrorMessage(queryError)}</div> : null}
      {feedback ? <div className="note-strip">{feedback}</div> : null}
      {submitError ? <div className="note-strip">{submitError}</div> : null}
      {error ? <div className="note-strip">后台数据读取出现问题：{error}</div> : null}
      {data && data.queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{data.queryErrors.join(" | ")}</div>
      ) : null}

      {isLoading ? <div className="note-strip">正在加载线索详情...</div> : null}

      {lead ? (
        <>
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

            <form
              className="admin-inline-form"
              onSubmit={(formEvent) => {
                formEvent.preventDefault();
                handleLeadSubmit(new FormData(formEvent.currentTarget));
              }}
            >
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
                <button type="submit" className="button" disabled={isPending}>
                  {isPending ? "保存中..." : "保存线索详情"}
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
                          <ToneBadge key={`${match.id}-${skill}`} label={skill} />
                        ))}
                      </div>
                    ) : null}

                    <form
                      className="admin-inline-form"
                      onSubmit={(formEvent) => {
                        formEvent.preventDefault();
                        handleUpdateMatch(
                          match.id,
                          match.memberId,
                          new FormData(formEvent.currentTarget),
                        );
                      }}
                    >
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
                        <button type="submit" className="button button-secondary" disabled={isPending}>
                          {isPending ? "保存中..." : "保存匹配"}
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => handleDeleteMatch(match.id)}
                          disabled={isPending}
                        >
                          删除匹配
                        </button>
                      </div>
                    </form>
                  </article>
                ))}
              </div>
            ) : (
              <div className="note-strip">这条线索暂未匹配候选成员，可先补充最合适的成员人选。</div>
            )}

            <article className="admin-lead-match-create">
              <div className="section-heading">
                <p className="eyebrow">New Match</p>
                <h3>新增候选成员</h3>
                <p>补充适合参与该需求的成员，便于联系、引荐和协作安排。</p>
              </div>

              <form
                className="admin-inline-form"
                onSubmit={(formEvent) => {
                  formEvent.preventDefault();
                  handleCreateMatch(new FormData(formEvent.currentTarget));
                }}
              >
                <div className="form-grid admin-join-request-settings-grid">
                  <label className="form-field">
                    <span>候选成员</span>
                    <select className="input" name="member_id" defaultValue="">
                      <option value="">请选择成员</option>
                      {memberOptions.map((memberOption) => (
                        <option key={memberOption.id} value={memberOption.id}>
                          {memberOption.displayName}
                          {memberOption.city ? ` · ${memberOption.city}` : ""}
                          {memberOption.skills.length > 0
                            ? ` · ${memberOption.skills.slice(0, 2).join(" / ")}`
                            : ""}
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
                  <button type="submit" className="button" disabled={isPending}>
                    {isPending ? "保存中..." : "添加候选成员"}
                  </button>
                </div>
              </form>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
