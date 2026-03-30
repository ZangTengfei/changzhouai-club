import type { Metadata } from "next";

import { MemberAvatar } from "@/components/member-avatar";
import { PageHero } from "@/components/page-hero";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { memberTags } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "成员地图",
  description: "展示常州 AI 社区的成员技能分布和参与方向。",
};

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
            <strong>{directory.stats.willingToShare}</strong>
            <span>愿意分享</span>
          </article>
          <article className="metric-card">
            <strong>{directory.stats.willingToJoinProjects}</strong>
            <span>愿意共建</span>
          </article>
        </div>
      </PageHero>

      {directory.members.length > 0 ? (
        <section className="member-directory-grid">
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
                <span className="pill member-signal-pill">公开展示中</span>
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
          <h3>适合被展示的成员</h3>
          <p>
            已经愿意参与线下交流、愿意分享经验、愿意参与后续项目协作的朋友，会更适合出现在这一页。
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
