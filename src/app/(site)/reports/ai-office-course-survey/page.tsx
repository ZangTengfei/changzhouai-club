import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Clock3,
  FileText,
  GraduationCap,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  WandSparkles,
} from "lucide-react";

import styles from "./survey-report-page.module.css";

export const metadata: Metadata = {
  title: "AI 办公通识课 · 课前调研分析",
  description:
    "常州 AI Club 基于 30 份有效问卷整理的 AI 办公通识课课前调研分析，覆盖学员画像、办公痛点、AI 使用阻碍与课程设计建议。",
};

type Tone = "green" | "blue" | "orange" | "red" | "purple" | "gray";

type BarItem = {
  label: string;
  value: number;
  percent: number;
  tone?: Tone;
};

type LegendItem = {
  label: string;
  value: string;
  color: string;
};

const overviewStats = [
  { value: "30", label: "有效问卷", detail: "来自课前调研", icon: UsersRound },
  { value: "7", label: "岗位类型", detail: "覆盖技术岗与业务岗", icon: BriefcaseBusiness },
  { value: "54%", label: "高频及深度用户", detail: "已具备进阶基础", icon: WandSparkles },
  { value: "67%", label: "偏好 45-60 分钟", detail: "适合实操加答疑", icon: Clock3 },
] as const;

const headlineFindings = [
  {
    title: "课程主线应围绕真实办公输出",
    summary: "PPT/海报制作、创意发想、案头写作位列耗时痛点前三，适合用一条完整办公任务线串联教学。",
    icon: Target,
  },
  {
    title: "学员不是纯小白群体",
    summary: "54% 已经高频使用或深度协作，课程需要同时照顾入门铺垫和进阶工作流。",
    icon: GraduationCap,
  },
  {
    title: "提示词与迭代能力是关键短板",
    summary: "不少人会简单描述后直接使用初稿，课程需要教会补背景、拆步骤、验证和多轮修正。",
    icon: MessageSquareQuote,
  },
  {
    title: "信任与落地门槛要被正面处理",
    summary: "胡说八道、场景盲区、网络与工具门槛共同构成阻碍，适合用案例、工具指南和安全红线拆解。",
    icon: ShieldCheck,
  },
] as const;

const roleLegend: LegendItem[] = [
  { label: "产品/设计/研发", value: "9人 · 30%", color: "#0f7a6a" },
  { label: "人事/行政/财务/法务", value: "4人 · 13%", color: "#2f82ed" },
  { label: "教师/学生/科研", value: "4人 · 13%", color: "#ee7f18" },
  { label: "市场/营销/公关", value: "4人 · 13%", color: "#d64b3e" },
  { label: "管理层/创业者", value: "4人 · 13%", color: "#7d63f1" },
  { label: "销售/客服/运营", value: "3人 · 10%", color: "#1a9f87" },
  { label: "其他", value: "2人 · 7%", color: "#87908c" },
];

const aiDepthLegend: LegendItem[] = [
  { label: "纯小白", value: "4人 · 13%", color: "#d64b3e" },
  { label: "浅尝辄止", value: "3人 · 10%", color: "#ee7f18" },
  { label: "间歇性使用", value: "8人 · 27%", color: "#2f82ed" },
  { label: "高频使用", value: "11人 · 37%", color: "#0f7a6a" },
  { label: "深度协作", value: "5人 · 17%", color: "#7d63f1" },
];

const durationLegend: LegendItem[] = [
  { label: "15-20 分钟", value: "4人 · 13%", color: "#f2bd45" },
  { label: "30-40 分钟", value: "7人 · 23%", color: "#2f82ed" },
  { label: "45-60 分钟", value: "20人 · 67%", color: "#0f7a6a" },
];

const timePainItems: BarItem[] = [
  { label: "视觉制作（PPT/海报）", value: 17, percent: 77, tone: "green" },
  { label: "创意发想", value: 14, percent: 64, tone: "green" },
  { label: "案头工作（汇报/邮件）", value: 13, percent: 59, tone: "blue" },
  { label: "数据整理（Excel）", value: 10, percent: 45, tone: "blue" },
  { label: "会议相关", value: 9, percent: 41, tone: "orange" },
  { label: "沟通拉扯", value: 7, percent: 32, tone: "orange" },
  { label: "资料处理（阅读/翻译）", value: 5, percent: 23, tone: "gray" },
];

const collaborationItems: BarItem[] = [
  { label: "详细背景 + 分步修改", value: 14, percent: 47, tone: "green" },
  { label: "简单背景 + 直接用初稿", value: 10, percent: 33, tone: "blue" },
  { label: "一句指令 + 直接用", value: 5, percent: 17, tone: "orange" },
  { label: "没让 AI 做过", value: 2, percent: 7, tone: "red" },
];

const errorReactionItems: BarItem[] = [
  { label: "调整下再试试", value: 13, percent: 43, tone: "green" },
  { label: "正常，多轮沟通修正", value: 7, percent: 23, tone: "blue" },
  { label: "AI 不靠谱，自己来", value: 6, percent: 20, tone: "orange" },
  { label: "这工具不行", value: 3, percent: 10, tone: "red" },
  { label: "没用过", value: 2, percent: 7, tone: "gray" },
];

const barrierItems: BarItem[] = [
  { label: "信任危机（胡说八道）", value: 13, percent: 43, tone: "red" },
  { label: "场景盲区（不知怎么结合）", value: 12, percent: 40, tone: "red" },
  { label: "网络与门槛", value: 11, percent: 37, tone: "orange" },
  { label: "结果落地难", value: 10, percent: 33, tone: "orange" },
  { label: "提问障碍（废话输出）", value: 9, percent: 30, tone: "blue" },
  { label: "安全顾虑（数据泄密）", value: 7, percent: 23, tone: "blue" },
  { label: "迭代无力（放弃快）", value: 5, percent: 17, tone: "gray" },
];

const learningSceneItems: BarItem[] = [
  { label: "PPT 制作", value: 20, percent: 67, tone: "green" },
  { label: "表格处理（Excel）", value: 12, percent: 40, tone: "blue" },
  { label: "会议纪要", value: 11, percent: 37, tone: "blue" },
  { label: "长文阅读（PDF 提炼）", value: 10, percent: 33, tone: "orange" },
  { label: "创意文案", value: 10, percent: 33, tone: "orange" },
  { label: "公文/邮件", value: 7, percent: 23, tone: "purple" },
  { label: "沟通辅助", value: 6, percent: 20, tone: "gray" },
];

const formulaCaseItems: BarItem[] = [
  { label: "写工作周报", value: 14, percent: 47, tone: "green" },
  { label: "改带货文案", value: 9, percent: 30, tone: "blue" },
  { label: "委婉拒绝", value: 5, percent: 17, tone: "orange" },
  { label: "学习计划", value: 2, percent: 7, tone: "gray" },
];

const painQuotes = [
  "每月有很多报表，但数据都是互通，如果能填其中一两个，则其它自动补齐就好了。",
  "能否简易接入微信群，每天随手订单和付款记录直接发到财务微信群，接入后自动整理归纳出月报/日报表。",
  "透过文档内容，完成小红书或公众号版的内容直接输出。",
  "使用各类 AI 工具制作 PPT 时，该如何组织材料等上下文，如何引导初稿后续调整。",
  "像场景中的那样，最好是全自动完成，把高频工作自动化完成，减轻工作量。",
  "之前要统计某应用每个人的使用情况，最后让 AI 写了一个脚本来每天运行。",
];

const concernQuotes = [
  "目前讲解因为受众水平不统一，所以很难按等级教学。希望系统的学习一下，然后分方向。",
  "不接地气。最好针对相关工具的注册及配套资源途径先来个通识课，拉平认知差异，让我们能听懂群内的讨论。",
  "没有资源实践，建议可以配置 AI Token 资源进行实践。",
  "同类工具太多，不如一个工具先用起来。",
  "有些 AI 需要极高的硬件门槛。",
  "老旧的提示词框架。",
];

const learnerProfile = [
  ["岗位", "产品/设计/研发为主，兼顾业务岗"],
  ["AI 水平", "偏中高，54% 为高频使用或深度协作，但 23% 仍需入门铺垫"],
  ["核心痛点", "PPT 制作、创意发想、案头写作"],
  ["最大障碍", "不信任 AI 输出，不知道怎么结合工作"],
  ["协作方式", "相当一部分人简单描述后直接使用，迭代能力需要补齐"],
  ["课程偏好", "45-60 分钟，最好包含互动答疑"],
];

const courseRecommendations = [
  "分层教学：课前发放 AI 水平自测，分为入门和进阶两轨。",
  "场景优先：以 PPT 制作为主线，把资料整理、提示词迭代、视觉生成和修改反馈串起来。",
  "工具聚焦：选择 1-2 款工具深度教学，避免工具很多但每个都浅尝即止。",
  "万能公式加迭代心法：用工作周报演示提问公式，再教三轮迭代把输出从 60 分改到 90 分。",
  "课前拉平材料：提供 AI 工具注册与入门指南、Token 使用说明，降低门槛。",
  "安全红线：明确哪些资料能给 AI，哪些资料不能给，降低数据泄露顾虑。",
  "可复用模板：每节课配套提示词模板和示例，保证学完后能立即用到办公场景。",
];

function BarChart({ items }: { items: BarItem[] }) {
  return (
    <div className={styles.barChart}>
      {items.map((item) => (
        <div className={styles.barRow} key={item.label}>
          <span className={styles.barLabel}>{item.label}</span>
          <div className={styles.barTrack}>
            <span
              className={`${styles.barFill} ${styles[item.tone ?? "green"]}`}
              style={{ width: `${item.percent}%` }}
            >
              {item.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PieChart({
  title,
  background,
  center,
  legend,
}: {
  title: string;
  background: string;
  center: string;
  legend: LegendItem[];
}) {
  return (
    <div className={styles.pieBlock}>
      <div
        className={styles.pie}
        style={{ "--pie-background": background } as CSSProperties}
        aria-label={title}
      >
        <span>{center}</span>
      </div>
      <div className={styles.legend}>
        {legend.map((item) => (
          <div className={styles.legendItem} key={item.label}>
            <span style={{ backgroundColor: item.color }} aria-hidden="true" />
            <strong>{item.label}</strong>
            <small>{item.value}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  summary,
}: {
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <div className={styles.sectionHeading}>
      <p className="home-kicker">{eyebrow}</p>
      <div>
        <h2>{title}</h2>
        <p>{summary}</p>
      </div>
    </div>
  );
}

export default function AiOfficeCourseSurveyPage() {
  return (
    <div className={styles.reportPage}>
      <section className={styles.hero} aria-labelledby="report-title">
        <div className={styles.heroCopy}>
          <Link href="/reports" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" strokeWidth={2} />
            研究与报告
          </Link>
          <p className="home-kicker">Survey Report · 课前调研</p>
          <h1 id="report-title">AI 办公通识课 · 课前调研分析</h1>
          <p>
            这份报告基于 30 份有效问卷，整理学员岗位、AI 使用深度、办公痛点、真实担忧和课程偏好，
            用来辅助设计更接地气的 AI 办公通识课。
          </p>
          <div className={styles.heroActions}>
            <Link href="/cooperate#lead-form" className="button home-primary-button">
              咨询企业内训
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="#course-recommendations" className="button home-ghost-button">
              查看课程建议
            </Link>
          </div>
        </div>

        <div className={styles.heroPanel} aria-label="报告摘要">
          <span>样本摘要</span>
          <strong>输出型工作，是这次调研里最清晰的 AI 办公切入点。</strong>
          <p>PPT、创意、写作、表格、会议纪要都指向同一件事：学员需要的是能马上进入日常流程的方法。</p>
        </div>
      </section>

      <section className={styles.statGrid} aria-label="调研概览">
        {overviewStats.map((item) => {
          const Icon = item.icon;

          return (
            <article className={styles.statCard} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.8} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.findingGrid} aria-labelledby="headline-findings">
        <div className={styles.sectionHeadingCompact}>
          <p className="home-kicker">Key Findings</p>
          <h2 id="headline-findings">先看结论</h2>
        </div>
        {headlineFindings.map((item) => {
          const Icon = item.icon;

          return (
            <article className={styles.findingCard} key={item.title}>
              <Icon aria-hidden="true" strokeWidth={1.8} />
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          );
        })}
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Audience"
          title="人群画像与 AI 使用基础"
          summary="样本覆盖 7 类岗位，既有产品、设计、研发等技术相关岗位，也有行政、财务、教师、销售、运营和创业者。"
        />
        <div className={styles.twoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <BriefcaseBusiness aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>Q1. 岗位分布</h3>
                <p>产品/设计/研发占比最高，但业务岗分布较均匀。</p>
              </div>
            </div>
            <PieChart
              title="岗位分布"
              center="30人"
              background="conic-gradient(#0f7a6a 0deg 108deg, #2f82ed 108deg 156deg, #ee7f18 156deg 204deg, #d64b3e 204deg 252deg, #7d63f1 252deg 288deg, #1a9f87 288deg 336deg, #87908c 336deg 360deg)"
              legend={roleLegend}
            />
            <div className={styles.insightBox}>
              课程应采用通用型为主、分方向为辅的结构，避免只按技术岗或只按业务岗设计。
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <Sparkles aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>Q3. AI 使用深度分布</h3>
                <p>高频和深度协作用户合计 54%，但仍有入门用户需要照顾。</p>
              </div>
            </div>
            <PieChart
              title="AI 使用深度分布"
              center="分层诊断"
              background="conic-gradient(#d64b3e 0deg 48deg, #ee7f18 48deg 84deg, #2f82ed 84deg 168deg, #0f7a6a 168deg 300deg, #7d63f1 300deg 360deg)"
              legend={aiDepthLegend}
            />
            <div className={styles.insightBox}>
              入门组需要工具与基础概念，进阶组需要拓展场景，高阶组更适合工作流和复杂案例。
            </div>
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Pain Points"
          title="最耗时的工作，集中在输出型任务"
          summary="前三名分别是 PPT/海报制作、创意发想和案头写作，正好对应 AI 在办公场景里最容易被感知的价值。"
        />
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <BarChart3 aria-hidden="true" strokeWidth={1.8} />
            <div>
              <h3>Q2. 工作中最耗时、最想甩掉的环节</h3>
              <p>多选题结果显示，课程第一课就应该让学员看到可落地的输出变化。</p>
            </div>
          </div>
          <BarChart items={timePainItems} />
          <div className={styles.insightBox}>
            建议把 PPT/海报、创意发想和案头写作设计成连续案例，而不是分散讲工具功能。
          </div>
        </article>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Workflow"
          title="会用 AI，但还没有稳定的协作方法"
          summary="不少学员已经愿意尝试 AI，也愿意在出错后调整，但补背景、拆任务、验证结果和反复迭代还没有形成习惯。"
        />
        <div className={styles.threeColumn}>
          <article className={styles.panel}>
            <h3>Q4. 让 AI 写材料/方案时的做法</h3>
            <BarChart items={collaborationItems} />
            <div className={styles.insightBox}>提示词能力是第一短板，万能公式适合放在课程前段。</div>
          </article>

          <article className={styles.panel}>
            <h3>Q5. AI 给出错误答案时的第一反应</h3>
            <BarChart items={errorReactionItems} />
            <div className={styles.insightBox}>67% 愿意调整或多轮修正，说明学员态度开放，只是缺少方法。</div>
          </article>

          <article className={styles.panel}>
            <h3>Q6. 使用 AI 的最大阻碍</h3>
            <BarChart items={barrierItems} />
            <div className={styles.insightBox}>信任危机、场景盲区、工具门槛和安全顾虑都需要在课上被正面处理。</div>
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Learning Needs"
          title="PPT 是最强需求，办公自动化是隐藏期待"
          summary="学员最希望拆解 PPT 制作，其次是表格、会议纪要、长文阅读和创意文案；用户原话里也出现了自动报表、自动整理和自动化脚本。"
        />
        <div className={styles.twoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <FileText aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>Q7. 最希望拆解的真实场景</h3>
                <p>PPT 制作是压倒性第一需求，可作为课程主线案例。</p>
              </div>
            </div>
            <BarChart items={learningSceneItems} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <BookOpenCheck aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>Q8 & Q10. 案例偏好与课程时长</h3>
                <p>工作周报适合演示万能公式，45-60 分钟更适合讲练结合。</p>
              </div>
            </div>
            <BarChart items={formulaCaseItems} />
            <PieChart
              title="课程时长偏好"
              center="30人"
              background="conic-gradient(#f2bd45 0deg 48deg, #2f82ed 48deg 132deg, #0f7a6a 132deg 360deg)"
              legend={durationLegend}
            />
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Voice"
          title="用户真实声音"
          summary="这些原话帮助课程设计回到真实办公现场：不是只会不会用工具，而是能不能嵌进每天重复发生的工作流。"
        />
        <div className={styles.quoteColumns}>
          <article className={styles.quotePanel}>
            <h3>具体工作痛点</h3>
            {painQuotes.map((quote) => (
              <blockquote key={quote}>{quote}</blockquote>
            ))}
          </article>

          <article className={styles.quotePanel}>
            <h3>担忧与建议</h3>
            {concernQuotes.map((quote) => (
              <blockquote key={quote}>{quote}</blockquote>
            ))}
          </article>
        </div>
      </section>

      <section className={styles.reportSection} id="course-recommendations">
        <SectionHeading
          eyebrow="Course Design"
          title="综合画像与课程设计建议"
          summary="这门课更适合做成“场景主线 + 分层支持 + 可带走模板”的办公实操课，而不是工具大全。"
        />
        <div className={styles.courseLayout}>
          <article className={styles.profilePanel}>
            <h3>典型学员画像</h3>
            <table>
              <tbody>
                {learnerProfile.map(([label, value]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className={styles.recommendationPanel}>
            <h3>课程设计建议</h3>
            <ol>
              {courseRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <footer className={styles.reportFooter}>
        <span>报告生成时间：2026 年 5 月 25 日</span>
        <span>样本量：30 份有效问卷</span>
      </footer>
    </div>
  );
}
