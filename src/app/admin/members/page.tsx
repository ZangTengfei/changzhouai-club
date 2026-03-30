import type { Metadata } from "next";

import { MemberAvatar } from "@/components/member-avatar";
import {
  formatAdminMemberStatus,
  getAdminMemberStatusTone,
} from "@/lib/admin/event-feedback";
import { loadAdminMembersData } from "@/lib/admin/members";

export const metadata: Metadata = {
  title: "成员管理",
  description: "查看和管理社区成员。",
};

function formatDate(value: string | null) {
  if (!value) {
    return "暂无记录";
  }

  return new Date(value).toLocaleString("zh-CN");
}

export default async function AdminMembersPage() {
  const { members, stats, queryErrors } = await loadAdminMembersData();

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Members</p>
            <h2>成员管理</h2>
            <p>这里现在先承接成员资料、技能标签、分享意愿和活动参与情况的查看，后面再继续补状态编辑和筛选。</p>
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

      {queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{queryErrors.join(" | ")}</div>
      ) : null}

      {members.length > 0 ? (
        <section className="admin-member-card-list">
          {members.map((member) => (
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
            </article>
          ))}
        </section>
      ) : (
        <section className="surface admin-card">
          <div className="note-strip">当前还没有成员数据。</div>
        </section>
      )}
    </div>
  );
}
