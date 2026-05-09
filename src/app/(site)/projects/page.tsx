import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  GitBranch,
  Lightbulb,
  Timer,
  Rocket,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { getVisibleProjectOpportunities } from "@/lib/community-projects";

import styles from "./projects-page.module.css";

export const metadata: Metadata = {
  title: "项目共建",
  description: "了解常州 AI Club 的项目方向、共建状态与参与方式。",
};

const buildPath = [
  {
    title: "提交线索",
    summary: "说清楚问题、场景和希望找到的协作者。",
    tone: "green",
    icon: Lightbulb,
  },
  {
    title: "确认边界",
    summary: "社区协助判断是否适合公开招募或定向对接。",
    tone: "orange",
    icon: GitBranch,
  },
  {
    title: "小步推进",
    summary: "用 Demo、PoC 或一次试点验证是否值得继续。",
    tone: "blue",
    icon: Rocket,
  },
] as const;

const buildStepToneClasses = {
  green: styles.projectsBuildStepgreen,
  orange: styles.projectsBuildSteporange,
  blue: styles.projectsBuildStepblue,
} as const;

export default async function ProjectsPage() {
  const projectDirectory = await getVisibleProjectOpportunities();
  const openOpportunities = projectDirectory.opportunities;

  return (
    <div className={styles.projectsPageStack}>
      <section className={styles.projectsHero} aria-labelledby="projects-hero-title">
        <div className={styles.projectsHeroCopy}>
          <p className="home-kicker">Projects · 项目共建</p>
          <h1 id="projects-hero-title">
            把松散想法，
            <span>推进成真实项目</span>
          </h1>
          <p>
            这里只放已经适合公开招募或申请对接的共建机会。项目还在早期时，
            先通过合作入口提交线索，由社区协助判断下一步。
          </p>

          <div className={styles.projectsHeroActions}>
            <Link href="#opportunities" className="button home-primary-button">
              查看开放机会
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/cooperate" className="button home-ghost-button">
              发起合作
            </Link>
          </div>

          <div className={styles.projectsHeroProof}>
            <strong>{openOpportunities.length || "0"}</strong>
            <span>
              个开放机会可查看。没有合适项目时，可以先提交合作需求或加入社区等待匹配。
            </span>
          </div>
        </div>

        <div className={styles.projectsHeroAside} aria-label="项目共建说明">
          <span>Co-build</span>
          <h2>适合放在这里的项目</h2>
          <ul>
            <li>目标和使用场景已经基本清楚</li>
            <li>需要找到成员参与试点、开发或运营</li>
            <li>可以公开展示基本信息和申请入口</li>
          </ul>
        </div>
      </section>

      <section className={styles.projectsOpportunitySection} id="opportunities">
        <div className={styles.projectsSectionHeading}>
          <p className="home-kicker">Opportunities</p>
          <div>
            <h2>开放共建机会</h2>
            <p>选择一个项目查看详情，确认匹配后再申请对接。</p>
          </div>
        </div>

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
                    查看并申请
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

      <section className={styles.projectsBuildPathSection}>
        <div className={styles.projectsSectionHeading}>
          <p className="home-kicker">How it works</p>
          <div>
            <h2>怎么开始</h2>
            <p>先把项目压到最小可验证，再决定是否继续扩大。</p>
          </div>
        </div>

        <div className={styles.projectsBuildPath}>
          {buildPath.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                className={`${styles.projectsBuildStep} ${buildStepToneClasses[item.tone]}`}
                key={item.title}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.projectsJoinPanel}>
        <div>
          <p className="home-kicker">Join</p>
          <h2>想参与或发起项目？</h2>
          <p>加入社区适合找长期伙伴；提交合作需求适合带着明确项目来对接。</p>
        </div>

        <div className={styles.projectsJoinActions}>
          <Link href="/join" className="button home-primary-button">
            加入社区
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
          <Link href="/cooperate" className="button home-ghost-button">
            提交合作需求
          </Link>
        </div>
      </section>
    </div>
  );
}
