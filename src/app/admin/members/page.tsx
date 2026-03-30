import type { Metadata } from "next";
import Link from "next/link";

import { updateAdminMember } from "@/app/admin/actions";
import { MemberAvatar } from "@/components/member-avatar";
import {
  formatAdminMemberStatus,
  getAdminErrorMessage,
  getAdminMemberStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminMembersData } from "@/lib/admin/members";

export const metadata: Metadata = {
  title: "成员管理",
  description: "查看和管理社区成员。",
};

type SearchParams = {
  status?: string;
  visibility?: string;
  intent?: string;
  saved?: string;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function buildMembersFilterHref(
  status: string,
  visibility: string,
  intent: string,
) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (visibility !== "all") {
    params.set("visibility", visibility);
  }

  if (intent !== "all") {
    params.set("intent", intent);
  }

  const query = params.toString();
  return query ? `/admin/members?${query}` : "/admin/members";
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { members, stats, queryErrors } = await loadAdminMembersData();

  const statusFilter = params.status ?? "all";
  const visibilityFilter = params.visibility ?? "all";
  const intentFilter = params.intent ?? "all";

  const filteredMembers = members.filter((member) => {
    if (statusFilter !== "all" && member.status !== statusFilter) {
      return false;
    }

    if (visibilityFilter === "public" && !member.isPubliclyVisible) {
      return false;
    }

    if (visibilityFilter === "private" && member.isPubliclyVisible) {
      return false;
    }

    if (intentFilter === "share" && !member.willingToShare) {
      return false;
    }

    if (intentFilter === "build" && !member.willingToJoinProjects) {
      return false;
    }

    return true;
  });

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Members</p>
            <h2>成员管理</h2>
            <p>
              这里现在已经能查看成员资料，并直接调整成员状态和公开展示开关。后面可以继续补搜索、批量操作和标签管理。
            </p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>{stats.totalMembers}</strong>
              <span>成员总数</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{stats.willingToShare}</strong>
              <span>愿意分享</span>
            </div>
            <div className="admin-mini-stat">
              <strong>{stats.willingToJoinProjects}</strong>
              <span>愿意共建</span>
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
          <h2>成员筛选</h2>
          <p>先按成员状态、公开展示和参与意愿筛选，方便你快速找到可运营的人群。</p>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">状态</span>
          <div className="admin-filter-row">
            {[
              ["all", "全部"],
              ["pending", "待完善"],
              ["active", "活跃成员"],
              ["organizer", "组织者"],
              ["admin", "管理员"],
              ["paused", "暂停中"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildMembersFilterHref(value, visibilityFilter, intentFilter)}
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

        <div className="admin-filter-group">
          <span className="admin-filter-label">公开展示</span>
          <div className="admin-filter-row">
            {[
              ["all", "全部"],
              ["public", "公开展示中"],
              ["private", "未公开"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildMembersFilterHref(statusFilter, value, intentFilter)}
                className={
                  visibilityFilter === value
                    ? "admin-filter-chip admin-filter-chip-active"
                    : "admin-filter-chip"
                }
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-filter-group">
          <span className="admin-filter-label">参与意愿</span>
          <div className="admin-filter-row">
            {[
              ["all", "全部"],
              ["share", "愿意分享"],
              ["build", "愿意共建"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildMembersFilterHref(statusFilter, visibilityFilter, value)}
                className={
                  intentFilter === value
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

      {filteredMembers.length > 0 ? (
        <section className="admin-member-card-list">
          {filteredMembers.map((member) => (
            <article className="surface admin-card admin-member-card" key={member.id}>
              <div className="admin-member-card-header">
                <div className="admin-member-identity">
                  <MemberAvatar
                    name={member.displayName}
                    avatarUrl={member.avatarUrl}
                    size="sm"
                  />

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
                <div className="admin-member-meta-block">
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

                <div className="admin-member-meta-block">
                  <span className="admin-card-label">参与概况</span>
                  <p>活动报名 {member.registrationCount} 次</p>
                  <p>加入时间 {formatDate(member.joinedAt)}</p>
                  <p>最近活跃 {formatDate(member.lastActiveAt)}</p>
                </div>
              </div>

              <p className="admin-member-bio">
                {member.bio ?? "这位成员还没有补充个人介绍。"}
              </p>

              {member.skills.length > 0 ? (
                <div className="member-skill-list">
                  {member.skills.map((skill) => (
                    <span key={`${member.id}-${skill}`}>{skill}</span>
                  ))}
                </div>
              ) : (
                <div className="note-strip">这位成员还没有补充技能标签。</div>
              )}

              <form action={updateAdminMember} className="admin-inline-form">
                <input type="hidden" name="member_id" value={member.id} />

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
            </article>
          ))}
        </section>
      ) : (
        <section className="surface admin-card">
          <div className="note-strip">当前筛选条件下还没有成员数据。</div>
        </section>
      )}
    </div>
  );
}
