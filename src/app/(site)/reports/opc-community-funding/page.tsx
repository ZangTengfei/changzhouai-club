import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  LineChart,
  Landmark,
  MapPin,
  Network,
  Presentation,
  Rocket,
  ShieldCheck,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { DeckControls } from "./deck-controls";
import styles from "./opc-community-funding-page.module.css";

export const metadata: Metadata = {
  title: "常州科教城 OPC 共创社区运营经费申请汇报",
  description:
    "常州 AI Club 面向常州科教城的 OPC 共创社区运营经费申请网页演示稿，覆盖社区介绍、已有基础、园区价值、场地需求、年度计划和经费预算。",
};

const slideTotal = 15;

const overviewMetrics = [
  { value: "300+", label: "全网成员", detail: "本地 AI 从业者与爱好者", icon: UsersRound },
  { value: "7+", label: "线下活动", detail: "2026 年 1 月起稳定组织", icon: CalendarDays },
  { value: "3", label: "公开调研/报告", detail: "课程、AI 编程与 OPC 套餐", icon: FileText },
  { value: "50+50", label: "申请机制", detail: "启动资金 + KPI 追加", icon: WalletCards },
] as const;

const requestCards = [
  {
    title: "一个固定运营场地",
    summary: "会议室、路演厅、办公室/运营位和社区标识，用来承接活动、项目对接和日常运营。",
    icon: MapPin,
  },
  {
    title: "首期 50 万启动经费",
    summary: "先跑通活动、内容、成员运营、场景拆解和项目跟进这套基础闭环。",
    icon: CircleDollarSign,
  },
  {
    title: "达标后追加到 100 万年度包",
    summary: "以季度 KPI 复盘为依据，围绕活动、人群、场景、项目和传播结果释放后续资金。",
    icon: LineChart,
  },
] as const;

const whyNowCards = [
  ["AI 应用进入落地期", "企业不再只关心模型概念，而是关心流程、数据、成本、交付和责任边界。"],
  ["OPC 适合常州中小场景", "独立实践者和小团队可以用更轻的方式服务碎片化、定制化、本地化需求。"],
  ["科教城需要生态抓手", "园区需要一个持续聚集 AI 人才、企业需求和项目样板的开放入口。"],
] as const;

const timeline = [
  ["2025 年中", "社区开始形成", "从常州本地 AI 交流群和线下连接起步。"],
  ["2026.01", "线下活动启动", "从第 1 场线下交流开始形成稳定见面节奏。"],
  ["2026.03", "项目与 OPC 议题进入活动", "围绕 AI 应用探索、技术落地、电信 OPC 生态展开讨论。"],
  ["2026.04", "官网与共建机制成形", "上线社区网站，沉淀活动、成员、项目、报告和合作入口。"],
  ["2026.05", "真实商机拆解", "金坛 OPC 交流围绕招商、制造质检、融媒体 AI 应用做需求拆解。"],
] as const;

const memberGroups = [
  ["技术与产品", "软件工程师、全栈开发、AI 工具开发者、Agent/RAG 实践者。"],
  ["产业与企业", "制造、电商、新能源、医药、建筑设计、供应链、媒体等一线从业者。"],
  ["政企与资源", "电信、职业院校、政企服务、园区合作方和本地项目资源方。"],
  ["内容与运营", "新媒体、社群运营、课程共建、活动组织和内容传播伙伴。"],
] as const;

const eventProof = [
  {
    date: "2026.03.21",
    title: "AI 应用探索与产业合作",
    detail: "电信 AI 战略、OPC 生态、行业知识库、跨组织数据共享等议题进入社区讨论。",
  },
  {
    date: "2026.04.11",
    title: "政企 AI 项目开发主题沙龙",
    detail: "围绕政企项目、无人机、制造业、职业院校 AI 人才培养等本地场景拆解。",
  },
  {
    date: "2026.04.25",
    title: "AI 落地实战",
    detail: "近 20 位跨行业伙伴到场，覆盖软件、政企、芯片、医药、新能源、自媒体、制造等背景。",
  },
  {
    date: "2026.05.23",
    title: "金坛 OPC 线下交流",
    detail: "围绕招商 AI 销售助手、制造 AI 质检、融媒体 AI 应用三类真实商机展开。",
  },
] as const;

const proofObjects = [
  ["社区网站", "成员展示、活动记录、项目协作、合作联系、研究报告等入口已上线。"],
  ["公开报告", "培训需求、AI 办公课、AI 编程与 OPC 套餐调研，服务课程和合作设计。"],
  ["商机卡片", "对招商、制造质检、融媒体等场景形成首轮需求问题和能力画像。"],
  ["共建规则", "明确普通成员、共建者、核心共建者的边界、贡献和协作方式。"],
] as const;

const loopSteps = [
  ["聚集人群", "活动、社群、官网、内容传播"],
  ["提升能力", "工具实践、课程、案例拆解"],
  ["导入场景", "企业走访、园区需求、电信商机"],
  ["组队共创", "共建者、OPC、项目负责人"],
  ["验证转化", "Demo、PoC、签约、复盘"],
] as const;

const parkValues = [
  ["人才入口", "把散落在常州和长三角的 AI 开发者、产品人、创业者、业务专家聚到科教城。"],
  ["企业服务抓手", "为园区企业提供 AI 场景识别、需求诊断、工具实践和项目试点入口。"],
  ["招商与品牌", "形成“科教城支持 AI 创业与 OPC 共创”的可传播样板，增强园区吸引力。"],
  ["项目转化", "把活动热度转成场景清单、试点 Demo、OPC 孵化和本地服务团队。"],
] as const;

const spaceNeeds = [
  ["会议室", "承接 20-40 人沙龙、工作坊、需求拆解会。"],
  ["路演厅", "承接 Demo Day、项目发布、企业场景共创营。"],
  ["办公室/运营位", "支撑报名、内容、项目跟进、资料沉淀和对接协调。"],
  ["社区标识", "形成长期可见的 AI 生态节点，而不是临时借场办活动。"],
] as const;

const annualProgram = [
  ["社区沙龙", "24 场", "保持稳定线下连接，持续吸引成员和真实话题。"],
  ["工具实践课", "12 场", "围绕 AI 办公、Agent、RAG、AI 编程、内容工作流等。"],
  ["场景拆解会", "8 场", "邀请企业/园区需求方，把模糊需求拆成可推进任务。"],
  ["共创营/Hackathon", "2-3 场", "围绕明确场景组队做 Demo、PoC 或项目原型。"],
  ["Demo Day", "2-3 场", "集中展示阶段成果，为园区传播和项目转化服务。"],
] as const;

const budgetRows = [
  ["社区运营团队", "36 万", "负责人、运营、内容、项目协调"],
  ["活动体系", "18 万", "沙龙、场景拆解、Demo Day"],
  ["培训与工具实践", "12 万", "AI 工具课、课程研发、助教支持"],
  ["Hackathon / 共创营", "12 万", "2-3 场集中共创与成果展示"],
  ["内容与传播", "8 万", "官网、公众号/视频、活动复盘"],
  ["项目孵化与商务支持", "8 万", "需求筛选、方案跟进、对接协调"],
  ["社区基金 / 机动", "6 万", "共建激励、应急和补充采购"],
] as const;

const kpis = [
  ["活动", "完成 20+ 场阶段活动，形成稳定月度节奏"],
  ["人群", "触达 500+ 人次，深度参与 100+ 人"],
  ["共建", "形成 10+ 稳定共建者，明确分工和贡献记录"],
  ["场景", "收集 15+ 企业/园区场景，深度拆解 6+ 个"],
  ["项目", "孵化 3+ 个 Demo/PoC，推动 1-2 个商务落地线索"],
] as const;

const governanceItems = [
  ["科教城", "提供场地、年度资金、官方背书、企业和政策资源对接。"],
  ["社区运营方", "负责活动、内容、成员、课程、场景拆解、项目初筛与共建组织。"],
  ["项目资源方", "导入业务场景、商机线索、算力/云/商务资源，参与项目落地。"],
] as const;

const sourceNotes = [
  "来源：社区官网、活动公开页、社区知识库活动档案与运营方案草稿。",
  "口径：已完成事实、当前公开数据和年度 KPI 分开表达；预算为年度运营包设计。",
];

function SlideFrame({
  index,
  eyebrow,
  title,
  summary,
  children,
  tone = "green",
}: {
  index: number;
  eyebrow: string;
  title: string;
  summary?: string;
  children: ReactNode;
  tone?: "green" | "blue" | "orange" | "dark";
}) {
  return (
    <section
      id={`slide-${index}`}
      className={`${styles.slide} ${styles[tone] ?? ""}`}
      data-deck-slide
      data-active-slide="false"
      aria-labelledby={`slide-title-${index}`}
    >
      <div className={styles.slideHeader}>
        <div>
          <p>{eyebrow}</p>
          <h2 id={`slide-title-${index}`}>{title}</h2>
          {summary ? <span>{summary}</span> : null}
        </div>
        <strong>
          {String(index).padStart(2, "0")}/{String(slideTotal).padStart(2, "0")}
        </strong>
      </div>
      <div className={styles.slideBody}>{children}</div>
    </section>
  );
}

function IconCard({
  title,
  summary,
  icon: Icon,
}: {
  title: string;
  summary: string;
  icon: LucideIcon;
}) {
  return (
    <article className={styles.iconCard}>
      <Icon aria-hidden="true" strokeWidth={1.8} />
      <h3>{title}</h3>
      <p>{summary}</p>
    </article>
  );
}

export default function OpcCommunityFundingPage() {
  return (
    <div
      className={styles.deckPage}
      data-deck-root
      role="application"
      aria-label="OPC 共创社区运营经费申请演示稿"
    >
      <DeckControls />

      <section className={`${styles.slide} ${styles.coverSlide}`} data-deck-slide data-active-slide="true">
        <div className={styles.coverChrome}>
          <Link href="/reports" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" strokeWidth={2} />
            研究与报告
          </Link>
          <span>2026 年度运营经费申请</span>
        </div>
        <div className={styles.coverLayout}>
          <div className={styles.coverCopy}>
            <p>常州科教城 · OPC 共创社区</p>
            <h1>把 AI 人才、企业场景和项目落地组织到同一个现场</h1>
            <div className={styles.coverAsk}>
              <span>申请固定运营场地</span>
              <span>首期 50 万启动经费</span>
              <span>达标追加至 100 万年度运营包</span>
            </div>
          </div>
          <div className={styles.coverPanel}>
            <strong>OPC Community</strong>
            <p>
              不是一次性活动经费，而是建设一个持续聚人、拆场景、做 Demo、
              转项目的本地 AI 生态节点。
            </p>
          </div>
        </div>
      </section>

      <SlideFrame
        index={2}
        eyebrow="Executive Summary"
        title="本次申请要解决三个问题"
        summary="有空间承接人，有资金跑闭环，有 KPI 管结果。"
      >
        <div className={styles.cardGrid3}>
          {requestCards.map((item) => (
            <IconCard key={item.title} {...item} />
          ))}
        </div>
        <div className={styles.metricStrip}>
          {overviewMetrics.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.label}>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </article>
            );
          })}
        </div>
      </SlideFrame>

      <SlideFrame
        index={3}
        eyebrow="Why Now"
        title="AI 落地窗口期，需要一个本地生态组织者"
        summary="单个企业缺人才，单个开发者缺场景，园区需要把两端组织起来。"
        tone="blue"
      >
        <div className={styles.argumentLayout}>
          <div className={styles.bigNumber}>
            <span>01</span>
            <strong>生态节点</strong>
            <p>科教城可以成为常州 AI 创业与 OPC 共创的第一个稳定线下节点。</p>
          </div>
          <div className={styles.stackList}>
            {whyNowCards.map(([title, summary]) => (
              <article key={title}>
                <CheckCircle2 aria-hidden="true" strokeWidth={1.8} />
                <div>
                  <h3>{title}</h3>
                  <p>{summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SlideFrame>

      <SlideFrame
        index={4}
        eyebrow="Community Identity"
        title="社区定位：连接器、加速器、放大器"
        summary="常州 AI Club / OPC 共创社区立足常州，面向真实场景、项目落地和独立实践。"
      >
        <div className={styles.identityGrid}>
          <article className={styles.identityLead}>
            <Network aria-hidden="true" strokeWidth={1.7} />
            <h3>从兴趣交流走向项目共创</h3>
            <p>
              社区把散落在不同公司、行业和微信群里的 AI 实践者重新组织起来，
              让分享发生、项目成形、合作落地。
            </p>
          </article>
          <article>
            <h3>发起与共建基础</h3>
            <p>
              社区由本地 AI 实践者发起，围绕 AI 编程、Agent、知识库、企业应用、
              内容工作流和 OPC 独立实践持续组织活动与内容沉淀。
            </p>
          </article>
          <article>
            <h3>当前工作重点</h3>
            <p>
              线下交流、成员地图、公开报告、项目协作、企业合作、课程培训和共建者机制。
            </p>
          </article>
        </div>
      </SlideFrame>

      <SlideFrame
        index={5}
        eyebrow="Track Record"
        title="从线下见面，到内容沉淀，再到商机拆解"
        summary="已有基础不是从零申请，而是把已经跑出来的社区能力系统化。"
        tone="orange"
      >
        <div className={styles.timeline}>
          {timeline.map(([date, title, detail]) => (
            <article key={`${date}-${title}`}>
              <span>{date}</span>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </SlideFrame>

      <SlideFrame
        index={6}
        eyebrow="People"
        title="成员构成覆盖 AI 落地所需的多类角色"
        summary="不是单一开发者群，而是技术、产业、政企、运营混合的本地网络。"
      >
        <div className={styles.cardGrid4}>
          {memberGroups.map(([title, summary]) => (
            <article className={styles.textCard} key={title}>
              <h3>{title}</h3>
              <p>{summary}</p>
            </article>
          ))}
        </div>
        <div className={styles.calloutBand}>
          <UsersRound aria-hidden="true" strokeWidth={1.8} />
          <p>
            审批重点不是“有多少人进群”，而是社区能否把人群转化为活动参与、能力共建、
            企业场景拆解和项目交付候选人。
          </p>
        </div>
      </SlideFrame>

      <SlideFrame
        index={7}
        eyebrow="Evidence"
        title="连续活动已经证明：真实需求愿意进入社区"
        summary="活动不是泛泛交流，而是在不断接近本地 AI 项目和产业场景。"
        tone="blue"
      >
        <div className={styles.eventGrid}>
          {eventProof.map((event) => (
            <article key={event.date}>
              <span>{event.date}</span>
              <h3>{event.title}</h3>
              <p>{event.detail}</p>
            </article>
          ))}
        </div>
      </SlideFrame>

      <SlideFrame
        index={8}
        eyebrow="Assets"
        title="社区已经开始沉淀可复用资产"
        summary="这些资产让运营经费可被管理、可被复盘、可被放大。"
      >
        <div className={styles.proofLayout}>
          {proofObjects.map(([title, summary], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{summary}</p>
            </article>
          ))}
        </div>
      </SlideFrame>

      <SlideFrame
        index={9}
        eyebrow="Operating Model"
        title="运营闭环：连接人，提升能力，拆解场景，落地项目"
        summary="100 万年度包买的不是活动热闹，而是一套可持续的转化系统。"
        tone="dark"
      >
        <div className={styles.loop}>
          {loopSteps.map(([title, summary], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{summary}</p>
            </article>
          ))}
        </div>
      </SlideFrame>

      <SlideFrame
        index={10}
        eyebrow="Park Value"
        title="给科教城带来的价值：入口、抓手、样板、转化"
        summary="社区运营成果可以反哺园区招商、企业服务、人才连接和品牌传播。"
      >
        <div className={styles.valueGrid}>
          {parkValues.map(([title, summary]) => (
            <article key={title}>
              <Landmark aria-hidden="true" strokeWidth={1.8} />
              <h3>{title}</h3>
              <p>{summary}</p>
            </article>
          ))}
        </div>
      </SlideFrame>

      <SlideFrame
        index={11}
        eyebrow="Space"
        title="为什么需要固定运营场地"
        summary="临时借场可以办活动，固定场地才能建立信任、节奏和项目承接能力。"
        tone="orange"
      >
        <div className={styles.spaceLayout}>
          <article className={styles.spaceLead}>
            <Building2 aria-hidden="true" strokeWidth={1.7} />
            <h3>场地是社区可信度的基础设施</h3>
            <p>
              企业需求方、项目负责人、共建者和园区资源需要一个可以反复回到的线下现场。
              场地本身就是科教城 AI 生态存在感的一部分。
            </p>
          </article>
          <div className={styles.spaceList}>
            {spaceNeeds.map(([title, summary]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{summary}</p>
              </article>
            ))}
          </div>
        </div>
      </SlideFrame>

      <SlideFrame
        index={12}
        eyebrow="Annual Program"
        title="年度活动不是堆场次，而是分层设计"
        summary="公开活动吸引人，实战课程提升能力，场景拆解和共创营负责转化。"
        tone="blue"
      >
        <div className={styles.programTable}>
          {annualProgram.map(([name, count, summary]) => (
            <article key={name}>
              <strong>{count}</strong>
              <h3>{name}</h3>
              <p>{summary}</p>
            </article>
          ))}
        </div>
      </SlideFrame>

      <SlideFrame
        index={13}
        eyebrow="Budget"
        title="经费机制：50 万启动，达标后追加到 100 万年度包"
        summary="把审批风险拆开，同时保留完整年度运营闭环。"
      >
        <div className={styles.budgetLayout}>
          <article className={styles.fundingCard}>
            <span>Phase 1</span>
            <strong>50 万</strong>
            <p>用于启动团队、活动、内容、场地运营和首批场景拆解。</p>
          </article>
          <article className={styles.fundingCard}>
            <span>Phase 2</span>
            <strong>+50 万</strong>
            <p>按季度 KPI 达成后追加，用于共创营、项目孵化和传播放大。</p>
          </article>
          <div className={styles.budgetTable}>
            {budgetRows.map(([item, amount, note]) => (
              <div key={item}>
                <span>{item}</span>
                <strong>{amount}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
        </div>
      </SlideFrame>

      <SlideFrame
        index={14}
        eyebrow="KPI & Governance"
        title="用阶段 KPI 和治理机制管住投入产出"
        summary="经费不是一次性拨完，而是按可复盘成果继续释放。"
        tone="dark"
      >
        <div className={styles.kpiLayout}>
          <div className={styles.kpiList}>
            {kpis.map(([label, value]) => (
              <article key={label}>
                <span>{label}</span>
                <p>{value}</p>
              </article>
            ))}
          </div>
          <div className={styles.governanceList}>
            {governanceItems.map(([role, responsibility]) => (
              <article key={role}>
                <ShieldCheck aria-hidden="true" strokeWidth={1.8} />
                <div>
                  <h3>{role}</h3>
                  <p>{responsibility}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SlideFrame>

      <SlideFrame
        index={15}
        eyebrow="Next Step"
        title="建议启动方式：先建节点，再跑闭环，再做标杆"
        summary="先拿到确定场地和首期经费，90 天内交付可复盘的第一阶段成果。"
      >
        <div className={styles.nextLayout}>
          <article>
            <Presentation aria-hidden="true" strokeWidth={1.8} />
            <h3>第 1 步：确认场地与对接人</h3>
            <p>明确会议室、路演厅、运营位、社区标识和科教城生态对接人。</p>
          </article>
          <article>
            <Rocket aria-hidden="true" strokeWidth={1.8} />
            <h3>第 2 步：拨付首期 50 万</h3>
            <p>启动团队、排期、内容、成员共建和首批企业场景拆解。</p>
          </article>
          <article>
            <BarChart3 aria-hidden="true" strokeWidth={1.8} />
            <h3>第 3 步：季度复盘追加预算</h3>
            <p>对照活动、人群、场景、项目和传播 KPI，决定后续资金释放。</p>
          </article>
        </div>
        <div className={styles.sourceNotes}>
          {sourceNotes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
        <Link href="/cooperate" className={`${styles.finalLink} button home-primary-button`}>
          进入合作联系
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </Link>
      </SlideFrame>
    </div>
  );
}
