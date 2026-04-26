import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  ExternalLink,
  Layers3,
  Plus,
  Sparkles,
  Tags,
  UsersRound,
} from "lucide-react";

import { MemberWorkCard } from "@/components/member-work-card";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicWorksDirectory, workTypeLabels } from "@/lib/community-works";

import styles from "./works-page.module.css";

export const metadata: Metadata = {
  title: "作品墙",
  description: "查看常州 AI Club 成员公开展示的产品、工具、项目和案例。",
};

export default async function WorksPage() {
  const directory = await getPublicWorksDirectory();
  const featuredWorks =
    directory.featuredWorks.length > 0
      ? directory.featuredWorks
      : directory.works.slice(0, 6);
  const workStats = [
    {
      value: directory.stats.works,
      label: "公开作品",
      detail: "成员主动展示的产品与项目",
      icon: Boxes,
    },
    {
      value: directory.stats.makers,
      label: "创作者",
      detail: "来自社区成员的实践线索",
      icon: UsersRound,
    },
    {
      value: directory.stats.launchedWorks,
      label: "已上线",
      detail: "可访问、可试用或可了解",
      icon: ExternalLink,
    },
    {
      value: directory.stats.featuredWorks,
      label: "精选",
      detail: "适合优先浏览的作品",
      icon: Sparkles,
    },
  ];

  return (
    <div className={styles.worksPageStack}>
      <section className={styles.worksHero} aria-labelledby="works-hero-title">
        <div className={styles.worksHeroCopy}>
          <p className="home-kicker">Works · 作品墙</p>
          <h1 id="works-hero-title">
            看见成员正在做的
            <span>产品、工具和项目</span>
          </h1>
          <p>
            这里聚合社区成员公开展示的作品，不限于社区共建项目。它可以是一个产品、
            一个开源库、一段 Demo、一次案例，或者正在验证中的小工具。
          </p>

          <div className={styles.worksHeroActions}>
            <Link href="#works-directory" className="button home-primary-button">
              浏览作品
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/account?submit=work#works" className="button home-ghost-button">
              <Plus aria-hidden="true" strokeWidth={2} />
              提交个人作品
            </Link>
            <Link href="/members" className="button home-ghost-button">
              找到创作者
            </Link>
          </div>
        </div>

        <div className={styles.worksHeroBoard} aria-label="精选作品概览">
          <div className={styles.worksHeroBoardHeader}>
            <span>Community Works</span>
            <strong>{directory.stats.works || "成员作品"}</strong>
          </div>

          {featuredWorks.length > 0 ? (
            <div className={styles.worksHeroList}>
              {featuredWorks.slice(0, 4).map((work) => (
                <Link href={`#work-${work.id}`} key={work.id}>
                  <span>{work.typeLabel}</span>
                  <strong>{work.title}</strong>
                  <small>{work.member.displayName}</small>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.worksHeroEmpty}>
              <Layers3 aria-hidden="true" strokeWidth={1.8} />
              <strong>等待第一批成员作品</strong>
              <span>成员提交并通过审核后会汇总到这里</span>
            </div>
          )}
        </div>
      </section>

      <section className={styles.worksStatsPanel} aria-label="作品数据">
        {workStats.map((item) => {
          const Icon = item.icon;

          return (
            <article className={styles.worksStatCard} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.9} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.worksTypeSection}>
        <div className={styles.worksSectionHeading}>
          <p className="home-kicker">Types</p>
          <div>
            <h2>作品类型</h2>
            <p>用更宽的口径承接成员实践，产品、工具、案例和开源项目都可以展示。</p>
          </div>
        </div>

        <div className={styles.worksTypeGrid}>
          {Object.entries(workTypeLabels).map(([type, label]) => (
            <span key={type}>{label}</span>
          ))}
        </div>
      </section>

      {directory.tags.length > 0 ? (
        <section className={styles.worksTagSection}>
          <Tags aria-hidden="true" strokeWidth={1.8} />
          <div>
            <strong>作品标签</strong>
            <div>
              {directory.tags.map((tag) => (
                <ToneBadge key={tag} label={tag} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.worksDirectorySection} id="works-directory">
        <div className={styles.worksSectionHeading}>
          <p className="home-kicker">Directory</p>
          <div>
            <h2>公开作品</h2>
            <p>每个作品都会回到成员本人，方便从“作品”继续认识背后的人。</p>
          </div>
        </div>

        {directory.works.length > 0 ? (
          <div className={styles.worksGrid}>
            {directory.works.map((work) => (
              <div id={`work-${work.id}`} key={work.id}>
                <MemberWorkCard work={work} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.worksEmptyPanel}>
            <strong>还没有公开作品</strong>
            <p>成员提交作品并通过审核后，会在这里形成社区作品墙。</p>
            <Link href="/account?submit=work#works" className="button home-primary-button">
              <Plus aria-hidden="true" strokeWidth={2} />
              提交个人作品
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
