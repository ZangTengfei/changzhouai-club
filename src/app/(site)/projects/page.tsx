import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  BriefcaseBusiness,
  CalendarDays,
  GitBranch,
  Lightbulb,
  Timer,
  Rocket,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { getCompletedEventRecaps } from "@/lib/community-events";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { getVisibleProjectOpportunities } from "@/lib/community-projects";
import { joinSteps, opcTracks, projectStatus } from "@/lib/site-data";

import styles from "./projects-page.module.css";

export const metadata: Metadata = {
  title: "项目共建",
  description: "了解常州 AI Club 的项目方向、共建状态与参与方式。",
};

const buildPath = [
  {
    title: "提出真实问题",
    summary: "从活动、企业需求或成员自研项目里发现值得继续验证的线索。",
    tone: "green",
    icon: Lightbulb,
  },
  {
    title: "约定角色边界",
    summary: "明确负责人、协作者、使用场景和下一步最小可交付结果。",
    tone: "orange",
    icon: GitBranch,
  },
  {
    title: "小步验证落地",
    summary: "通过 Demo、PoC、试点或复盘，把一次想法推进到可判断的状态。",
    tone: "blue",
    icon: Rocket,
  },
] as const;

const projectBoardCards = [
  {
    label: "Idea",
    title: "想法线索",
    detail: "活动现场与成员分享",
  },
  {
    label: "Pilot",
    title: "验证机会",
    detail: "PoC、工具、微型产品",
  },
  {
    label: "Build",
    title: "共建角色",
    detail: "负责人、开发、产品、运营",
  },
] as const;

const buildStepToneClasses = {
  green: styles.projectsBuildStepgreen,
  orange: styles.projectsBuildSteporange,
  blue: styles.projectsBuildStepblue,
} as const;

export default async function ProjectsPage() {
  const [directory, completedEvents, projectDirectory] = await Promise.all([
    getPublicMembersDirectory(),
    getCompletedEventRecaps(),
    getVisibleProjectOpportunities(),
  ]);
  const latestEvent = completedEvents[0];
  const openOpportunities = projectDirectory.opportunities;
  const projectStats = [
    {
      value: directory.stats.willingToJoinProjects || "持续招募",
      label: "愿意共建成员",
      detail: "适合项目协作与试点",
      icon: UsersRound,
    },
    {
      value: projectDirectory.stats.opportunities || "逐步开放",
      label: "开放机会",
      detail: "公开或成员可见的共建项目",
      icon: BriefcaseBusiness,
    },
    {
      value: projectDirectory.stats.recruiting || "待发布",
      label: "招募中",
      detail: "可报名或申请对接",
      icon: BadgeCheck,
    },
    {
      value: projectDirectory.stats.roleCount || "按需匹配",
      label: "角色类型",
      detail: "项目经理、开发、运营等",
      icon: Boxes,
    },
  ];

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
            项目共建不是先画一张很大的蓝图，而是从活动交流、成员自研、企业需求和
            OPC 实践里找到可验证的线索，再用小步协作把它推进到真实场景。
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
            <strong>{directory.stats.willingToJoinProjects || "共建中"}</strong>
            <span>
              位成员标记了共建意愿，
              {openOpportunities.length > 0
                ? `当前有 ${openOpportunities.length} 个开放机会可查看。`
                : `最近线索来自${latestEvent ? `「${latestEvent.title}」` : "线下活动与社区交流"}。`}
            </span>
          </div>
        </div>

        <div className={styles.projectBoard} aria-label="项目共建工作台">
          <div className={styles.projectBoardHeader}>
            <span>Co-build Board</span>
            <strong>从线索到试点</strong>
          </div>

          <div className={styles.projectBoardCards}>
            {projectBoardCards.map((item, index) => (
              <article className={styles.projectBoardCard} key={item.label}>
                <span>{item.label}</span>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
                {index < projectBoardCards.length - 1 ? (
                  <i aria-hidden="true" />
                ) : null}
              </article>
            ))}
          </div>

          <div className={styles.projectBoardIllustration} aria-hidden="true">
            <Image
              src="/home-flow-build.png"
              alt=""
              width={1124}
              height={1400}
              priority={false}
            />
          </div>

          <div className={styles.projectStickyNote}>
            <span>共建原则</span>
            <strong>先验证，再扩大；先明确角色，再投入时间</strong>
          </div>
          <DoodleSparkles className={styles.projectsHeroDoodle} />
          <HandDrawnArrow className={styles.projectsHeroArrow} />
        </div>
      </section>

      <section className={styles.projectsStatsPanel} aria-label="项目共建数据">
        {projectStats.map((item, index) => {
          const Icon = item.icon;

          return (
            <article className={styles.projectsStatCard} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.9} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.projectsOpportunitySection} id="opportunities">
        <div className={styles.projectsSectionHeading}>
          <p className="home-kicker">Opportunities</p>
          <div>
            <h2>开放共建机会</h2>
            <p>
              这里展示经过社区确认后适合公开招募或申请对接的项目机会，轻量众包和大项目角色招募都可以放在同一套框架里。
            </p>
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
            <p>社区会先确认需求边界、保密要求和可投入角色，再把适合公开招募的机会放到这里。</p>
            <Link href="/cooperate" className="button home-ghost-button">
              提交合作需求
            </Link>
          </div>
        )}
      </section>

      <section className={styles.projectsStatusSection}>
        <div className={styles.projectsSectionHeading}>
          <p className="home-kicker">Status</p>
          <div>
            <h2>当前共建状态</h2>
            <p>社区现阶段更看重真实问题和角色清晰度，公开项目会在可协作时逐步放出。</p>
          </div>
        </div>

        <div className={styles.projectsStatusGrid}>
          {projectStatus.map((item, index) => (
            <article className={styles.projectsStatusCard} key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.projectsBuildPathSection}>
        <div className={styles.projectsSectionHeading}>
          <p className="home-kicker">Flow</p>
          <div>
            <h2>项目共建怎么开始</h2>
            <p>把一次聊天推进到一次试点，需要问题、角色和最小验证动作同时清楚。</p>
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

      <section className={styles.opcSection}>
        <div className={styles.projectsSectionHeading}>
          <p className="home-kicker">OPC Builder Track</p>
          <div>
            <h2>社区正在关注的 OPC 方向</h2>
            <p>
              如果你在做一人产品、微型 SaaS、AI 自动化服务，或希望把个人能力变成稳定业务，
              这一块会尤其适合你。
            </p>
          </div>
        </div>

        <div className={styles.opcTrackGrid}>
          {opcTracks.map((item, index) => (
            <article className={styles.opcTrackCard} key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.projectsJoinPanel}>
        <div>
          <p className="home-kicker">Join</p>
          <h2>想参与项目共建，可以从这里开始</h2>
          <p>
            先加入社区、补充资料，再通过活动和合作入口让你的项目线索被更多合适的人看见。
          </p>
        </div>

        <div className={styles.projectsJoinSteps}>
          {joinSteps.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </article>
          ))}
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
