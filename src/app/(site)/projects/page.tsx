import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Timer,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { getVisibleProjectOpportunities } from "@/lib/community-projects";

import styles from "./projects-page.module.css";

export const metadata: Metadata = {
  title: "项目协作",
  description: "查看常州 AI Club 面向真实政企与企业需求的项目招募、协作状态与参与方式。",
};

const projectNotes = [
  {
    title: "真实需求",
    summary: "项目通常来自企业、机构、园区或成员线索，优先展示已确认基本场景的机会。",
  },
  {
    title: "组队协作",
    summary: "社区会按项目需要匹配产品、技术、设计、运营、交付等角色一起推进。",
  },
  {
    title: "筛选跟进",
    summary: "提交申请后由社区后台统一查看，再根据经验、时间和角色匹配情况联系。",
  },
] as const;

export default async function ProjectsPage() {
  const projectDirectory = await getVisibleProjectOpportunities();
  const openOpportunities = projectDirectory.opportunities;

  return (
    <div className={styles.projectsPageStack}>
      <section className={styles.projectsIntro} aria-labelledby="projects-title">
        <p className="home-kicker">Projects · 项目协作</p>
        <h1 id="projects-title">正在招募的项目</h1>
        <p>真实政企与企业需求进入社区后，会在这里开放适合公开申请的项目机会。</p>
      </section>

      <section aria-label="项目列表">
        {openOpportunities.length > 0 ? (
          <div className={styles.projectsOpportunityGrid}>
            {openOpportunities.map((opportunity) => (
              <article className={styles.projectsOpportunityCard} key={opportunity.id}>
                <div className={styles.projectsOpportunityHeader}>
                  <div className={styles.projectsOpportunityBadges}>
                    <span>{opportunity.typeLabel}</span>
                    <span>{opportunity.statusLabel}</span>
                    {opportunity.visibility !== "public" ? (
                      <span>{opportunity.visibilityLabel}</span>
                    ) : null}
                    <span>{opportunity.applicationRequiresLogin ? "登录后申请" : "可直接申请"}</span>
                  </div>
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.summary}</p>
                </div>

                <div className={styles.projectsOpportunityMeta}>
                  {opportunity.headcountLabel ? (
                    <span>
                      <UsersRound aria-hidden="true" strokeWidth={1.8} />
                      {opportunity.headcountLabel}
                    </span>
                  ) : null}
                  {opportunity.timeCommitment ? (
                    <span>
                      <Timer aria-hidden="true" strokeWidth={1.8} />
                      {opportunity.timeCommitment}
                    </span>
                  ) : null}
                  {opportunity.compensation ? (
                    <span>
                      <Sparkles aria-hidden="true" strokeWidth={1.8} />
                      {opportunity.compensation}
                    </span>
                  ) : null}
                  {opportunity.deadlineLabel ? (
                    <span>
                      <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                      截止 {opportunity.deadlineLabel}
                    </span>
                  ) : null}
                </div>

                {[...opportunity.roleTags, ...opportunity.topicTags].length > 0 ? (
                  <div className={styles.projectsOpportunityTags}>
                    {[...opportunity.roleTags, ...opportunity.topicTags].slice(0, 8).map((tag) => (
                      <span key={`${opportunity.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                ) : null}

                <div className={styles.projectsOpportunityActions}>
                  <Link href={opportunity.href} className="button home-primary-button">
                    查看详情
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.projectsOpportunityEmpty}>
            <BriefcaseBusiness aria-hidden="true" strokeWidth={1.8} />
            <strong>暂未开放公开招募项目</strong>
            <p>有项目线索或合作需求，可以先提交给社区，我们确认后再决定是否公开招募。</p>
            <Link href="/cooperate" className="button home-ghost-button">
              提交合作需求
            </Link>
          </div>
        )}
      </section>

      <section className={styles.projectsNotesSection} aria-labelledby="projects-notes-title">
        <div className={styles.projectsNotesHeading}>
          <p className="home-kicker">Collaboration</p>
          <h2 id="projects-notes-title">项目协作说明</h2>
        </div>

        <div className={styles.projectsNotes}>
          {projectNotes.map((item) => (
            <article className={styles.projectsNote} key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
