import type { Metadata } from "next";

import { MemberAvatar } from "@/components/member-avatar";
import { PageHero } from "@/components/page-hero";
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

export default async function MembersPage() {
  const directory = await getPublicMembersDirectory();
  const skillTags =
    directory.skillTags.length > 0 ? directory.skillTags : memberTags;

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Members"
        title="成员地图"
        description="第一版更关注成员能力分布和参与方向，而不是做公开通讯录，让每个人先被看见、再被匹配。"
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
          <h3>这页不只是成员展示</h3>
          <p>
            它也可以作为你日常运营的外部入口，让新朋友快速看到社区里已经有哪些角色、方向和参与意愿。
          </p>
        </article>
        <article className="card">
          <h3>适合拿来找分享嘉宾</h3>
          <p>
            愿意分享的成员会优先被看见，后面你做活动策划时，可以更快锁定潜在分享者和主题来源。
          </p>
        </article>
        <article className="card">
          <h3>也适合做合作匹配</h3>
          <p>
            当外部合作需求进来时，你可以先从这页识别哪些成员更适合参与讨论、试点或后续项目共建。
          </p>
        </article>
      </section>

      {directory.featuredGroups.length > 0 ? (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">精选分组</p>
            <h2>先按运营视角把成员分出来</h2>
            <p>
              第一版不做复杂筛选，也能先让“组织者”“可邀约分享者”“可匹配共建者”这些关键人群被看见。
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
                          <p>{member.city}</p>
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
            <h2>当前公开展示的社区成员</h2>
            <p>
              这里保留克制的信息密度，只展示适合公开的能力、方向和参与信号，不直接公开联系方式。
            </p>
          </div>

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
                    <p>{member.city}</p>
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
                      <span key={`${member.id}-${skill}`}>{skill}</span>
                    ))}
                  </div>
                ) : (
                  <div className="note-strip">这位成员还没有补充技能标签。</div>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className="note-strip">
          当前还没有设置为公开展示的成员。你后面可以在后台成员管理页里直接打开“公开展示到成员页”开关。
        </div>
      )}

      <section className="two-up">
        <article className="field-panel">
          <h3>公开策略</h3>
          <p>
            当前成员页只展示后台明确设置为“公开展示”的成员，不公开邮箱和联系方式，先把技能、城市和方向沉淀下来。
          </p>
        </article>
        <article className="field-panel">
          <h3>这页当前能帮助什么</h3>
          <p>
            你现在已经可以把它当作社区公开名片、分享嘉宾池和合作匹配前置页面来使用。目前公开成员覆盖 {directory.stats.cities} 个城市分布。
          </p>
        </article>
      </section>

      <section className="tag-cloud">
        {skillTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </section>
    </div>
  );
}
