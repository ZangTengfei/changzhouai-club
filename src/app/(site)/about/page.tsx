import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  Network,
  Palette,
  Sparkles,
} from "lucide-react";

import { DoodleSparkles } from "@/components/home-visual-assets";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { cn } from "@/lib/utils";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "关于我们",
  description: "了解常州 AI Club 的定位、初心和长期运营方向。",
  path: "/about",
});

const designThoughts = [
  {
    title: "连接、节点、社区",
    summary: "Logo 用圆点和连线表达本地 AI 人之间不断产生的新连接。",
    icon: Network,
  },
  {
    title: "C + Z 的城市暗号",
    summary: "图形的负空间隐含 Changzhou 的 C 与 Z，也代表常州这座城市。",
    icon: CircleDot,
  },
  {
    title: "绿色到橙色的能量",
    summary: "绿色代表生长与行动，橙色代表灵感、开放和持续共创。",
    icon: Palette,
  },
] as const;

const longTermDirections = [
  {
    title: "让真实问题进入社区",
    summary: "从成员实践、企业场景和线下活动里持续发现值得验证的 AI 问题。",
  },
  {
    title: "让共建协作形成原型",
    summary: "把 OPC、开发者、产品人、场景方和内容运营组织到具体任务里。",
  },
  {
    title: "让试点经验变成资产",
    summary: "从一次交流延伸到 PoC、案例复盘、交付模板和可复用实践资产。",
  },
] as const;

const numberedCardToneClassNames = [
  "bg-[#e9f9f0] after:bg-[rgba(var(--accent-rgb),0.08)]",
  "bg-[#fff2e5] after:bg-[rgba(238,127,24,0.11)]",
  "bg-[#f3efff] after:bg-[rgba(42,123,211,0.1)]",
] as const;

const numberedCardAccentClassNames = [
  "text-primary",
  "text-[#ee7f18]",
  "text-[#2a7bd3]",
] as const;

const numberedCardClassName =
  "relative grid min-h-[190px] content-start gap-2 overflow-hidden rounded-[var(--radius-lg)] p-[22px] after:absolute after:right-[-24px] after:bottom-[-30px] after:size-[118px] after:rounded-[var(--radius-pill)] after:content-[''] max-sm:p-5";

export default function AboutPage() {
  return (
    <div className="grid gap-7 max-sm:gap-[22px]">
      <section
        className="grid grid-cols-[minmax(0,0.88fr)_minmax(440px,1.12fr)] items-start gap-8 pt-6 pb-2 max-lg:grid-cols-1 max-sm:pt-0"
        aria-labelledby="about-hero-title"
      >
        <div className="grid content-start gap-5 pt-[42px] max-lg:pt-2.5 max-sm:gap-[18px] max-sm:pt-[18px]">
          <p className="home-kicker">About · 关于我们</p>
          <h1
            id="about-hero-title"
            className="m-0 text-[3.85rem] leading-[1.1] font-[880] tracking-normal text-[#111b1f] after:block after:h-[13px] after:w-[min(190px,44vw)] after:-rotate-3 after:rounded-[50%] after:border-[3px] after:border-transparent after:border-t-[rgba(244,190,75,0.78)] after:content-[''] after:[margin:-6px_0_0_42%] max-lg:text-[3.35rem] max-sm:text-[2.72rem] max-sm:after:ml-[36%] max-sm:after:w-[154px]"
          >
            一个把真实问题、
            <span className="block text-primary">AI 能力和本地场景连接起来的社区</span>
          </h1>
          <p className="m-0 max-w-[34rem] text-[1.08rem] leading-[1.84] text-[rgba(var(--ink-rgb),0.72)]">
            常州 AI Club 立足常州，面向实践与共建。我们希望把散落在不同公司、
            行业和微信群里的 AI 人组织到同一个现场，让问题被看见、原型被做出、
            试点被推进，经验被沉淀。
          </p>

          <div className="flex flex-wrap items-center gap-3.5 max-sm:gap-2.5 [&_svg]:size-[18px]">
            <Link href="/join" className="button home-primary-button">
              申请加入
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/events" className="button home-ghost-button">
              参加活动
            </Link>
          </div>

          <div className="mt-2 grid w-fit max-w-[35rem] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] bg-[#fff2e5] px-4 py-3.5 max-sm:w-full max-sm:grid-cols-1">
            <Sparkles className="size-7 text-[#f4c75d]" aria-hidden="true" strokeWidth={1.9} />
            <span className="text-[0.92rem] leading-[1.48] font-bold text-[rgba(var(--ink-rgb),0.64)]">连接・验证・共创，是社区长期坚持的三个动作。</span>
          </div>
        </div>

        <div className="relative min-h-[548px] overflow-hidden rounded-[var(--radius-lg)] bg-[#edf5ff] p-5 max-[820px]:min-h-0 max-[820px]:p-[22px]" aria-label="Logo 设计理念">
          <div className="relative z-[2] grid min-h-[360px] place-content-center justify-items-center rounded-[var(--radius-lg)] bg-white p-7 shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-sm:p-5">
            <div className="mb-[22px] grid size-[172px] place-items-center max-sm:size-[132px]">
              <SiteLogoMark className="block size-full object-contain" />
            </div>
            <strong className="text-[2.8rem] leading-[1.08] font-black tracking-normal text-[#111b1f]">常州 AI Club</strong>
            <span className="mt-2 font-[var(--font-latin-rounded)] text-[0.98rem] font-[850] tracking-normal text-[rgba(var(--ink-rgb),0.62)] max-sm:text-[0.72rem]">CHANGZHOU AI CLUB</span>
          </div>

          <div className="relative z-[2] mt-[18px] flex flex-wrap items-center justify-center gap-2.5 [&_i]:h-px [&_i]:w-7 [&_i]:bg-[rgba(var(--accent-rgb),0.32)] [&_span]:inline-flex [&_span]:min-h-[38px] [&_span]:items-center [&_span]:rounded-[var(--radius-pill)] [&_span]:border [&_span]:border-[rgba(var(--accent-rgb),0.14)] [&_span]:bg-[rgba(255,252,247,0.86)] [&_span]:px-3.5 [&_span]:text-[0.9rem] [&_span]:font-black [&_span]:text-[var(--accent-strong)]">
            <span>连接</span>
            <i aria-hidden="true" />
            <span>C + Z</span>
            <i aria-hidden="true" />
            <span>社区</span>
          </div>

          <div className="relative z-[2] mx-auto mt-4 grid w-fit max-w-[min(100%,320px)] -rotate-1 gap-1.5 rounded-[var(--radius-md)] border border-[rgba(229,175,70,0.32)] bg-[rgba(255,242,184,0.78)] px-4 pt-3 pb-3.5 shadow-[var(--shadow-md)] max-[820px]:mb-[18px] max-[820px]:max-w-none max-[820px]:rotate-0">
            <span className="text-[0.78rem] font-black text-[#a7602f]">Logo 设计</span>
            <strong className="text-[0.95rem] leading-[1.42] text-[#24322d]">节点连接形成 CZ，也形成社区关系网</strong>
          </div>
          <DoodleSparkles className="absolute top-32 right-[218px] z-[3] w-[54px] rotate-12 text-[#f4c75d] max-[820px]:top-[34px] max-[820px]:right-7" />
        </div>
      </section>

      <section className="grid gap-5 pt-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[18px] max-sm:grid-cols-1 max-sm:gap-3">
          <p className="home-kicker">Identity</p>
          <div>
            <h2 className="m-0 text-[2.55rem] leading-[1.08] font-black tracking-normal text-[#111a1d]">Logo 背后的社区理念</h2>
            <p className="mt-2 mb-0 max-w-3xl font-semibold text-[rgba(var(--ink-rgb),0.66)]">这套标识的核心不是图形本身，而是一套关于连接的解释。</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-[820px]:grid-cols-1">
          {designThoughts.map((item, index) => {
            const Icon = item.icon;

            return (
              <article className={cn(numberedCardClassName, numberedCardToneClassNames[index])} key={item.title}>
                <span className={cn("text-[2rem] leading-none font-black", numberedCardAccentClassNames[index])}>{String(index + 1).padStart(2, "0")}</span>
                <Icon className={cn("relative z-[1] mt-2.5 size-9", numberedCardAccentClassNames[index])} aria-hidden="true" strokeWidth={1.8} />
                <h3 className="relative z-[1] m-0 text-[1.24rem] leading-[1.18] text-[#111a1d]">{item.title}</h3>
                <p className="relative z-[1] m-0 text-[0.94rem] leading-[1.68] text-[rgba(var(--ink-rgb),0.64)]">{item.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 pt-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[18px] max-sm:grid-cols-1 max-sm:gap-3">
          <p className="home-kicker">Direction</p>
          <div>
            <h2 className="m-0 text-[2.55rem] leading-[1.08] font-black tracking-normal text-[#111a1d]">我们希望长期形成什么</h2>
            <p className="mt-2 mb-0 max-w-3xl font-semibold text-[rgba(var(--ink-rgb),0.66)]">不是一次性的活动群，而是能持续沉淀问题、成员、项目和方法的本地网络。</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-[820px]:grid-cols-1">
          {longTermDirections.map((item, index) => (
            <article className={cn(numberedCardClassName, numberedCardToneClassNames[index])} key={item.title}>
              <span className={cn("relative z-[1] text-[2rem] leading-none font-black", numberedCardAccentClassNames[index])}>{String(index + 1).padStart(2, "0")}</span>
              <h3 className="relative z-[1] m-0 text-[1.24rem] leading-[1.18] text-[#111a1d]">{item.title}</h3>
              <p className="relative z-[1] m-0 text-[0.94rem] leading-[1.68] text-[rgba(var(--ink-rgb),0.64)]">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[22px] rounded-[var(--radius-lg)] bg-white p-7 shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-lg:grid-cols-1 max-sm:p-5">
        <div>
          <p className="home-kicker">Next</p>
          <h2 className="mt-2.5 mb-0 text-[2.25rem] leading-[1.12] font-black tracking-normal text-[#111a1d]">如果你也在常州关注 AI，欢迎把问题和能力带进来</h2>
          <p className="mt-3 mb-0 leading-[1.72] text-[rgba(var(--ink-rgb),0.66)]">你可以从参加活动、公开成员主页、提交真实场景或参与项目协作开始。</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 max-lg:justify-start max-sm:gap-2.5 [&_svg]:size-[18px]">
          <Link href="/join" className="button home-primary-button">
            申请加入
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
          <Link href="/cooperate" className="button home-ghost-button">
            合作联系
          </Link>
        </div>
      </section>
    </div>
  );
}
