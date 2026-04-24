import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  MessageCircle,
  Sparkles,
  UsersRound,
  Wrench,
} from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { MemberAvatar } from "@/components/member-avatar";
import { MemberDirectoryCard } from "@/components/member-directory-card";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import { memberTags } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "成员地图",
  description: "展示常州 AI Club 的成员技能分布和参与方向。",
};

function formatMemberHeadline(member: {
  roleLabel: string | null;
  organization: string | null;
  city: string;
}) {
  const items = [member.roleLabel, member.organization, member.city].filter(Boolean);

  return items.join(" · ");
}

const memberFlowSteps = [
  {
    title: "先找到方向",
    summary: "通过角色、技能和参与信号，快速判断谁可能和你的问题相关。",
    tone: "green",
  },
  {
    title: "再线下见面",
    summary: "活动现场让名字变得具体，也让合作前的信任更容易发生。",
    tone: "orange",
  },
  {
    title: "最后一起做事",
    summary: "从一次交流延伸到分享、项目试点、资源对接或长期共建。",
    tone: "blue",
  },
] as const;

export default async function MembersPage() {
  const directory = await getPublicMembersDirectory();
  const skillTags =
    directory.skillTags.length > 0 ? directory.skillTags : memberTags;
  const heroMembers = directory.members.slice(0, 6);
  const mapMembers = directory.members.slice(0, 7);
  const featuredGroups = directory.featuredGroups;
  const memberStats = [
    {
      value: directory.stats.publicMembers,
      label: "公开成员",
      detail: "已授权展示的社区伙伴",
      icon: UsersRound,
    },
    {
      value: directory.stats.willingToShare,
      label: "愿意分享",
      detail: "可邀约主题交流",
      icon: MessageCircle,
    },
    {
      value: directory.stats.willingToJoinProjects,
      label: "愿意共建",
      detail: "适合项目协作与试点",
      icon: Wrench,
    },
    {
      value: directory.stats.cities || 1,
      label: "城市线索",
      detail: "立足常州，连接更多伙伴",
      icon: MapPin,
    },
  ];

  return (
    <div className="members-page-stack">
      <section className="members-hero" aria-labelledby="members-hero-title">
        <div className="members-hero-copy">
          <p className="home-kicker">Members · 成员地图</p>
          <h1 id="members-hero-title">
            找到同路的人，
            <span>让想法有回应</span>
          </h1>
          <p>
            成员地图展示社区里公开的角色、技能和参与意愿。你可以从这里找到分享者、
            共建伙伴，也更快理解常州 AI Club 正在聚集怎样的人。
          </p>

          <div className="members-hero-actions">
            <Link href="/join" className="button home-primary-button">
              加入社区
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="#member-directory" className="button home-ghost-button">
              浏览名录
            </Link>
          </div>

          <div className="members-hero-proof" aria-label="社区成员概览">
            <div className="home-avatar-stack" aria-hidden="true">
              {heroMembers.length > 0 ? (
                heroMembers.map((member, index) =>
                  member.avatarUrl ? (
                    <img
                      key={member.id}
                      src={member.avatarUrl}
                      alt=""
                      style={{ zIndex: heroMembers.length - index }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span key={member.id} style={{ zIndex: heroMembers.length - index }}>
                      {member.displayName.slice(0, 2)}
                    </span>
                  ),
                )
              ) : (
                ["AI", "PM", "DEV", "OP"].map((label, index) => (
                  <span key={label} style={{ zIndex: 4 - index }}>
                    {label}
                  </span>
                ))
              )}
            </div>
            <div>
              <strong>{directory.stats.registeredMembers || "200+"}</strong>
              <span>位成员正在社区里相遇、分享和共建</span>
            </div>
          </div>
        </div>

        <div className="members-map-panel" aria-label="成员连接地图">
          <div className="members-map-orbit">
            <span>活动</span>
            <span>分享</span>
            <span>项目</span>
          </div>
          <div className="members-map-core">
            <Sparkles aria-hidden="true" strokeWidth={1.9} />
            <strong>常州 AI Club</strong>
            <span>本地连接网络</span>
          </div>

          <div className="members-map-nodes">
            {mapMembers.length > 0
              ? mapMembers.map((member, index) => (
                  <Link
                    href={getMemberPublicSlugPath(member)}
                    className={`members-map-node members-map-node-${index + 1}`}
                    key={member.id}
                  >
                    <MemberAvatar
                      name={member.displayName}
                      avatarUrl={member.avatarUrl}
                      size="sm"
                    />
                    <span>{member.displayName}</span>
                  </Link>
                ))
              : ["开发者", "产品人", "创业者", "设计师", "运营"].map((label, index) => (
                  <div
                    className={`members-map-node members-map-node-${index + 1}`}
                    key={label}
                  >
                    <MemberAvatar name={label} size="sm" />
                    <span>{label}</span>
                  </div>
                ))}
          </div>

          <div className="members-sticky-note">
            <span>成员地图</span>
            <strong>先看方向，再约一场真实交流</strong>
          </div>
          <DoodleSparkles className="members-hero-doodle" />
          <HandDrawnArrow className="members-hero-arrow" />
        </div>
      </section>

      <section className="members-stats-panel" aria-label="成员数据">
        {memberStats.map((item, index) => {
          const Icon = item.icon;

          return (
            <article className={`members-stat-card members-stat-card-${index + 1}`} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.9} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </article>
          );
        })}
      </section>

      <section className="members-flow-strip" aria-label="成员连接路径">
        {memberFlowSteps.map((item, index) => (
          <article className={`members-flow-card members-flow-card-${item.tone}`} key={item.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
          </article>
        ))}
      </section>

      {featuredGroups.length > 0 ? (
        <section className="members-featured-section">
          <div className="members-section-heading">
            <p className="home-kicker">Signals</p>
            <div>
              <h2>从这些入口开始认识成员</h2>
              <p>按社区角色与参与意愿整理，方便活动邀约、项目共建和新成员破冰。</p>
            </div>
          </div>

          <div className="members-featured-grid">
            {featuredGroups.map((group, index) => (
              <article className={`members-featured-card members-featured-card-${index + 1}`} key={group.id}>
                <div className="members-featured-head">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{group.title}</h3>
                    <p>{group.description}</p>
                  </div>
                </div>

                <div className="members-featured-list">
                  {group.members.map((member) => (
                    <Link
                      href={getMemberPublicSlugPath(member)}
                      className="members-featured-person"
                      key={`${group.id}-${member.id}`}
                    >
                      <MemberAvatar
                        name={member.displayName}
                        avatarUrl={member.avatarUrl}
                        size="sm"
                      />
                      <span>
                        <strong>{member.displayName}</strong>
                        <small>{formatMemberHeadline(member) || member.city}</small>
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {directory.members.length > 0 ? (
        <section className="members-directory-section" id="member-directory">
          <div className="members-section-heading">
            <p className="home-kicker">Directory</p>
            <div>
              <h2>公开成员名录</h2>
              <p>
                页面展示经成员授权公开的信息，包括方向、技能与参与信号，不直接公开联系方式。
              </p>
            </div>
          </div>

          <div className="members-directory-feature">
            <div>
              <h3>每一张成员卡，都是一个可继续对话的线索</h3>
              <p>
                点开成员主页可以查看更完整的介绍。你也可以先从技能标签、分享意愿和共建意愿判断是否适合进一步交流。
              </p>
            </div>
            <Link href="/cooperate" className="members-directory-feature-link">
              发起合作联系
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </div>

          <div className="member-directory-grid members-directory-grid">
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
        <div className="members-empty-panel">
          <strong>暂无公开成员信息</strong>
          <p>成员授权公开后，会在这里展示方向、技能与参与信号。</p>
        </div>
      )}

      <section className="members-skill-section">
        <div className="members-section-heading">
          <p className="home-kicker">Skills</p>
          <div>
            <h2>社区技能云</h2>
            <p>
              这些标签来自公开成员信息和社区常见方向，用来帮助你快速理解成员能力分布。
            </p>
          </div>
        </div>

        <div className="members-skill-cloud">
          {skillTags.map((tag) => (
            <ToneBadge key={tag} label={tag} />
          ))}
        </div>
      </section>
    </div>
  );
}
