import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  IdCard,
  MessageCircle,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { hasSupabaseEnv } from "@/lib/env";
import { joinSteps, siteNameEn } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/server";

const joinSectionHeadingClassName =
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[18px] max-sm:grid-cols-1 max-sm:gap-3 [&_h2]:m-0 [&_h2]:text-[clamp(2rem,3.4vw,2.55rem)] [&_h2]:leading-[1.08] [&_h2]:font-black [&_h2]:tracking-normal [&_h2]:text-[#111a1d] [&_div>p]:mt-2 [&_div>p]:mb-0 [&_div>p]:max-w-3xl [&_div>p]:font-semibold [&_div>p]:text-[rgba(var(--ink-rgb),0.66)]";
const profilePanelClassName =
  "grid min-w-0 content-start gap-[18px] rounded-[var(--radius-lg)] bg-white p-6 shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-sm:p-5 [&_h3]:mt-1.5 [&_h3]:mb-0 [&_h3]:text-[clamp(1.55rem,2.4vw,2rem)] [&_h3]:leading-[1.12] [&_h3]:font-black [&_h3]:tracking-normal [&_h3]:text-[#111a1d]";

export const metadata: Metadata = {
  title: "加入我们",
  description: "了解如何加入常州 AI Club，参与线下活动、项目协作和长期共建。",
};

const onboardingPath = "/account?onboarding=1";

const requiredFields = [
  {
    title: "显示名",
    summary: "会出现在社区账号、报名记录和成员资料里。",
    icon: IdCard,
  },
] as const;

const optionalFields = [
  "微信号",
  "所在城市",
  "身份 / 公司 / 学校",
  "每月可投入时间",
  "技能方向",
  "感兴趣的 AI 主题",
  "是否愿意参加线下活动",
  "是否愿意分享",
  "是否愿意参与项目",
] as const;

const coBuilderSignals = [
  {
    title: "说明参与方向",
    summary: "在个人资料中说明你愿意参与的工作，以及目前可以投入的时间。",
    icon: MessageCircle,
  },
  {
    title: "表达意向",
    summary: "在个人资料里补充参与方向、可投入时间和你愿意从哪类小任务开始。",
    icon: UsersRound,
  },
  {
    title: "从小任务开始",
    summary: "活动记录、内容整理、嘉宾推荐、项目讨论或现场协助，都可以成为第一步。",
    icon: Sparkles,
  },
] as const;

export default async function JoinPage() {
  const enabled = hasSupabaseEnv();
  let isLoggedIn = false;

  if (enabled) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  const primaryHref = isLoggedIn
    ? onboardingPath
    : `/login?next=${encodeURIComponent(onboardingPath)}`;
  const primaryLabel = isLoggedIn ? "前往完善资料" : "登录或注册后加入";

  return (
    <div className="grid gap-7 max-sm:gap-[22px]">
      <section className="grid grid-cols-[minmax(0,0.88fr)_minmax(440px,1.12fr)] items-start gap-8 pt-6 pb-2 max-lg:grid-cols-1 max-sm:pt-0" aria-labelledby="join-hero-title">
        <div className="grid content-start gap-5 pt-[42px] max-lg:pt-2.5 max-sm:gap-[18px] max-sm:pt-[18px]">
          <p className="home-kicker">Join · 加入社区</p>
          <h1 className="m-0 text-[clamp(2.65rem,4.6vw,4rem)] leading-[1.1] font-[880] tracking-normal text-[#111b1f] after:block after:h-[13px] after:w-[min(190px,44vw)] after:-rotate-3 after:rounded-[50%] after:border-[3px] after:border-transparent after:border-t-[rgba(244,190,75,0.78)] after:content-[''] after:[margin:-6px_0_0_42%] max-sm:text-[clamp(2.5rem,14vw,3.5rem)] max-sm:after:ml-[36%] max-sm:after:w-[154px]" id="join-hero-title">
            先建立身份，
            <span className="block text-primary">再走进真实连接</span>
          </h1>
          <p className="m-0 max-w-[34rem] text-[clamp(0.98rem,1.18vw,1.08rem)] leading-[1.84] text-[rgba(var(--ink-rgb),0.72)]">
            加入流程已经统一为“先登录，再完善资料”。你的社区身份、活动记录和个人资料
            会沉淀在同一个账号里，后续也能持续更新。
          </p>

          <div className="flex flex-wrap items-center gap-3.5 max-sm:gap-2.5 [&_svg]:size-[18px]">
            <Link href={primaryHref} prefetch={false} className="button home-primary-button">
              {primaryLabel}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/members" prefetch={false} className="button home-ghost-button">
              先看看社区成员
            </Link>
          </div>

          <div className="mt-2 grid w-fit max-w-[35rem] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] bg-[#fff2e5] px-4 py-3.5 max-sm:w-full max-sm:grid-cols-1">
            <CheckCircle2 className="size-7 text-[#f4c75d]" aria-hidden="true" strokeWidth={1.9} />
            <span className="text-[0.92rem] leading-[1.48] font-bold text-[rgba(var(--ink-rgb),0.64)]">
              开发者、产品人、创业者、高校同学、企业从业者，以及正在尝试独立业务的实践者，
              都可以从这里加入。
            </span>
          </div>
        </div>

        <div className="relative min-h-[548px] overflow-hidden rounded-[var(--radius-lg)] bg-white p-7 shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-[820px]:min-h-0 max-[820px]:p-[22px] max-sm:p-5" aria-label="加入流程板">
          <div className="relative z-[2] grid max-w-[22rem] gap-1.5">
            <span className="text-[0.88rem] font-black text-primary">Member Pass</span>
            <strong className="text-[clamp(1.6rem,2.8vw,2.18rem)] leading-[1.12] font-black tracking-normal text-[var(--ink)]">把你的社区身份接入同一个账号</strong>
          </div>

          <div className="relative z-[2] mt-6 grid min-h-[132px] w-[min(100%,410px)] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-[var(--radius-lg)] bg-[#e9f9f0] p-[22px] max-sm:grid-cols-1">
            <div>
              <span className="block font-[var(--font-latin-rounded)] text-[0.84rem] font-extrabold text-[rgba(var(--ink-rgb),0.6)]">{siteNameEn}</span>
              <strong className="mt-2 block text-[1.72rem] leading-[1.08] font-black tracking-normal text-[#111b1f]">Community Member</strong>
            </div>
            <BadgeCheck className="size-12 text-[#f7c75b]" aria-hidden="true" strokeWidth={1.8} />
          </div>

          <div className="relative z-[2] mt-[18px] grid w-[min(100%,410px)] gap-3">
            {joinSteps.map((step, index) => (
              <article className="grid min-h-[68px] grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.86)] px-4 py-3.5 shadow-[var(--shadow-md)]" key={step}>
                <span className="font-[var(--font-latin-rounded)] text-[1.2rem] leading-none font-black text-primary">{String(index + 1).padStart(2, "0")}</span>
                <p className="m-0 text-[0.92rem] leading-[1.48] font-[750] text-[rgba(var(--ink-rgb),0.68)]">{step}</p>
              </article>
            ))}
          </div>

          <div className="absolute right-[-56px] bottom-[-60px] z-[1] w-[min(48%,288px)] opacity-[0.98] drop-shadow-[0_18px_22px_rgba(var(--ink-rgb),0.11)] max-[820px]:relative max-[820px]:right-auto max-[820px]:bottom-auto max-[820px]:mx-auto max-[820px]:mt-[18px] max-[820px]:w-[min(72%,260px)] [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:object-contain" aria-hidden="true">
            <Image
              src="/join-card-optimized.webp"
              alt=""
              width={1000}
              height={577}
              priority
              sizes="(max-width: 820px) 72vw, 288px"
            />
          </div>

          <div className="absolute top-7 right-8 z-[3] grid max-w-[178px] rotate-6 gap-1.5 rounded-[5px_18px_18px_18px] border border-[rgba(229,175,70,0.32)] bg-[#fff2b8] px-4 pt-4 pb-7 shadow-[var(--shadow-lg)] max-[820px]:relative max-[820px]:top-auto max-[820px]:right-auto max-[820px]:mb-[18px] max-[820px]:max-w-none max-[820px]:rotate-0">
            <span className="text-[0.78rem] font-black text-[#a7602f]">加入原则</span>
            <strong className="text-[0.95rem] leading-[1.42] text-[#24322d]">少填一次表，多沉淀一次真实身份</strong>
          </div>
          <DoodleSparkles className="absolute top-32 right-[218px] z-[3] w-[54px] rotate-12 text-[#f4c75d] max-[820px]:top-[34px] max-[820px]:right-7" />
          <HandDrawnArrow className="absolute right-[100px] bottom-[66px] z-[3] w-[124px] rotate-[18deg] text-primary max-[820px]:hidden" />
        </div>
      </section>

      {!enabled ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[var(--radius-md)] border border-dashed border-[rgba(72,96,92,0.28)] bg-[rgba(72,96,92,0.08)] px-[18px] py-4 font-extrabold text-[var(--status-muted-strong)]">
          <Clock3 className="size-5" aria-hidden="true" strokeWidth={1.9} />
          <span>当前账号服务暂未启用，请稍后再试。</span>
        </div>
      ) : null}

      <section className="grid gap-5 pt-3">
        <div className={joinSectionHeadingClassName}>
          <p className="home-kicker">Profile</p>
          <div>
            <h2>资料先轻后完整</h2>
            <p>先完成进入社区必需的信息，其他资料可以随着活动、分享和项目逐步补上。</p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(280px,0.38fr)_minmax(0,0.62fr)] items-stretch gap-[22px] max-lg:grid-cols-1">
          <article className={profilePanelClassName}>
            <div>
              <p className="home-kicker">Required</p>
              <h3>登录后必填</h3>
            </div>

            <div className="grid gap-3">
              {requiredFields.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="grid min-h-[88px] grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-[5px] rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.78)] p-4" key={item.title}>
                    <Icon className="row-span-2 size-[38px] text-primary" aria-hidden="true" strokeWidth={1.8} />
                    <strong className="text-[1.08rem] leading-[1.15] text-[var(--ink)]">{item.title}</strong>
                    <span className="text-[0.9rem] leading-[1.45] font-[650] text-[rgba(var(--ink-rgb),0.62)]">{item.summary}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className={profilePanelClassName}>
            <div>
              <p className="home-kicker">Later</p>
              <h3>可稍后补充</h3>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {optionalFields.map((item) => (
                <span className="inline-flex min-h-[42px] items-center rounded-[var(--radius-pill)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.78)] px-3.5 font-[750] text-[rgba(var(--ink-rgb),0.72)]" key={item}>{item}</span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,0.78fr)_minmax(360px,1fr)] items-stretch gap-[22px] rounded-[var(--radius-lg)] border border-[rgba(var(--accent-rgb),0.16)] bg-[linear-gradient(135deg,rgba(248,250,246,0.96),rgba(240,246,244,0.92))] p-[26px] shadow-[var(--shadow-md)] max-lg:grid-cols-1 max-sm:p-5" aria-labelledby="co-builder-title">
        <div className="grid min-w-0 content-center gap-3.5">
          <p className="home-kicker">Co-builder</p>
          <h2 className="m-0 text-[clamp(1.8rem,3vw,2.42rem)] leading-[1.1] font-black tracking-normal text-[#111a1d]" id="co-builder-title">想参与社区共建？</h2>
          <p className="m-0 max-w-[42rem] leading-[1.74] font-[650] text-[rgba(var(--ink-rgb),0.66)]">
            如果你愿意参与活动组织、内容输出、项目协作、资料整理或社群运营，
            可以在个人资料里补充你的方向和可投入时间，从一件具体的小任务开始。
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-3 max-sm:gap-2.5 [&_svg]:size-[18px]">
            <Link href={primaryHref} prefetch={false} className="button home-primary-button">
              报名参与共建
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="grid min-w-0 gap-3" aria-label="参与共建步骤">
          {coBuilderSignals.map((item, index) => {
            const Icon = item.icon;

            return (
              <article className="grid min-h-[86px] grid-cols-[auto_42px_minmax(0,1fr)] items-center gap-3 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.78)] px-4 py-[15px] shadow-[var(--shadow-sm)] max-sm:grid-cols-1 max-sm:items-start" key={item.title}>
                <span className="font-[var(--font-latin-rounded)] text-[1.16rem] leading-none font-black text-primary">{String(index + 1).padStart(2, "0")}</span>
                <Icon className="size-9 text-[#f27c22]" aria-hidden="true" strokeWidth={1.8} />
                <div>
                  <h3 className="m-0 text-[1.02rem] leading-[1.2] text-[#111a1d]">{item.title}</h3>
                  <p className="mt-[5px] mb-0 text-[0.9rem] leading-[1.48] font-[650] text-[rgba(var(--ink-rgb),0.62)]">{item.summary}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-[22px] rounded-[var(--radius-lg)] bg-[#f3efff] p-[26px] max-lg:grid-cols-1 max-sm:p-5">
        <div>
          <p className="home-kicker">Next</p>
          <h2 className="mt-2 mb-0 text-[clamp(1.8rem,3vw,2.42rem)] leading-[1.1] font-black tracking-normal text-[#111a1d]">准备好加入常州 AI Club 了吗？</h2>
          <p className="mt-2.5 mb-0 max-w-[46rem] font-[650] text-[rgba(var(--ink-rgb),0.66)]">从登录和完善资料开始，之后就可以持续报名活动、展示主页、参与分享和共建。</p>
        </div>

        <div className="flex flex-wrap justify-end gap-3 max-lg:justify-start max-sm:gap-2.5 [&_svg]:size-[18px]">
          <Link href={primaryHref} prefetch={false} className="button home-primary-button">
            {primaryLabel}
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
          <Link href="/events" prefetch={false} className="button home-ghost-button">
            查看近期活动
          </Link>
        </div>
      </section>
    </div>
  );
}
