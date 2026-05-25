import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Handshake,
  Lightbulb,
  MessageSquareText,
  Rocket,
  Sparkles,
  Target,
  UsersRound,
  WandSparkles,
} from "lucide-react";

import styles from "../ai-office-course-survey/survey-report-page.module.css";

export const metadata: Metadata = {
  title: "常州 AI Club 培训需求调研",
  description:
    "常州 AI Club 基于 23 份回收问卷整理的培训需求调研，覆盖成员职业分布、AI 使用程度、学习痛点、内容偏好、培训形式和价格接受度。",
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
  { value: "23", label: "回收问卷", detail: "覆盖技术岗与非技术岗", icon: UsersRound },
  { value: "87%", label: "经常/深度使用 AI", detail: "不是纯入门人群", icon: Sparkles },
  { value: "65%", label: "关注 AI 变现", detail: "接单、副业、项目", icon: CircleDollarSign },
  { value: "61%", label: "愿意分享经验", detail: "社区共建基础较好", icon: Handshake },
] as const;

const headlineFindings = [
  {
    title: "培训不宜只做基础入门",
    summary: "经常使用和深度使用 AI 的成员合计 87%，课程更适合从效率提升、工作流和项目化应用切入。",
    icon: WandSparkles,
  },
  {
    title: "AI 变现是最强拉力",
    summary: "65% 选择 AI 变现，开放题里也反复出现挣钱、创业、接单和项目管理落地。",
    icon: Rocket,
  },
  {
    title: "最大障碍是路径不清",
    summary: "56.5% 觉得想变现但没思路，47.8% 觉得会用但效率不高，说明需要从工具使用走向方案设计。",
    icon: Lightbulb,
  },
  {
    title: "培训形态可以线上线下并行",
    summary: "线上直播和常州本地线下面对面各占 34.8%，适合做轻量直播加本地工作坊的组合。",
    icon: CalendarClock,
  },
] as const;

const roleLegend: LegendItem[] = [
  { label: "软件开发 / IT 相关", value: "7人 · 30.4%", color: "#0f7a6a" },
  { label: "传统行业（制造/贸易等）", value: "6人 · 26.1%", color: "#2f82ed" },
  { label: "自由职业 / 创业者", value: "5人 · 21.7%", color: "#ee7f18" },
  { label: "学生", value: "2人 · 8.7%", color: "#7d63f1" },
  { label: "其他", value: "2人 · 8.7%", color: "#87908c" },
  { label: "产品经理 / 运营", value: "1人 · 4.3%", color: "#1a9f87" },
];

const usageLegend: LegendItem[] = [
  { label: "经常用（写作/编程/办公）", value: "12人 · 52.2%", color: "#0f7a6a" },
  { label: "深度使用（工作依赖 AI）", value: "8人 · 34.8%", color: "#2f82ed" },
  { label: "偶尔用（如 ChatGPT 问问题）", value: "3人 · 13%", color: "#ee7f18" },
  { label: "几乎不用", value: "0人", color: "#87908c" },
];

const painItems: BarItem[] = [
  { label: "想变现但没思路", value: 13, percent: 56.5, tone: "red" },
  { label: "会用但效率不高", value: 11, percent: 47.8, tone: "orange" },
  { label: "Prompt 不会写", value: 6, percent: 26.1, tone: "blue" },
  { label: "无法结合自己工作", value: 6, percent: 26.1, tone: "blue" },
  { label: "工具太多不知道选哪个", value: 5, percent: 21.7, tone: "purple" },
  { label: "其他", value: 3, percent: 13, tone: "gray" },
  { label: "不知道能用来干什么", value: 2, percent: 8.7, tone: "gray" },
];

const topicItems: BarItem[] = [
  { label: "AI 变现", value: 15, percent: 65.2, tone: "green" },
  { label: "AI 工作流", value: 13, percent: 56.5, tone: "blue" },
  { label: "ChatGPT / Claude 高效使用", value: 12, percent: 52.2, tone: "purple" },
  { label: "AI + 自媒体", value: 12, percent: 52.2, tone: "orange" },
  { label: "企业落地", value: 11, percent: 47.8, tone: "green" },
  { label: "AI 编程", value: 10, percent: 43.5, tone: "blue" },
  { label: "AI 办公提效", value: 7, percent: 30.4, tone: "orange" },
  { label: "本地部署/开源模型", value: 7, percent: 30.4, tone: "gray" },
  { label: "AI 基础入门", value: 5, percent: 21.7, tone: "gray" },
  { label: "Prompt 工程实战", value: 5, percent: 21.7, tone: "purple" },
];

const formatItems: BarItem[] = [
  { label: "线上直播（1-2 小时）", value: 8, percent: 34.8, tone: "blue" },
  { label: "线下面对面（常州本地）", value: 8, percent: 34.8, tone: "green" },
  { label: "实战工作坊（边做边学）", value: 5, percent: 21.7, tone: "orange" },
  { label: "系列课程（连续几节）", value: 1, percent: 4.3, tone: "gray" },
  { label: "社群陪跑（长期）", value: 1, percent: 4.3, tone: "gray" },
];

const priceItems: BarItem[] = [
  { label: "300 元以上（系统课程）", value: 11, percent: 47.8, tone: "green" },
  { label: "免费为主", value: 5, percent: 21.7, tone: "blue" },
  { label: "100-299 元", value: 4, percent: 17.4, tone: "orange" },
  { label: "50-99 元", value: 2, percent: 8.7, tone: "gray" },
  { label: "9.9-49 元", value: 1, percent: 4.3, tone: "gray" },
];

const timeItems: BarItem[] = [
  { label: "工作日晚上", value: 11, percent: 47.8, tone: "green" },
  { label: "周末白天", value: 9, percent: 39.1, tone: "blue" },
  { label: "周末晚上", value: 3, percent: 13, tone: "orange" },
];

const participationLegend: LegendItem[] = [
  { label: "愿意分享经验", value: "14人 · 60.9%", color: "#0f7a6a" },
  { label: "愿意做组织者", value: "6人 · 26.1%", color: "#2f82ed" },
  { label: "只参与学习", value: "3人 · 13%", color: "#ee7f18" },
];

const visibleOpenResponses = [
  "挣钱、如何变现、个人如何通过 AI 启动创业。",
  "目前各类主流工具及平台的介绍、注册，消除沟通障碍。",
  "非专科出身从 0 到 1 实践与工具运用，结合自身行业工作流和痛点。",
  "企业知识库建设、用 AI 完成项目管理的落地实施。",
  "vibe coding 开发大型项目、解决系统性的小问题。",
];

const learnerProfile = [
  ["人群基础", "软件开发/IT、传统行业、自由职业/创业者共同构成主样本"],
  ["使用程度", "87% 经常或深度使用 AI，适合做进阶型主题"],
  ["最大牵引", "AI 变现、AI 工作流、ChatGPT/Claude 高效使用"],
  ["主要阻碍", "想变现但缺路径，会用但效率不高，不知道如何结合自身工作"],
  ["适合形式", "线上 1-2 小时直播与常州本地线下课并行，重点场次做工作坊"],
  ["社区潜力", "87% 愿意分享经验或做组织者，可引导为共建者和案例贡献者"],
];

const courseRecommendations = [
  "把第一场定位为“AI 变现与工作流路径图”，不要只讲工具菜单。",
  "用 1-2 个真实案例串联：需求识别、工具选择、Prompt、自动化流程和交付结果。",
  "为非技术成员设计 0 到 1 实操线，为技术成员保留 vibe coding / 自动化进阶线。",
  "采用免费公开分享引流，本地工作坊和系统课程承接 100-300 元及 300 元以上付费意愿。",
  "优先安排工作日晚上直播，周末白天做线下工作坊。",
  "把愿意分享和愿意组织的人沉淀成讲师助教池，形成社区自增长内容供给。",
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

export default function TrainingDemandSurveyPage() {
  return (
    <div className={styles.reportPage}>
      <section className={styles.hero} aria-labelledby="report-title">
        <div className={styles.heroCopy}>
          <Link href="/reports" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" strokeWidth={2} />
            研究与报告
          </Link>
          <p className="home-kicker">Survey Report · 培训需求</p>
          <h1 id="report-title">常州 AI Club 培训需求调研</h1>
          <p>
            这份报告基于 23 份回收问卷，整理成员职业背景、AI 使用程度、学习痛点、
            内容偏好、培训形式和价格接受度，用来辅助设计后续社区培训和共建活动。
          </p>
          <div className={styles.heroActions}>
            <Link href="/cooperate#lead-form" className="button home-primary-button">
              咨询培训合作
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="#course-recommendations" className="button home-ghost-button">
              查看课程建议
            </Link>
          </div>
        </div>

        <div className={styles.heroPanel} data-hero-number="23" aria-label="报告摘要">
          <span>样本摘要</span>
          <strong>成员已经会用 AI，但更需要把 AI 变成项目、收入和稳定工作流。</strong>
          <p>
            这份调研的关键不是“从零认识 AI”，而是帮助不同背景的人找到可执行的下一步。
          </p>
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
          title="人群既有技术底色，也有真实行业场景"
          summary="软件开发/IT 相关占比最高，但传统行业、自由职业/创业者和学生也很明显，培训内容需要兼顾技术实践和商业落地。"
        />
        <div className={styles.twoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <BriefcaseBusiness aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>职业分布</h3>
                <p>IT、传统行业和创业/自由职业人群合计超过 78%。</p>
              </div>
            </div>
            <PieChart
              title="职业分布"
              center="23人"
              background="conic-gradient(#0f7a6a 0deg 109deg, #2f82ed 109deg 203deg, #ee7f18 203deg 281deg, #7d63f1 281deg 312deg, #87908c 312deg 344deg, #1a9f87 344deg 360deg)"
              legend={roleLegend}
            />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <Sparkles aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>AI 使用程度</h3>
                <p>没有“几乎不用”的样本，说明课程可以从真实任务开始。</p>
              </div>
            </div>
            <PieChart
              title="AI 使用程度"
              center={"87%\n高频/深度"}
              background="conic-gradient(#0f7a6a 0deg 188deg, #2f82ed 188deg 313deg, #ee7f18 313deg 360deg)"
              legend={usageLegend}
            />
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Pain Points"
          title="大家会用 AI，但卡在变现路径和效率方法"
          summary="最大困扰是“想变现但没思路”和“会用但效率不高”，这比单纯提示词或工具选择更靠前。"
        />
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <MessageSquareText aria-hidden="true" strokeWidth={1.8} />
            <div>
              <h3>使用 AI 时最大的困扰</h3>
              <p>课程要帮助学员把工具能力转成项目能力，而不是只补 Prompt 技巧。</p>
            </div>
          </div>
          <BarChart items={painItems} />
          <div className={styles.insightBox}>
            “AI 变现”和“工作流效率”可以作为主线，Prompt、工具选择和行业结合放进主线中讲。
          </div>
        </article>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Topics"
          title="内容偏好集中在变现、工作流和高效使用"
          summary="AI 变现排第一，AI 工作流第二，ChatGPT/Claude 高效使用和 AI + 自媒体并列第三，说明用户关注结果和路径。"
        />
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <ClipboardList aria-hidden="true" strokeWidth={1.8} />
            <div>
              <h3>付费培训感兴趣内容</h3>
              <p>最多选 3 项的结果显示，入门内容不是主需求，项目化和收入化更强。</p>
            </div>
          </div>
          <BarChart items={topicItems} />
        </article>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Format & Price"
          title="线上直播和本地线下课都值得做"
          summary="形式上，线上直播与常州本地线下面对面并列第一；价格上，近半样本可接受 300 元以上系统课程。"
        />
        <div className={styles.threeColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <BookOpenCheck aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>培训形式</h3>
                <p>轻量直播适合引流，本地工作坊适合做深。</p>
              </div>
            </div>
            <BarChart items={formatItems} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <CircleDollarSign aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>价格接受度</h3>
                <p>系统课程存在较明确的付费空间。</p>
              </div>
            </div>
            <BarChart items={priceItems} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <CalendarClock aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>更方便的时间</h3>
                <p>工作日晚上和周末白天是优先时段。</p>
              </div>
            </div>
            <BarChart items={timeItems} />
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Community"
          title="这不只是一场课，也可以是社区共建入口"
          summary="60.9% 愿意分享经验，26.1% 愿意做组织者，说明培训之后可以继续沉淀案例、助教和专题分享。"
        />
        <div className={styles.twoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <Handshake aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>参与分享或共建意愿</h3>
                <p>愿意分享或组织的人合计 87%，适合进入共建者池。</p>
              </div>
            </div>
            <PieChart
              title="参与分享或共建意愿"
              center={"87%\n可共建"}
              background="conic-gradient(#0f7a6a 0deg 219deg, #2f82ed 219deg 313deg, #ee7f18 313deg 360deg)"
              legend={participationLegend}
            />
          </article>

          <article className={styles.quotePanel}>
            <h3>开放回答里的主题</h3>
            {visibleOpenResponses.map((item) => (
              <blockquote key={item}>{item}</blockquote>
            ))}
          </article>
        </div>
      </section>

      <section className={styles.reportSection} id="course-recommendations">
        <SectionHeading
          eyebrow="Course Design"
          title="课程设计建议"
          summary="更合适的产品形态是“路径图 + 实战案例 + 本地工作坊 + 共建沉淀”，让学习直接连接项目和收入。"
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
            <h3>建议动作</h3>
            <ol>
              {courseRecommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <footer className={styles.reportFooter}>
        <span>报告整理时间：2026 年 5 月 25 日</span>
        <span>样本量：23 份回收问卷</span>
      </footer>
    </div>
  );
}
