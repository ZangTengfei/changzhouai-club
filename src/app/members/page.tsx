import type { Metadata } from "next";

import { MemberAvatar } from "@/components/member-avatar";
import { PageHero } from "@/components/page-hero";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { memberTags } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "成员地图",
  description: "展示常州 AI 社区的成员技能分布和参与方向。",
};

function formatMemberStatus(status: string) {
  switch (status) {
    case "admin":
      return "管理员";
    case "organizer":
      return "组织者";
    case "active":
      return "活跃成员";
    case "pending":
      return "待完善";
    case "paused":
      return "暂停中";
    default:
      return status;
  }
}

function buildMemberPositioning(member: {
  status: string;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  skills: string[];
}) {
  const tags = [formatMemberStatus(member.status)];

  if (member.willingToShare) {
    tags.push("可邀约分享");
  }

  if (member.willingToJoinProjects) {
    tags.push("可匹配共建");
  }

  member.skills.slice(0, 2).forEach((skill) => {
    tags.push(skill);
  });

  return tags.slice(0, 4);
}

function formatMemberHeadline(member: {
  roleLabel: string | null;
  organization: string | null;
  city: string;
}) {
  const items = [member.roleLabel, member.organization, member.city].filter(Boolean);

  return items.join(" · ");
}

export default async function MembersPage() {
  const directory = await getPublicMembersDirectory();
  const skillTags =
    directory.skillTags.length > 0 ? directory.skillTags : memberTags;

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Members"
        title="成员地图"
        description="展示社区成员的角色分布、能力方向与参与意愿，帮助更多人建立连接与合作。"
      >
        <div className="stat-grid">
          <article className="metric-card">
            <strong>{directory.stats.publicMembers}</strong>
            <span>公开成员</span>
          </article>
          <article className="metric-card">
            <strong>{directory.stats.organizers}</strong>
            <span>组织者 / 管理员</span>
          </article>
          <article className="metric-card">
            <strong>{directory.stats.willingToJoinProjects}</strong>
            <span>愿意共建</span>
          </article>
        </div>
      </PageHero>

      <section className="card-grid">
        <article className="card">
          <h3>认识社区成员</h3>
          <p>
            快速了解社区中已经聚集的角色、方向与参与方式，建立更明确的成员画像。
          </p>
        </article>
        <article className="card">
          <h3>发现分享者</h3>
          <p>
            愿意分享的成员会优先展示，方便活动策划与主题邀约。
          </p>
        </article>
        <article className="card">
          <h3>促进合作连接</h3>
          <p>
            通过成员方向与参与信号，帮助社区内外更高效地建立协作关系。
          </p>
        </article>
      </section>

      {directory.featuredGroups.length > 0 ? (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">精选分组</p>
            <h2>精选成员分组</h2>
            <p>
              通过不同分组快速认识社区中的组织者、分享者与合作参与者。
            </p>
          </div>

          <div className="member-spotlight-grid">
            {directory.featuredGroups.map((group) => (
              <article className="member-spotlight-card" key={group.id}>
                <div className="section-heading">
                  <p className="eyebrow">{group.title}</p>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>

                <div className="member-spotlight-list">
                  {group.members.map((member) => (
                    <article className="member-spotlight-item" key={`${group.id}-${member.id}`}>
                      <div className="member-directory-header">
                        <MemberAvatar
                          name={member.displayName}
                          avatarUrl={member.avatarUrl}
                        />

                        <div className="member-directory-copy">
                          <h3>{member.displayName}</h3>
                          <p>{formatMemberHeadline(member)}</p>
                        </div>
                      </div>

                      <div className="member-directory-signals">
                        {buildMemberPositioning(member).map((tag) => (
                          <span className="pill member-signal-pill" key={`${member.id}-${tag}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {directory.members.length > 0 ? (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">公开成员</p>
            <h2>社区成员名录</h2>
            <p>
              页面展示经成员授权公开的信息，包括方向、技能与参与信号，不直接公开联系方式。
            </p>
          </div>

          <p className="section-note">
            已注册成员 <strong>{directory.members.length}</strong> 人
          </p>

          <div className="member-directory-grid">
            {directory.members.map((member) => (
              <article className="member-directory-card" key={member.id}>
                <div className="member-directory-header">
                  <MemberAvatar
                    name={member.displayName}
                    avatarUrl={member.avatarUrl}
                  />

                  <div className="member-directory-copy">
                    <h3>{member.displayName}</h3>
                    <p>{formatMemberHeadline(member)}</p>
                  </div>
                </div>

                <p className="member-directory-bio">
                  {member.bio ?? "这位成员已经加入社区，正在等待补充更完整的个人介绍。"}
                </p>

                <div className="member-directory-signals">
                  <span className="pill member-signal-pill">
                    {formatMemberStatus(member.status)}
                  </span>
                  {member.willingToShare ? (
                    <span className="pill member-signal-pill">愿意分享</span>
                  ) : null}
                  {member.willingToJoinProjects ? (
                    <span className="pill member-signal-pill member-signal-pill-warm">
                      愿意参与共建
                    </span>
                  ) : null}
                </div>

                {member.skills.length > 0 ? (
                  <div className="member-skill-list">
                    {member.skills.map((skill) => (
                      <ToneBadge key={`${member.id}-${skill}`} label={skill} />
                    ))}
                  </div>
                ) : (
                  <div className="note-strip">这位成员暂未补充技能标签。</div>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className="note-strip">
          暂无公开成员信息，欢迎稍后再来查看社区成员名录。
        </div>
      )}

      <section className="tag-cloud">
        {skillTags.map((tag) => (
          <ToneBadge key={tag} label={tag} />
        ))}
      </section>
    </div>
  );
}
