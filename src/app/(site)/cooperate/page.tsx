import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Handshake,
  Lightbulb,
  MessageCircle,
  Rocket,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { submitCooperationLead } from "@/app/(site)/cooperate/actions";
import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { ToneBadge } from "@/components/tone-badge";
import { getCompletedEventRecaps } from "@/lib/community-events";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { cooperationAreas } from "@/lib/site-data";

import styles from "./cooperate-page.module.css";

export const metadata: Metadata = {
  title: "合作联系",
  description: "欢迎企业、机构、园区与高校与常州 AI Club 进行分享、培训、PoC 和项目合作。",
};

type SearchParams = {
  submitted?: string;
  error?: string;
};

const cooperationScenarios = [
  {
    title: "企业与园区",
    summary: "围绕 AI 培训、工具落地、业务自动化和 PoC 验证展开沟通。",
    icon: Building2,
    tone: "green",
  },
  {
    title: "高校与机构",
    summary: "对接主题分享、学生实践、课程共创和本地 AI 交流活动。",
    icon: GraduationCap,
    tone: "orange",
  },
  {
    title: "项目与人才",
    summary: "连接成员能力、项目机会、分享嘉宾和轻量协作团队。",
    icon: UsersRound,
    tone: "blue",
  },
] as const;

const cooperationFlow = [
  {
    title: "提交需求",
    summary: "先留下合作背景、联系人和希望解决的问题。",
    icon: ClipboardList,
  },
  {
    title: "确认场景",
    summary: "进一步了解行业、目标、时间和预期交付形式。",
    icon: MessageCircle,
  },
  {
    title: "匹配资源",
    summary: "根据场景匹配社区成员、分享者、顾问或协作团队。",
    icon: Handshake,
  },
  {
    title: "推进试点",
    summary: "进入分享、培训、PoC、项目开发或长期合作阶段。",
    icon: Rocket,
  },
] as const;

function getStatusMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing_required_fields") {
    return "请至少填写公司 / 机构名称和需求简介。";
  }

  if (error === "missing_contact_channel") {
    return "请至少留下微信号或手机号中的一种联系方式。";
  }

  return "提交失败，请稍后再试。";
}

export default async function CooperatePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [params, directory, completedEvents] = await Promise.all([
    searchParams,
    getPublicMembersDirectory(),
    getCompletedEventRecaps(),
  ]);
  const errorMessage = getStatusMessage(params.error);
  const cooperationStats = [
    {
      value: cooperationAreas.length,
      label: "合作方向",
      detail: "分享、内训、PoC、项目协作",
      icon: Sparkles,
    },
    {
      value: completedEvents.length || 7,
      label: "活动沉淀",
      detail: "持续积累真实交流场景",
      icon: CalendarClock,
    },
    {
      value: directory.stats.willingToShare || "持续邀请",
      label: "分享成员",
      detail: "可对接主题交流与嘉宾",
      icon: MessageCircle,
    },
    {
      value: directory.stats.willingToJoinProjects || "持续招募",
      label: "共建成员",
      detail: "适合试点与项目推进",
      icon: UsersRound,
    },
  ];

  return (
    <div className={styles.cooperatePageStack}>
      <section className={styles.cooperateHero} aria-labelledby="cooperate-hero-title">
        <div className={styles.cooperateHeroCopy}>
          <p className="home-kicker">Cooperate · 合作联系</p>
          <h1 id="cooperate-hero-title">
            让真实需求，
            <span>连接合适的人</span>
          </h1>
          <p>
            如果你正在寻找 AI 主题分享、企业内训、PoC 验证、项目协作或本地人才连接，
            可以从这里把需求交给社区，我们会根据场景匹配合适的成员与合作方式。
          </p>

          <div className={styles.cooperateHeroActions}>
            <Link href="#lead-form" className="button home-primary-button">
              提交需求
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/projects" className="button home-ghost-button">
              了解共建方式
            </Link>
          </div>

          <div className={styles.cooperateHeroProof}>
            <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
            <span>社区会优先对齐真实场景、目标结果和可投入角色，再推进下一步沟通。</span>
          </div>
        </div>

        <div className={styles.cooperateBoard} aria-label="合作场景板">
          <div className={styles.cooperateBoardHeader}>
            <span>Cooperation Desk</span>
            <strong>把需求拆成可推进的下一步</strong>
          </div>

          <div className={styles.cooperateBoardGrid}>
            {cooperationScenarios.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className={`${styles.cooperateScenarioCard} ${styles[`cooperateScenario${item.tone}`]}`}
                  key={item.title}
                >
                  <Icon aria-hidden="true" strokeWidth={1.8} />
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                </article>
              );
            })}
          </div>

          <div className={styles.cooperateStickyNote}>
            <span>合作原则</span>
            <strong>先讲清业务场景，再匹配社区能力</strong>
          </div>
          <DoodleSparkles className={styles.cooperateHeroDoodle} />
          <HandDrawnArrow className={styles.cooperateHeroArrow} />
        </div>
      </section>

      {params.submitted ? (
        <div className={styles.statusNote}>
          <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
          <span>提交成功，我们已收到你的合作需求，并会根据你填写的联系方式尽快联系。</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className={`${styles.statusNote} ${styles.statusNoteError}`}>
          <Lightbulb aria-hidden="true" strokeWidth={1.9} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <section className={styles.cooperateStatsPanel} aria-label="合作资源概览">
        {cooperationStats.map((item) => {
          const Icon = item.icon;

          return (
            <article className={styles.cooperateStatCard} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.9} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.cooperateAreasSection}>
        <div className={styles.cooperateSectionHeading}>
          <p className="home-kicker">Areas</p>
          <div>
            <h2>适合发起的合作方向</h2>
            <p>这些方向更容易和社区活动、成员能力、项目共建形成连接。</p>
          </div>
        </div>

        <div className={styles.cooperateAreaCloud}>
          {cooperationAreas.map((item) => (
            <ToneBadge key={item} label={item} />
          ))}
        </div>
      </section>

      <section className={styles.cooperateFlowSection}>
        <div className={styles.cooperateSectionHeading}>
          <p className="home-kicker">Flow</p>
          <div>
            <h2>合作推进方式</h2>
            <p>我们会先把需求变清楚，再判断适合分享、培训、PoC 还是项目协作。</p>
          </div>
        </div>

        <div className={styles.cooperateFlowGrid}>
          {cooperationFlow.map((item, index) => {
            const Icon = item.icon;

            return (
              <article className={styles.cooperateFlowCard} key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.leadFormSection} id="lead-form">
        <div className={styles.leadFormIntro}>
          <p className="home-kicker">Lead Form</p>
          <h2>提交合作需求</h2>
          <p>请尽量完整填写合作背景、需求场景与联系方式，便于进一步沟通与对接。</p>

          <div className={styles.leadFormChecklist}>
            <span>公司 / 机构名称</span>
            <span>联系人与微信 / 手机号</span>
            <span>需求类型与场景简介</span>
            <span>预算范围与期望时间</span>
          </div>
        </div>

        <form action={submitCooperationLead} className={styles.leadForm}>
          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span>公司 / 机构名称</span>
              <input
                className="input"
                name="company_name"
                placeholder="例如：某制造企业 / 园区 / 高校"
                required
              />
            </label>

            <label className={styles.formField}>
              <span>联系人</span>
              <input className="input" name="contact_name" placeholder="怎么称呼你" />
            </label>

            <label className={styles.formField}>
              <span>微信号</span>
              <input className="input" name="contact_wechat" placeholder="请至少填写微信或手机号其中一项" />
            </label>

            <label className={styles.formField}>
              <span>手机号</span>
              <input className="input" name="contact_phone" placeholder="请至少填写微信或手机号其中一项" />
            </label>

            <label className={styles.formField}>
              <span>需求类型</span>
              <input className="input" name="requirement_type" placeholder="分享 / 内训 / PoC / 项目开发 / 顾问支持" />
            </label>

            <label className={styles.formField}>
              <span>预算范围</span>
              <input className="input" name="budget_range" placeholder="例如：5k-20k / 预算待评估 / 需进一步沟通" />
            </label>

            <label className={`${styles.formField} ${styles.formFieldWide}`}>
              <span>期望时间</span>
              <input
                className="input"
                name="desired_timeline"
                placeholder="例如：4 月中旬安排沟通，5 月启动试点"
              />
            </label>

            <label className={`${styles.formField} ${styles.formFieldWide}`}>
              <span>需求简介</span>
              <textarea
                className="input textarea"
                name="requirement_summary"
                rows={5}
                placeholder="请尽量写清楚业务场景、希望解决的问题、预期结果，以及是否需要线下沟通。"
                required
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className="button home-primary-button">
              提交合作需求
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
