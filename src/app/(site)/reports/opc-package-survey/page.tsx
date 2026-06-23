import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Cable,
  Code2,
  FileText,
  Gauge,
  Globe2,
  Network,
  PackageCheck,
  Router,
  Target,
  UsersRound,
  WalletCards,
} from "lucide-react";

import styles from "../ai-office-course-survey/survey-report-page.module.css";

export const metadata: Metadata = {
  title: "2026 AI 编程现状及电信 OPC 套餐需求调研",
  description:
    "常州 AI 交流群基于 16 份有效问卷整理的 AI 编程现状与电信 OPC 套餐需求调研报告，覆盖模型使用、Token 消耗、痛点和套餐偏好。",
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
  { value: "16", label: "有效问卷", detail: "面向 AI 编程用户", icon: UsersRound },
  { value: "75%", label: "全栈/研发角色", detail: "样本技术属性明显", icon: Code2 },
  { value: "94%", label: "需要统一结算", detail: "套餐最强需求", icon: WalletCards },
  { value: "63%", label: "上下文瓶颈", detail: "最高频痛点", icon: Network },
] as const;

const headlineFindings = [
  {
    title: "用户已进入 Agent 编程阶段",
    summary: "56% 以 Agent 模式为主，44% 使用架构/总控模式，传统 Copilot 补全模式在样本中几乎消失。",
    icon: BrainCircuit,
  },
  {
    title: "Claude 生态是最强入口",
    summary: "Claude 系列模型占 56%，Claude Code 使用占 81%，适合作为套餐验证的首批重点场景。",
    icon: Code2,
  },
  {
    title: "痛点集中在网络、上下文与结算",
    summary: "上下文瓶颈 63%、网络抖动 56%、Token 消耗 50%，说明用户需要稳定体验，不只是低价额度。",
    icon: Gauge,
  },
  {
    title: "套餐需求指向统一入口",
    summary: "Token 统一结算达到 94%，智能模型流量包达到 75%，用户希望少折腾、多模型、可预期。",
    icon: PackageCheck,
  },
] as const;

const roleLegend: LegendItem[] = [
  { label: "前端/后端/全栈开发", value: "12人 · 75%", color: "#0f7a6a" },
  { label: "数据分析/科研", value: "3人 · 19%", color: "#2f82ed" },
  { label: "其他", value: "1人 · 6%", color: "#ee7f18" },
];

const workflowLegend: LegendItem[] = [
  { label: "Agent 模式", value: "9人 · 56%", color: "#0f7a6a" },
  { label: "架构/总控模式", value: "7人 · 44%", color: "#2f82ed" },
  { label: "Copilot 模式", value: "0人 · 样本未出现", color: "#87908c" },
];

const modelItems: BarItem[] = [
  { label: "Claude Opus/Sonnet 4.6", value: 9, percent: 56, tone: "green" },
  { label: "GPT-5.4", value: 7, percent: 44, tone: "blue" },
  { label: "MiniMax M2.5/M2.7", value: 7, percent: 44, tone: "purple" },
  { label: "Gemini 3.1 Pro", value: 4, percent: 25, tone: "orange" },
  { label: "Z.ai GLM 5", value: 4, percent: 25, tone: "orange" },
  { label: "DeepSeek V3.2", value: 2, percent: 13, tone: "gray" },
  { label: "Kimi K2.5", value: 2, percent: 13, tone: "gray" },
  { label: "Qwen3", value: 2, percent: 13, tone: "gray" },
];

const toolItems: BarItem[] = [
  { label: "Claude Code", value: 13, percent: 81, tone: "green" },
  { label: "Codex", value: 8, percent: 50, tone: "blue" },
  { label: "Cursor", value: 7, percent: 44, tone: "purple" },
  { label: "Antigravity", value: 4, percent: 25, tone: "orange" },
  { label: "Trae", value: 4, percent: 25, tone: "orange" },
  { label: "GitHub Copilot", value: 3, percent: 19, tone: "gray" },
];

const accessItems: BarItem[] = [
  { label: "厂商官方 API", value: 5, percent: 31, tone: "green" },
  { label: "IDE 内置服务", value: 5, percent: 31, tone: "blue" },
  { label: "专线/中转平台", value: 5, percent: 31, tone: "purple" },
  { label: "本地私有部署", value: 1, percent: 6, tone: "gray" },
];

const tokenItems: BarItem[] = [
  { label: "1亿-10亿 Token", value: 12, percent: 75, tone: "green" },
  { label: "10亿-50亿 Token", value: 3, percent: 19, tone: "orange" },
  { label: "50亿以上 Token", value: 1, percent: 6, tone: "purple" },
  { label: "1亿以下 Token", value: 0, percent: 0, tone: "gray" },
];

const spendItems: BarItem[] = [
  { label: "100 元以下", value: 3, percent: 19, tone: "blue" },
  { label: "500 元以下", value: 10, percent: 63, tone: "green" },
  { label: "500-2000 元", value: 3, percent: 19, tone: "orange" },
  { label: "2000 元以上", value: 0, percent: 0, tone: "gray" },
];

const painItems: BarItem[] = [
  { label: "上下文瓶颈", value: 10, percent: 63, tone: "red" },
  { label: "网络抖动", value: 9, percent: 56, tone: "orange" },
  { label: "Token 消耗过快", value: 8, percent: 50, tone: "orange" },
  { label: "多 Agent 成本复杂", value: 7, percent: 44, tone: "blue" },
];

const packageItems: BarItem[] = [
  { label: "Token 统一结算", value: 15, percent: 94, tone: "green" },
  { label: "智能模型流量包", value: 12, percent: 75, tone: "blue" },
  { label: "IDE 算力绑定", value: 6, percent: 38, tone: "orange" },
  { label: "静态 IP / 内网穿透", value: 5, percent: 31, tone: "purple" },
];

const pricingSignals = [
  "有一部分用户明确期待 200 元左右的低门槛价格。",
  "更多用户希望价格介于中转平台和官方直连之间，重点看稳定性与质量。",
  "高质量网络、原生 IP、顶级模型低价额度会提升付费意愿。",
  "付款便利和链路稳定性会影响最终转化，不只是套餐面值。",
];

const productProfile = [
  ["首要客群", "使用 Claude Code、Codex、Cursor 的全栈/后端/前端开发者"],
  ["核心场景", "Agent 多文件修改、仓库理解、测试验证、长上下文代码协作"],
  ["最高频痛点", "上下文瓶颈、网络抖动、Token 消耗过快"],
  ["主套餐诉求", "主流模型 Token 统一结算，配合稳定的模型访问流量"],
  ["付费心理", "愿意为稳定、便利、可预期付费，但需要清晰的低门槛体验价"],
  ["验证方式", "围绕 Claude Code / Codex / Cursor 建立首批工作流案例和试用反馈"],
];

const recommendations = [
  "把 Token 统一结算作为主卖点，智能模型流量包作为第二层权益。",
  "面向 Agent 编程用户设计套餐页，不把它包装成泛 AI 工具包。",
  "用 200-500 元区间做可感知的入门/进阶梯度，再给重度用户更高额度。",
  "先验证 Claude Code、Codex、Cursor 三类工作流，记录网络稳定性和 Token 消耗曲线。",
  "把上下文/Rerank、专线稳定性和支付便利作为差异化指标，而不只比较模型价格。",
  "继续扩大样本量，并补充并发、使用时长、项目规模和具体 IDE 工作流数据。",
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

export default function OpcPackageSurveyPage() {
  return (
    <div className={styles.reportPage}>
      <section className={styles.hero} aria-labelledby="report-title">
        <div className={styles.heroCopy}>
          <Link href="/reports" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" strokeWidth={2} />
            研究与报告
          </Link>
          <p className="home-kicker">Survey Report · AI 编程与 OPC 套餐</p>
          <h1 id="report-title">2026 AI 编程现状及电信 OPC 套餐需求调研</h1>
          <p>
            这份报告基于 16 份有效问卷，整理常州 AI 交流群里开发者的模型选择、工具工作流、
            Token 消耗、核心痛点和电信 OPC / Coding Plan 套餐偏好。
          </p>
          <div className={styles.heroActions}>
            <Link href="/cooperate#lead-form" className="button home-primary-button">
              交流套餐共创
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="#product-recommendations" className="button home-ghost-button">
              查看产品建议
            </Link>
          </div>
        </div>

        <div className={styles.heroPanel} data-hero-number="16" aria-label="报告摘要">
          <span>样本摘要</span>
          <strong>AI 编程用户最想要的不是单一模型，而是稳定、统一、少折腾的访问与结算入口。</strong>
          <p>
            高 Token 消耗、Agent 工作流和 Claude Code 的高使用率，让套餐设计更适合从开发者工作流切入。
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
          eyebrow="Baseline"
          title="样本已经高度技术化，且进入 Agent 编程阶段"
          summary="受访者以开发者为主，Agent 模式和架构总控模式合计覆盖全部样本，说明这不是基础编程补全需求，而是复杂工程协作需求。"
        />
        <div className={styles.twoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <UsersRound aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>开发者角色分布</h3>
                <p>前端、后端、全栈开发者占 75%，是套餐定位的核心人群。</p>
              </div>
            </div>
            <PieChart
              title="开发者角色分布"
              center="16人"
              background="conic-gradient(#0f7a6a 0deg 270deg, #2f82ed 270deg 338deg, #ee7f18 338deg 360deg)"
              legend={roleLegend}
            />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <BrainCircuit aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>典型工作流</h3>
                <p>Agent 模式过半，剩余样本也在用架构/总控方式组织 AI 编程。</p>
              </div>
            </div>
            <PieChart
              title="典型工作流"
              center="Agent"
              background="conic-gradient(#0f7a6a 0deg 202deg, #2f82ed 202deg 360deg)"
              legend={workflowLegend}
            />
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Tools"
          title="Claude 模型与 Claude Code 是最清晰的入口"
          summary="模型层 Claude 系列领先，工具层 Claude Code 覆盖 81%；Codex 与 Cursor 也已经成为重要辅助工具。"
        />
        <div className={styles.twoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <Globe2 aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>主要模型使用</h3>
                <p>多模型并用明显，套餐需要兼容 Claude、GPT、MiniMax 等主流模型。</p>
              </div>
            </div>
            <BarChart items={modelItems} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <FileText aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>辅助工具使用</h3>
                <p>工具侧痛点可从 Claude Code、Codex、Cursor 三条工作流优先验证。</p>
              </div>
            </div>
            <BarChart items={toolItems} />
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Cost & Access"
          title="Token 消耗不低，但月支出仍偏克制"
          summary="75% 月均 Token 消耗在 1 亿到 10 亿之间，但 63% 的月支出低于 500 元，说明价格、支付和稳定性都会影响采用。"
        />
        <div className={styles.threeColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <Router aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>模型访问偏好</h3>
                <p>官方 API、IDE 内置服务和专线/中转平台各占 31%。</p>
              </div>
            </div>
            <BarChart items={accessItems} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <Gauge aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>月均 Token 消耗</h3>
                <p>没有纯入门低消耗用户，样本整体偏中高频。</p>
              </div>
            </div>
            <BarChart items={tokenItems} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <WalletCards aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>月 AI 工具支出</h3>
                <p>大多数用户仍在 500 元以下区间，适合设计清晰的阶梯套餐。</p>
              </div>
            </div>
            <BarChart items={spendItems} />
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Pain Points"
          title="核心痛点不是单点价格，而是工作流稳定性"
          summary="上下文瓶颈、网络抖动、Token 消耗和多 Agent 结算复杂共同出现，说明套餐需要同时解决访问、额度和体验预期。"
        />
        <div className={styles.twoColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <Cable aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>当前主要痛点</h3>
                <p>上下文与网络问题比单纯 Token 焦虑更靠前。</p>
              </div>
            </div>
            <BarChart items={painItems} />
            <div className={styles.insightBox}>
              Claude Code 用户报告的痛点覆盖最广，尤其集中在上下文、Token 和网络稳定性。
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <PackageCheck aria-hidden="true" strokeWidth={1.8} />
              <div>
                <h3>套餐内容期待</h3>
                <p>Token 统一结算是最强需求，其次是智能模型流量包。</p>
              </div>
            </div>
            <BarChart items={packageItems} />
            <div className={styles.insightBox}>
              IDE 算力绑定和静态 IP / 内网穿透适合作为进阶权益，不宜抢主套餐叙事。
            </div>
          </article>
        </div>
      </section>

      <section className={styles.reportSection} id="product-recommendations">
        <SectionHeading
          eyebrow="Product Design"
          title="套餐设计建议"
          summary="更合适的方向是“开发者 Agent 编程专用包”，围绕统一结算、稳定访问和工作流案例做产品化验证。"
        />
        <div className={styles.courseLayout}>
          <article className={styles.profilePanel}>
            <h3>产品画像</h3>
            <table>
              <tbody>
                {productProfile.map(([label, value]) => (
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
              {recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className={styles.reportSection}>
        <SectionHeading
          eyebrow="Pricing Signals"
          title="价格偏好里，稳定和便利同样重要"
          summary="开放回答没有形成单一价格锚点，但能看到低门槛、稳定体验、优质模型和支付便利几个共同信号。"
        />
        <article className={styles.quotePanel}>
          <h3>定价信号</h3>
          {pricingSignals.map((item) => (
            <blockquote key={item}>{item}</blockquote>
          ))}
        </article>
      </section>

      <footer className={styles.reportFooter}>
        <span>报告生成时间：2026 年 4 月 9 日</span>
        <span>样本量：16 份有效问卷</span>
        <span>调研渠道：常州 AI 交流群与线下活动</span>
      </footer>
    </div>
  );
}
