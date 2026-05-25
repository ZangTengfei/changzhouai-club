import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MemberDirectoryCard } from "@/components/member-directory-card";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { memberTags } from "@/lib/site-data";

import styles from "./members-page.module.css";

export const metadata: Metadata = {
  title: "成员地图",
  description: "展示常州 AI Club 的成员技能分布和参与方向。",
};

type SearchParams = {
  page?: string | string[];
};

type MembersPageProps = {
  searchParams: Promise<SearchParams>;
};

const MEMBERS_PER_PAGE = 12;

function parsePageParam(value: SearchParams["page"]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue ?? "1", 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
}

function getMemberPageHref(page: number) {
  if (page <= 1) {
    return "/members#member-directory";
  }

  return `/members?page=${page}#member-directory`;
}

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
    title: "看方向",
    summary: "从角色、组织、城市和技能标签，先判断对方的实践领域。",
  },
  {
    title: "看信号",
    summary: "核心成员、共建成员、愿意分享等标签，可以帮助你找到合适入口。",
  },
  {
    title: "继续连接",
    summary: "点开成员主页了解更多，也可以通过活动或合作联系发起具体沟通。",
  },
] as const;

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const [directory, params] = await Promise.all([
    getPublicMembersDirectory(),
    searchParams,
  ]);
  const skillTags =
    directory.skillTags.length > 0 ? directory.skillTags : memberTags;
  const totalPages = Math.max(1, Math.ceil(directory.members.length / MEMBERS_PER_PAGE));
  const currentPage = Math.min(parsePageParam(params.page), totalPages);
  const memberStartIndex = (currentPage - 1) * MEMBERS_PER_PAGE;
  const paginatedMembers = directory.members.slice(
    memberStartIndex,
    memberStartIndex + MEMBERS_PER_PAGE,
  );
  const memberEndIndex = memberStartIndex + paginatedMembers.length;
  const memberHighlights = [
    {
      value: directory.stats.publicMembers,
      label: "公开成员",
    },
    {
      value: directory.stats.coBuilders,
      label: "共建成员",
    },
    {
      value: directory.stats.willingToShare,
      label: "愿意分享",
    },
  ];

  return (
    <div className={styles.membersPageStack}>
      <section className={styles.membersHero} aria-labelledby="members-hero-title">
        <div className={styles.membersHeroCopy}>
          <p className="home-kicker">Members · 成员地图</p>
          <h1 id="members-hero-title">找到常州 AI Club 里正在做 AI 的人</h1>
          <p>
            这里展示成员授权公开的介绍、技能和参与信号。先从卡片认识人，
            再通过线下活动、成员主页或合作联系继续对接。
          </p>

          <div className={styles.membersHeroActions}>
            <Link href="#member-directory" className="button home-primary-button">
              浏览成员
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/join" className="button home-ghost-button">
              加入社区
            </Link>
          </div>
        </div>

        <div className={styles.membersHeroSummary} aria-label="成员概览">
          {memberHighlights.map((item) => (
            <div className={styles.membersHeroSummaryItem} key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {directory.members.length > 0 ? (
        <section className={styles.membersDirectorySection} id="member-directory">
          <div className={styles.membersSectionHeading}>
            <p className="home-kicker">Directory</p>
            <div>
              <h2>公开成员</h2>
              <p>
                每张卡片都来自成员授权公开的信息，用来快速了解方向、技能和参与意愿。
              </p>
            </div>
          </div>

          <div className={styles.membersDirectoryMeta}>
            <span>
              第 {currentPage} / {totalPages} 页
            </span>
            <span>
              正在显示 {memberStartIndex + 1}-{memberEndIndex} 位，共 {directory.members.length} 位公开成员
            </span>
          </div>

          <div className={`member-directory-grid ${styles.membersDirectoryGrid}`}>
            {paginatedMembers.map((member) => (
              <MemberDirectoryCard
                key={member.id}
                member={member}
                headline={formatMemberHeadline(member)}
                bioFallback="这位成员已经加入社区，正在等待补充更完整的个人介绍。"
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav className={styles.membersPagination} aria-label="公开成员分页">
              {currentPage > 1 ? (
                <Link href={getMemberPageHref(currentPage - 1)}>上一页</Link>
              ) : (
                <span aria-disabled="true">上一页</span>
              )}

              <div className={styles.membersPaginationPages}>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;

                  return page === currentPage ? (
                    <span aria-current="page" key={page}>
                      {page}
                    </span>
                  ) : (
                    <Link href={getMemberPageHref(page)} key={page}>
                      {page}
                    </Link>
                  );
                })}
              </div>

              {currentPage < totalPages ? (
                <Link href={getMemberPageHref(currentPage + 1)}>下一页</Link>
              ) : (
                <span aria-disabled="true">下一页</span>
              )}
            </nav>
          ) : null}
        </section>
      ) : (
        <div className={styles.membersEmptyPanel}>
          <strong>暂无公开成员信息</strong>
          <p>成员授权公开后，会在这里展示方向、技能与参与信号。</p>
        </div>
      )}

      <section className={styles.membersGuideSection} aria-label="成员地图说明">
        <div className={styles.membersSectionHeading}>
          <p className="home-kicker">Guide</p>
          <div>
            <h2>成员地图说明</h2>
            <p>成员地图用于帮助你判断“可以和谁聊”，真正的连接仍然发生在具体交流里。</p>
          </div>
        </div>

        <div className={styles.membersGuideGrid}>
          {memberFlowSteps.map((item, index) => (
            <article className={styles.membersGuideCard} key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.membersSkillSection}>
        <div className={styles.membersSectionHeading}>
          <p className="home-kicker">Skills</p>
          <div>
            <h2>技能标签</h2>
            <p>
              这些标签来自公开成员信息和社区常见方向，可辅助理解成员能力分布。
            </p>
          </div>
        </div>

        <div className={styles.membersSkillCloud}>
          {skillTags.map((tag) => (
            <ToneBadge key={tag} label={tag} />
          ))}
        </div>
      </section>
    </div>
  );
}
