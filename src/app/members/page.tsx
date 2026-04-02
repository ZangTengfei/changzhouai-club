import type { Metadata } from "next";

import { MemberDirectoryCard } from "@/components/member-directory-card";
import { PageHero } from "@/components/page-hero";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { memberTags } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "成员地图",
  description: "展示常州 AI 社区的成员技能分布和参与方向。",
};

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
            <strong>{directory.stats.cities}</strong>
            <span>覆盖城市</span>
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
            成员展示由管理员统一审核设置，公开后更方便活动策划与主题邀约。
          </p>
        </article>
        <article className="card">
          <h3>促进合作连接</h3>
          <p>
            通过成员方向与参与信号，帮助社区内外更高效地建立协作关系。
          </p>
        </article>
      </section>

      {directory.members.length > 0 ? (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">公开成员</p>
            <h2>社区成员名录</h2>
            <p>
              页面展示经成员授权公开的信息，包括方向、技能与参与信号，不直接公开联系方式。
            </p>
          </div>

          <div className="member-directory-grid">
            {directory.members.map((member) => (
              <MemberDirectoryCard
                key={member.id}
                member={member}
                headline={formatMemberHeadline(member)}
                bioFallback="这位成员已经加入社区，正在等待补充更完整的个人介绍。"
              />
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
