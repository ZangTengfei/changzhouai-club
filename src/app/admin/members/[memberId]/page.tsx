import type { Metadata } from "next";
import Link from "next/link";

import { updateAdminMember, updateAdminMemberProfile } from "@/app/admin/actions";
import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import {
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminMemberOrThrow } from "@/lib/admin/members";

export const metadata: Metadata = {
  title: "成员详情",
  description: "查看成员资料并调整成员后台设置。",
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

function getBackHref(from?: string) {
  if (from?.startsWith("/admin/members")) {
    return from;
  }

  return "/admin/members";
}

function buildCurrentPath(memberId: string, from?: string) {
  const params = new URLSearchParams();

  if (from?.startsWith("/admin/members")) {
    params.set("from", from);
  }

  const query = params.toString();
  return query ? `/admin/members/${memberId}?${query}` : `/admin/members/${memberId}`;
}

export default async function AdminMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [routeParams, query] = await Promise.all([params, searchParams]);
  const { member, queryErrors } = await loadAdminMemberOrThrow(routeParams.memberId);
  const backHref = getBackHref(query.from);
  const currentPath = buildCurrentPath(routeParams.memberId, query.from);

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Member Detail</p>
            <h2>{member.displayName}</h2>
            <p>这里集中处理成员资料、参与概况和后台设置，列表页只保留浏览与筛选。</p>
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
        <div className="admin-member-card-header">
          <div className="admin-member-identity">
            <MemberAvatar name={member.displayName} avatarUrl={member.avatarUrl} size="sm" />

            <div className="admin-member-copy">
              <h3>{member.displayName}</h3>
              <p>{member.email ?? "未提供邮箱"}</p>
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
          </div>

          <div className="admin-note-panel">
            <span className="admin-card-label">参与意愿</span>
            <div className="pill-row">
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
          <p className="admin-member-bio">
            {member.bio ?? "这位成员还没有补充个人介绍。"}
          </p>
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

        <form action={updateAdminMemberProfile} className="admin-inline-form">
          <input type="hidden" name="member_id" value={member.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="section-heading">
            <p className="eyebrow">Profile</p>
            <h2>成员基础资料</h2>
            <p>维护展示名、城市、技能和参与意愿，沉淀清晰的成员档案。</p>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>显示名</span>
              <input
                className="input"
                name="display_name"
                defaultValue={member.displayName === "未填写显示名" ? "" : member.displayName}
                placeholder="比如：张腾飞 / Nobug"
              />
            </label>

            <label className="form-field">
              <span>城市</span>
              <input
                className="input"
                name="city"
                defaultValue={member.city}
                placeholder="常州"
              />
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
            <button type="submit" className="button">
              保存成员资料
            </button>
          </div>
        </form>

        <form action={updateAdminMember} className="admin-inline-form">
          <input type="hidden" name="member_id" value={member.id} />
          <input type="hidden" name="redirect_to" value={currentPath} />

          <div className="form-grid admin-member-settings-grid">
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
          </div>

          <div className="cta-row">
            <button type="submit" className="button button-secondary">
              保存成员设置
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
