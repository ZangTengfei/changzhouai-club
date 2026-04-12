"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminMember } from "@/lib/admin/members";

type AdminMemberDetailData = {
  member: AdminMember;
  queryErrors: string[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function getBackHref(from?: string | null) {
  if (from?.startsWith("/admin/members")) {
    return from;
  }

  return "/admin/members";
}

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; saved?: string }
    | null;

  if (!response.ok) {
    throw new Error(getAdminErrorMessage(payload?.error) ?? "提交失败，请检查表单内容后重试。");
  }

  return payload;
}

export function AdminMemberDetailPageClient({ memberId }: { memberId: string }) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminMemberDetailData>(
    `/api/admin/members/${memberId}`,
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const member = data?.member;
  const querySaved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const backHref = getBackHref(searchParams.get("from"));

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setFeedback(null);
      setSubmitError(null);

      try {
        const response = await fetch(`/api/admin/members/${memberId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            display_name: String(formData.get("display_name") ?? ""),
            wechat: String(formData.get("wechat") ?? ""),
            city: String(formData.get("city") ?? ""),
            role_label: String(formData.get("role_label") ?? ""),
            organization: String(formData.get("organization") ?? ""),
            monthly_time: String(formData.get("monthly_time") ?? ""),
            skills: String(formData.get("skills") ?? ""),
            interests: String(formData.get("interests") ?? ""),
            bio: String(formData.get("bio") ?? ""),
            status: String(formData.get("status") ?? "pending"),
            willing_to_attend: formData.get("willing_to_attend") === "on",
            willing_to_share: formData.get("willing_to_share") === "on",
            willing_to_join_projects: formData.get("willing_to_join_projects") === "on",
            is_publicly_visible: formData.get("is_publicly_visible") === "on",
          }),
        });
        const result = await readApiResult(response);
        setFeedback(getAdminSavedMessage(result?.saved ?? "member_profile"));
        reload();
      } catch (requestError) {
        setSubmitError(
          requestError instanceof Error ? requestError.message : "保存失败，请稍后再试。",
        );
      }
    });
  }

  return (
    <div className="admin-page-stack">
      {member ? (
        <section className="surface admin-card">
          <div className="admin-toolbar">
            <div className="section-heading">
              <p className="eyebrow">Member Detail</p>
              <h2>{member.displayName}</h2>
              <p>这里集中处理成员资料、参与概况和完整后台设置，列表页则承担快捷运营操作。</p>
            </div>

            <div className="admin-toolbar-side">
              <div className="admin-mini-stat">
                <strong>{member.registrationCount}</strong>
                <span>活动报名</span>
              </div>

              <Link href={backHref} className="button button-secondary">
                返回成员列表
              </Link>
            </div>
          </div>

          <div className="pill-row">
            <span
              className={`pill admin-status-pill admin-status-pill-${getAdminMemberStatusTone(
                member.status,
              )}`}
            >
              {formatAdminMemberStatus(member.status)}
            </span>
            <span className="pill">{member.city}</span>
            <span className="pill">{member.isPubliclyVisible ? "公开展示中" : "未公开展示"}</span>
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

      {isLoading ? <div className="note-strip">正在加载成员详情...</div> : null}

      {member ? (
        <section className="surface admin-card admin-member-card">
          <div className="admin-member-card-header">
            <div className="admin-member-identity">
              <MemberAvatar name={member.displayName} avatarUrl={member.avatarUrl} size="sm" />

              <div className="admin-member-copy">
                <h3>{member.displayName}</h3>
                <p>{member.email ?? "未提供邮箱"}</p>
                <p>{member.wechat ?? "未填写微信号"}</p>
                <p>{member.roleLabel ?? "未填写身份"}</p>
                <p>{member.organization ?? "未填写公司 / 学校 / 团队"}</p>
                <p>{member.city}</p>
              </div>
            </div>

            <span
              className={`pill admin-status-pill admin-status-pill-${getAdminMemberStatusTone(
                member.status,
              )}`}
            >
              {formatAdminMemberStatus(member.status)}
            </span>
          </div>

          <div className="admin-member-card-meta">
            <div className="admin-note-panel">
              <span className="admin-card-label">参与概况</span>
              <p className="admin-member-bio">加入时间：{formatDate(member.joinedAt)}</p>
              <p className="admin-member-bio">最近活跃：{formatDate(member.lastActiveAt)}</p>
              <p className="admin-member-bio">活动报名：{member.registrationCount} 次</p>
              <p className="admin-member-bio">
                每月可投入时间：{member.monthlyTime ?? "未填写"}
              </p>
            </div>

            <div className="admin-note-panel">
              <span className="admin-card-label">参与意愿</span>
              <div className="pill-row">
                <span className="pill member-signal-pill">
                  {member.willingToAttend ? "愿意参加线下活动" : "暂不参加线下活动"}
                </span>
                <span className="pill member-signal-pill">
                  {member.willingToShare ? "愿意分享" : "暂不分享"}
                </span>
                <span className="pill member-signal-pill member-signal-pill-warm">
                  {member.willingToJoinProjects ? "愿意共建" : "暂不共建"}
                </span>
                <span className="pill member-signal-pill">
                  {member.isPubliclyVisible ? "公开展示中" : "未公开展示"}
                </span>
              </div>
            </div>
          </div>

          <div className="admin-note-panel">
            <span className="admin-card-label">个人介绍</span>
            <p className="admin-member-bio">{member.bio ?? "这位成员还没有补充个人介绍。"}</p>
          </div>

          {member.skills.length > 0 ? (
            <div className="member-skill-list">
              {member.skills.map((skill) => (
                <ToneBadge key={`${member.id}-${skill}`} label={skill} />
              ))}
            </div>
          ) : (
            <div className="note-strip">这位成员尚未补充技能标签。</div>
          )}

          {member.interests.length > 0 ? (
            <div className="admin-note-panel">
              <span className="admin-card-label">感兴趣的主题</span>
              <div className="member-skill-list">
                {member.interests.map((interest) => (
                  <ToneBadge key={`${member.id}-${interest}`} label={interest} />
                ))}
              </div>
            </div>
          ) : null}

          <form
            className="admin-inline-form"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              handleSubmit(new FormData(formEvent.currentTarget));
            }}
          >
            <div className="section-heading">
              <p className="eyebrow">Profile</p>
              <h2>成员基础资料</h2>
              <p>维护展示名、身份、组织、城市、技能和参与意愿，沉淀清晰的成员档案。</p>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>显示名</span>
                <input
                  className="input"
                  name="display_name"
                  defaultValue={member.displayName === "未填写显示名" ? "" : member.displayName}
                  placeholder="比如：张三"
                />
              </label>

              <label className="form-field">
                <span>微信号</span>
                <input
                  className="input"
                  name="wechat"
                  defaultValue={member.wechat ?? ""}
                  placeholder="用于联系"
                />
              </label>

              <label className="form-field">
                <span>城市</span>
                <input className="input" name="city" defaultValue={member.city} placeholder="常州" />
              </label>

              <label className="form-field">
                <span>身份 / 角色</span>
                <input
                  className="input"
                  name="role_label"
                  defaultValue={member.roleLabel ?? ""}
                  placeholder="例如：开发者 / 产品经理 / 创业者 / 学生"
                />
              </label>

              <label className="form-field">
                <span>公司 / 学校 / 团队</span>
                <input
                  className="input"
                  name="organization"
                  defaultValue={member.organization ?? ""}
                  placeholder="例如：SenseLeap.ai / 常州大学 / 独立开发"
                />
              </label>

              <label className="form-field">
                <span>每月可投入时间</span>
                <input
                  className="input"
                  name="monthly_time"
                  defaultValue={member.monthlyTime ?? ""}
                  placeholder="例如：每周 2 小时 / 每月参加 1 次活动"
                />
              </label>

              <label className="form-field">
                <span>成员状态</span>
                <select className="input" name="status" defaultValue={member.status}>
                  <option value="pending">pending</option>
                  <option value="active">active</option>
                  <option value="organizer">organizer</option>
                  <option value="admin">admin</option>
                  <option value="paused">paused</option>
                </select>
              </label>

              <label className="checkbox-row admin-member-visibility-toggle">
                <input
                  type="checkbox"
                  name="is_publicly_visible"
                  defaultChecked={member.isPubliclyVisible}
                />
                <span>公开展示到成员页</span>
              </label>

              <label className="form-field form-field-wide">
                <span>技能标签</span>
                <input
                  className="input"
                  name="skills"
                  defaultValue={member.skills.join("，")}
                  placeholder="例如：Agent，RAG，前端工程，自动化工作流"
                />
              </label>

              <label className="form-field form-field-wide">
                <span>感兴趣的主题</span>
                <input
                  className="input"
                  name="interests"
                  defaultValue={member.interests.join("，")}
                  placeholder="例如：LLM 应用，自动化工作流，项目交付"
                />
              </label>

              <label className="form-field form-field-wide">
                <span>个人简介</span>
                <textarea
                  className="input textarea"
                  name="bio"
                  defaultValue={member.bio ?? ""}
                  rows={5}
                  placeholder="简单介绍一下这位成员的方向、经验，或者你们在线下交流中形成的了解。"
                />
              </label>
            </div>

            <div className="checkbox-list">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="willing_to_attend"
                  defaultChecked={member.willingToAttend}
                />
                <span>愿意参加线下活动</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="willing_to_share"
                  defaultChecked={member.willingToShare}
                />
                <span>愿意在社区活动里做主题分享</span>
              </label>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="willing_to_join_projects"
                  defaultChecked={member.willingToJoinProjects}
                />
                <span>如有合适项目，愿意参与协作</span>
              </label>
            </div>

            <div className="cta-row">
              <button type="submit" className="button" disabled={isPending}>
                {isPending ? "保存中..." : "保存成员资料"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
