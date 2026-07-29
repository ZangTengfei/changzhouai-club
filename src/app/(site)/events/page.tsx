import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Lightbulb,
  Mic,
  MapPin,
} from "lucide-react";

import { RevealImage } from "@/components/reveal-image";

import { EventsRegistrationGrid } from "@/components/events-registration-grid";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import { getCompletedEventRecaps, getScheduledEvents } from "@/lib/community-events";
import { getEventImageUrl } from "@/lib/public-image-url";
import { cn } from "@/lib/utils";

const sectionHeadingClassName =
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-[18px] max-sm:grid-cols-1 max-sm:gap-2 [&_h2]:m-0 [&_h2]:text-[clamp(2rem,3.4vw,2.55rem)] [&_h2]:leading-[1.08] [&_h2]:font-bold [&_h2]:tracking-[-0.055em] [&_h2]:text-[#111a1d] max-sm:[&_h2]:text-[1.65rem] max-sm:[&_h2]:tracking-[-0.025em] [&_div>p]:mt-2 [&_div>p]:mb-0 [&_div>p]:max-w-[45rem] [&_div>p]:font-semibold [&_div>p]:text-[rgba(var(--ink-rgb),0.66)]";
const emptyPanelClassName =
  "grid min-h-[156px] content-center gap-1.5 rounded-[var(--radius-lg)] bg-[#e9f9f0] p-7 text-[var(--ink)] max-sm:p-5 [&_strong]:text-[1.2rem] [&_p]:m-0 [&_p]:text-[rgba(var(--ink-rgb),0.62)]";
const recapMediaToneClassNames = [
  "bg-[#e9f9f0]",
  "bg-[#fff2e5]",
  "bg-[#f3efff]",
  "bg-[#edf5ff]",
] as const;

export const metadata: Metadata = {
  title: "活动",
  description: "浏览常州 AI Club 的近期活动与往期回顾。",
};

function formatEventDateTime(value: string | null) {
  if (!value) {
    return "时间待定";
  }

  return formatChangzhouDateTime(value, {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const eventProposalNotes = [
  {
    title: "发起人主讲",
    summary: "申请人需要成为本场主要分享者，把自己的实践、案例或方法带到现场。",
    icon: Mic,
  },
  {
    title: "先申请再排期",
    summary: "社区会先确认主题、受众和边界，再一起安排场地、报名和传播。",
    icon: Lightbulb,
  },
] as const;

type CompletedEventRecap = Awaited<ReturnType<typeof getCompletedEventRecaps>>[number];

function FeaturedEventCard({
  item,
  index,
}: {
  item: CompletedEventRecap;
  index: number;
}) {
  return (
    <Link
      className="group block rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      href={`/events/${item.slug}`}
      prefetch={false}
    >
      <article className="grid min-h-[278px] grid-cols-[minmax(130px,0.28fr)_minmax(260px,0.72fr)_minmax(0,1fr)] overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_40px_rgba(var(--ink-rgb),0.1)] max-lg:grid-cols-[minmax(120px,0.32fr)_minmax(0,0.68fr)] max-[820px]:grid-cols-1!">
        <div
          className={cn(
            "relative grid min-h-full content-between p-[22px] max-sm:min-h-[96px] max-sm:grid-cols-[1fr_auto] max-sm:items-center max-sm:p-5 [&>span]:text-[0.88rem] [&>span]:leading-[1.35] [&>span]:font-extrabold [&>span]:text-[rgba(var(--ink-rgb),0.68)] [&>strong]:font-[var(--font-latin-rounded)] [&>strong]:text-[clamp(3rem,6vw,5rem)] [&>strong]:leading-[0.9] [&>strong]:font-black [&>strong]:tracking-[-0.08em] [&>strong]:text-primary max-sm:[&>strong]:text-[2.6rem] [&>svg]:size-7 [&>svg]:text-primary max-sm:[&>svg]:hidden",
            recapMediaToneClassNames[index % recapMediaToneClassNames.length],
          )}
        >
          <span>{item.dateLabel}</span>
          <strong>{String(index + 1).padStart(2, "0")}</strong>
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </div>

        <div className="aspect-[4/3] w-full self-center overflow-hidden bg-[rgba(var(--accent-rgb),0.08)] max-[820px]:aspect-[16/9] [&_img]:block [&_img]:size-full [&_img]:object-cover [&_img]:transition [&_img]:duration-300 group-hover:[&_img]:scale-[1.02]">
          {item.imageUrl ? (
            <RevealImage
              src={getEventImageUrl(item.imageUrl, "event-feature") ?? item.imageUrl}
              alt={item.title}
            />
          ) : (
            <div className="grid size-full place-items-center bg-[rgba(var(--accent-rgb),0.08)] p-6 font-extrabold text-[rgba(var(--ink-rgb),0.72)]">活动图片待补充</div>
          )}
        </div>

        <div className="grid min-w-0 content-center gap-3.5 p-7 max-lg:col-span-full max-sm:gap-3 max-sm:p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.88rem] font-bold text-[rgba(var(--ink-rgb),0.7)]">
            <span
              className={cn(
                "inline-flex min-h-8 items-center rounded-[var(--radius-pill)] border px-[11px] font-[750] shadow-[inset_4px_0_0_rgba(var(--accent-rgb),0.68)]",
                item.eventType === "external"
                  ? "border-[rgba(47,130,237,0.16)] bg-[rgba(47,130,237,0.09)] text-[#1f6ed2] shadow-[inset_4px_0_0_rgba(47,130,237,0.72)]"
                  : "border-[rgba(var(--accent-rgb),0.14)] bg-[rgba(var(--accent-rgb),0.11)] text-[var(--accent-strong)]",
              )}
            >
              {item.eventTypeLabel}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 [&_svg]:size-4 [&_svg]:flex-none">
              <MapPin aria-hidden="true" strokeWidth={1.9} />
              <span className="line-clamp-1">{item.locationLabel}</span>
            </span>
          </div>
          <h3 className="m-0 text-[clamp(1.6rem,2.8vw,2.35rem)] leading-[1.12] font-[720] tracking-[-0.048em] text-[#111a1d] max-sm:text-[1.5rem] max-sm:tracking-[-0.03em]">{item.title}</h3>
          <p className="m-0 line-clamp-3 leading-[1.76] text-[rgba(var(--ink-rgb),0.7)]">{item.summary}</p>
          <span className="inline-flex w-fit items-center gap-2 font-black text-primary [&_svg]:size-4">
            查看活动详情
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </span>
        </div>
      </article>
    </Link>
  );
}

function CompactEventCard({ item }: { item: CompletedEventRecap }) {
  return (
    <Link
      className="group grid min-h-full overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[0_10px_26px_rgba(var(--ink-rgb),0.065)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(var(--ink-rgb),0.1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      href={`/events/${item.slug}`}
      prefetch={false}
    >
      <article className="grid min-h-full grid-rows-[auto_1fr]">
        <div className="aspect-[16/9] overflow-hidden bg-[rgba(var(--accent-rgb),0.08)] [&_img]:block [&_img]:size-full [&_img]:object-cover [&_img]:transition [&_img]:duration-300 group-hover:[&_img]:scale-[1.025]">
          {item.imageUrl ? (
            <RevealImage
              src={getEventImageUrl(item.imageUrl, "event-feature") ?? item.imageUrl}
              alt={item.title}
            />
          ) : (
            <div className="grid size-full place-items-center bg-[#edf5ff] p-6 font-extrabold text-[rgba(var(--ink-rgb),0.72)]">活动图片待补充</div>
          )}
        </div>

        <div className="grid content-start gap-3 p-5">
          <div className="flex items-center justify-between gap-3 text-[0.82rem] leading-[1.4] font-extrabold">
            <span className={item.eventType === "external" ? "text-[#1f6ed2]" : "text-[var(--accent-strong)]"}>{item.eventTypeLabel}</span>
            <time className="text-[rgba(var(--ink-rgb),0.66)]">{item.dateLabel}</time>
          </div>
          <h3 className="m-0 line-clamp-2 text-[1.22rem] leading-[1.3] font-[720] tracking-[-0.025em] text-[#111a1d]">{item.title}</h3>
          <p className="m-0 line-clamp-2 text-[0.92rem] leading-[1.62] text-[rgba(var(--ink-rgb),0.7)]">{item.summary}</p>
          <div className="mt-auto flex min-w-0 items-center justify-between gap-3 pt-1 text-[0.84rem] font-bold text-[rgba(var(--ink-rgb),0.68)]">
            <span className="inline-flex min-w-0 items-center gap-1.5 [&_svg]:size-4 [&_svg]:flex-none">
              <MapPin aria-hidden="true" strokeWidth={1.9} />
              <span className="truncate">{item.locationLabel}</span>
            </span>
            <ArrowRight className="size-4 flex-none text-primary" aria-hidden="true" strokeWidth={2} />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ registration?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [completedEvents, scheduledEvents] = await Promise.all([
    getCompletedEventRecaps(),
    getScheduledEvents(),
  ]);
  const nextEvent = scheduledEvents[0];
  const latestCompletedEvent = completedEvents[0];
  const featuredCompletedEvents = completedEvents.slice(0, 3);
  const archivedCompletedEvents = completedEvents.slice(3);
  const visibleArchivedEvents = archivedCompletedEvents.slice(0, 6);
  const deferredArchivedEvents = archivedCompletedEvents.slice(6);
  const heroImageUrl =
    latestCompletedEvent?.imageUrl
      ? getEventImageUrl(latestCompletedEvent.imageUrl, "event-detail-hero") ??
        latestCompletedEvent.imageUrl
      : null;
  return (
    <div className="grid gap-7 max-sm:gap-[22px]" data-events-page>
      {params.registration ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.08)] px-[18px] py-4 font-extrabold text-[var(--accent-strong)]">
          {params.registration === "pending"
            ? "报名申请已提交，请等待组织方审核。"
            : params.registration === "waitlisted"
              ? "当前确认名额已满，你已进入候补。"
              : "报名成功，已经写入你的社区账号记录。"}
        </div>
      ) : null}

      {params.error ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(197,91,79,0.28)] bg-[rgba(197,91,79,0.08)] px-[18px] py-4 font-extrabold text-[var(--destructive)]">
          报名失败，请稍后再试。
        </div>
      ) : null}

      <section className="grid grid-cols-[minmax(0,0.86fr)_minmax(440px,1.14fr)] items-start gap-8 pt-6 pb-2 max-lg:grid-cols-1 max-sm:pt-0" aria-labelledby="events-hero-title">
        <div className="grid content-start gap-5 pt-[42px] max-lg:pt-2.5 max-sm:gap-3.5 max-sm:pt-[18px] [&_.home-kicker]:bg-[#e9f9f0]">
          <p className="home-kicker">Events · 线下相遇</p>
          <h1 className="m-0 text-[clamp(2.65rem,4.6vw,4rem)] leading-[1.1] font-bold tracking-[-0.052em] text-[#111b1f] after:block after:h-[13px] after:w-[min(190px,44vw)] after:-rotate-3 after:rounded-[50%] after:border-[3px] after:border-transparent after:border-t-[rgba(244,190,75,0.78)] after:content-[''] after:[margin:-6px_0_0_42%] max-sm:text-[clamp(2.15rem,10vw,2.5rem)] max-sm:leading-[1.16] max-sm:tracking-[-0.025em] max-sm:after:ml-[36%] max-sm:after:w-[154px]" id="events-hero-title">
            一起见面，
            <span className="block text-primary">做点新东西</span>
          </h1>
          <p className="m-0 max-w-[33rem] text-[clamp(0.98rem,1.18vw,1.08rem)] leading-[1.84] text-[rgba(var(--ink-rgb),0.72)]">
            查看近期开放报名的活动，也回看社区现场。
          </p>

          <div className="flex flex-wrap items-center gap-3.5 max-sm:gap-2.5 max-sm:[&_.button]:min-h-[42px] max-sm:[&_.button]:px-[17px] max-sm:[&_.button]:text-[0.9rem] [&_svg]:size-[18px]">
            <Link href={nextEvent ? "#upcoming" : "#reviews"} className="button home-primary-button">
              {nextEvent ? "查看报名" : "浏览最新回顾"}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href={nextEvent ? "#reviews" : "/events/propose"} className="button home-ghost-button" prefetch={false}>
              {nextEvent ? "往期回顾" : "发起活动"}
            </Link>
          </div>
        </div>

        <div className="relative min-h-[548px] pt-6 pb-20 pl-7 max-lg:min-h-[500px] max-lg:pt-7 max-lg:pb-[82px] max-lg:pl-5 max-[820px]:min-h-0 max-[820px]:pt-8 max-[820px]:pb-0 max-[820px]:pl-0">
          <div className="ml-auto w-[min(100%,680px)] rotate-[1.2deg] overflow-hidden rounded-[var(--radius-lg)] border-[10px] border-[rgba(255,252,247,0.92)] bg-[rgba(var(--accent-rgb),0.08)] shadow-[0_24px_54px_rgba(var(--ink-rgb),0.16),inset_0_1px_0_rgba(255,255,255,0.7)] max-sm:rotate-0 max-sm:border-8 [&_img]:block [&_img]:h-[430px] [&_img]:w-full [&_img]:object-cover max-sm:[&_img]:h-60">
            {heroImageUrl ? (
              <RevealImage
                src={heroImageUrl}
                alt={latestCompletedEvent?.title ?? "常州 AI Club 活动现场"}
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div className="grid h-[430px] w-full place-content-center place-items-center gap-3 bg-[#edf5ff] p-7 text-center text-[var(--accent-strong)] max-sm:h-60">
                <span className="grid size-[86px] place-items-center rounded-[var(--radius-pill)] bg-[#0d8b5f] text-[1.8rem] font-black text-white">AI</span>
                <strong className="text-[1.18rem]">下一张现场照片，等你入镜</strong>
              </div>
            )}
          </div>

          <article className="absolute right-[clamp(-22px,-2vw,-8px)] bottom-[-6px] z-[2] grid w-[min(390px,82%)] gap-3.5 rounded-[var(--radius-lg)] bg-[#e9f9f0] px-6 py-[22px] shadow-[0_18px_36px_rgba(var(--ink-rgb),0.1)] max-lg:right-0 max-lg:bottom-2 max-[820px]:relative max-[820px]:right-auto max-[820px]:bottom-auto max-[820px]:mt-[-42px] max-[820px]:w-full max-sm:p-5">
            <p className="m-0 text-[0.9rem] font-[720] text-[#149064]">{nextEvent?.eventTypeLabel ?? "下一场活动"}</p>
            <h2 className="m-0 text-[clamp(1.42rem,2.1vw,1.9rem)] leading-[1.18] font-[720] tracking-[-0.04em] text-[var(--ink)] max-sm:text-[1.3rem]">{nextEvent?.title ?? "新的线下活动正在筹备"}</h2>
            {nextEvent ? (
              <>
                <div className="grid gap-[9px]">
                  <span className="flex items-center gap-[9px] text-[0.92rem] leading-[1.45] font-bold text-[rgba(var(--ink-rgb),0.72)] [&_svg]:size-4 [&_svg]:flex-none">
                    <CalendarDays aria-hidden="true" strokeWidth={1.9} />
                    {formatEventDateTime(nextEvent.event_at)}
                  </span>
                  <span className="flex items-center gap-[9px] text-[0.92rem] leading-[1.45] font-bold text-[rgba(var(--ink-rgb),0.72)] [&_svg]:size-4 [&_svg]:flex-none">
                    <MapPin aria-hidden="true" strokeWidth={1.9} />
                    {nextEvent.venue
                      ? `${nextEvent.city ?? "常州"} · ${nextEvent.venue}`
                      : "常州 · 线下空间待公布"}
                  </span>
                </div>
                <Link className="inline-flex min-h-11 w-fit items-center gap-2 font-black text-primary [&_svg]:size-4" href={`/events/${nextEvent.slug}`} prefetch={false}>
                  查看详情 <ArrowRight aria-hidden="true" strokeWidth={2} />
                </Link>
              </>
            ) : (
              <>
                <p className="m-0 text-[0.94rem] leading-[1.65] font-semibold text-[rgba(var(--ink-rgb),0.7)]">新活动确认后会同步到社区通知。等待期间，可以先看看最近一次现场。</p>
                {latestCompletedEvent ? (
                  <Link className="inline-flex min-h-11 w-fit items-center gap-2 font-black text-primary [&_svg]:size-4" href={`/events/${latestCompletedEvent.slug}`} prefetch={false}>
                    查看最近一场 <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                ) : null}
              </>
            )}
          </article>

        </div>
      </section>

      {scheduledEvents.length > 0 ? (
        <section className="grid gap-5 pt-3 [&>.home-kicker]:bg-[#edf5ff] [&_.card-grid]:grid-cols-[repeat(auto-fit,minmax(min(100%,300px),420px))] [&_.card-grid]:justify-start [&_.event-registration-card]:relative [&_.event-registration-card]:grid [&_.event-registration-card]:content-start [&_.event-registration-card]:gap-3 [&_.event-registration-card]:overflow-hidden [&_.event-registration-card]:rounded-[var(--radius-md)] [&_.event-registration-card]:border-0 [&_.event-registration-card]:bg-white [&_.event-registration-card]:p-[18px] [&_.event-registration-card]:shadow-[0_12px_30px_rgba(var(--ink-rgb),0.07)] [&_.event-registration-card]:before:absolute [&_.event-registration-card]:before:inset-x-0 [&_.event-registration-card]:before:top-0 [&_.event-registration-card]:before:h-1 [&_.event-registration-card]:before:bg-primary [&_.event-registration-card]:before:content-[''] [&_.event-registration-card-external]:before:bg-[#2f82ed] [&_.event-type-band]:flex [&_.event-type-band]:min-h-[42px] [&_.event-type-band]:min-w-0 [&_.event-type-band]:items-center [&_.event-type-band]:justify-between [&_.event-type-band]:gap-3 [&_.event-type-band]:rounded-[var(--radius-sm)] [&_.event-type-band]:border [&_.event-type-band]:border-[rgba(var(--accent-rgb),0.14)] [&_.event-type-band]:bg-[rgba(255,252,247,0.72)] [&_.event-type-band]:py-2 [&_.event-type-band]:pr-[11px] [&_.event-type-band]:pl-[13px] [&_.event-type-band]:shadow-[inset_4px_0_0_rgba(var(--accent-rgb),0.72)] [&_.event-type-band_strong]:overflow-hidden [&_.event-type-band_strong]:text-[0.98rem] [&_.event-type-band_strong]:font-black [&_.event-type-band_strong]:text-ellipsis [&_.event-type-band_strong]:whitespace-nowrap [&_.event-type-band_strong]:text-[var(--accent-strong)] [&_.event-type-band_span]:overflow-hidden [&_.event-type-band_span]:rounded-[var(--radius-pill)] [&_.event-type-band_span]:bg-[rgba(var(--accent-rgb),0.08)] [&_.event-type-band_span]:px-2 [&_.event-type-band_span]:py-[3px] [&_.event-type-band_span]:text-[0.78rem] [&_.event-type-band_span]:font-[850] [&_.event-type-band_span]:text-ellipsis [&_.event-type-band_span]:whitespace-nowrap [&_.event-type-band_span]:text-[rgba(var(--ink-rgb),0.62)] [&_.event-type-band-external]:border-[rgba(47,130,237,0.16)] [&_.event-type-band-external]:shadow-[inset_4px_0_0_rgba(47,130,237,0.78)] [&_.event-type-band-external_strong]:text-[#1f6ed2] [&_.event-type-band-external_span]:bg-[rgba(47,130,237,0.09)] [&_.event-type-band-external_span]:text-[#235b9b] [&_.event-registration-card_h3]:m-0 [&_.event-registration-card_h3]:text-[clamp(1.22rem,1.8vw,1.52rem)] [&_.event-registration-card_h3]:leading-[1.18] [&_.event-registration-card_h3]:tracking-[-0.035em] [&_.event-registration-card_h3]:text-[var(--ink)] [&_.event-registration-card>p]:m-0 [&_.event-registration-card>p]:text-[0.94rem] [&_.event-registration-card>p]:leading-[1.62] [&_.event-registration-card>p]:text-[rgba(var(--ink-rgb),0.66)] [&_.event-registration-card_.detail-list]:m-0 [&_.event-registration-card_.detail-list]:block [&_.event-registration-card_.detail-list]:list-none [&_.event-registration-card_.detail-list]:p-0 [&_.event-registration-card_.detail-list]:text-[0.92rem] [&_.event-registration-card_.pill-row]:gap-2 [&_.event-registration-card_.cta-row]:gap-2 [&_.event-registration-card_.cta-row>*]:w-auto [&_.event-registration-card_.button]:min-h-11 [&_.event-registration-card_.button]:rounded-[var(--radius-sm)] max-sm:[&_.event-registration-card]:p-5" id="upcoming">
          <div className={sectionHeadingClassName}>
            <p className="home-kicker">Upcoming</p>
            <div>
              <h2>近期活动报名</h2>
            </div>
          </div>
          <EventsRegistrationGrid events={scheduledEvents} />
        </section>
      ) : null}

      <section className="grid gap-5 pt-3 [&_.home-kicker]:bg-[#f3efff]" id="reviews">
        <div className={sectionHeadingClassName}>
          <p className="home-kicker">Recap</p>
          <div>
            <h2>往期活动回顾</h2>
            <p>已收录 {completedEvents.length} 场活动</p>
          </div>
        </div>

        {completedEvents.length > 0 ? (
          <div className="grid gap-8">
            <div className="grid gap-[18px]">
              {featuredCompletedEvents.map((item, index) => (
                <FeaturedEventCard item={item} index={index} key={item.id} />
              ))}
            </div>

            {archivedCompletedEvents.length > 0 ? (
              <div className="grid gap-5 pt-2">
                <div className="flex items-end justify-between gap-5 max-sm:items-start">
                  <div>
                    <h3 className="m-0 text-[clamp(1.5rem,2.2vw,1.9rem)] leading-[1.2] font-[720] tracking-[-0.035em] text-[#111a1d]">更多活动</h3>
                    <p className="mt-1.5 mb-0 text-[0.94rem] font-semibold text-[rgba(var(--ink-rgb),0.68)]">按时间顺序继续浏览社区现场</p>
                  </div>
                  <span className="shrink-0 text-[0.88rem] font-extrabold text-[rgba(var(--ink-rgb),0.64)]">{archivedCompletedEvents.length} 场</span>
                </div>

                <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
                  {visibleArchivedEvents.map((item) => (
                    <CompactEventCard item={item} key={item.id} />
                  ))}
                </div>

                {deferredArchivedEvents.length > 0 ? (
                  <details className="group/more grid gap-[18px]">
                    <summary className="mx-auto flex min-h-12 w-fit cursor-pointer list-none items-center gap-2 rounded-[var(--radius-pill)] border border-[rgba(var(--ink-rgb),0.12)] bg-white px-5 font-extrabold text-[var(--ink)] shadow-[0_8px_20px_rgba(var(--ink-rgb),0.05)] transition hover:border-[rgba(var(--accent-rgb),0.3)] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden [&_svg]:size-4 [&_svg]:transition group-open/more:[&_svg]:rotate-90">
                      查看其余 {deferredArchivedEvents.length} 场活动
                      <ArrowRight aria-hidden="true" strokeWidth={2} />
                    </summary>
                    <div className="mt-[18px] grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
                      {deferredArchivedEvents.map((item) => (
                        <CompactEventCard item={item} key={item.id} />
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className={emptyPanelClassName}>
            <strong>暂无往期活动回顾</strong>
            <p>第一场活动完成后，现场照片与内容摘要会在这里归档。</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-[minmax(260px,0.88fr)_minmax(300px,1fr)_auto] items-center gap-[18px] rounded-[var(--radius-lg)] bg-white p-[22px] shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-lg:grid-cols-1 max-sm:p-5" aria-labelledby="event-proposal-title" id="host-event">
        <div className="grid min-w-0 gap-2 [&_.home-kicker]:bg-[#fff2e5]">
          <p className="home-kicker">Host · 群友发起</p>
          <h2 className="m-0 text-[clamp(1.55rem,2.4vw,2rem)] leading-[1.12] font-[720] text-[#111a1d] max-sm:text-[1.45rem] max-sm:leading-[1.2]" id="event-proposal-title">有主题，也可以申请发起一场活动</h2>
          <p className="m-0 text-[0.94rem] leading-[1.68] font-[650] text-[rgba(var(--ink-rgb),0.7)]">
            有实践、有案例，也可以申请发起一场活动。审核通过后，再一起确认排期和现场支持。
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-3 max-[820px]:grid-cols-1" aria-label="活动发起申请规则">
          {eventProposalNotes.map((item, index) => {
            const Icon = item.icon;

            return (
              <article className={cn("grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] p-3.5", index === 0 ? "bg-[#fff2e5]" : "bg-[#f3efff]")} key={item.title}>
                <Icon className="row-span-2 size-7 text-primary" aria-hidden="true" strokeWidth={1.8} />
                <strong className="text-[0.98rem] leading-[1.2] font-bold text-[#111a1d]">{item.title}</strong>
                <span className="text-[0.86rem] leading-[1.55] font-[650] text-[rgba(var(--ink-rgb),0.68)]">{item.summary}</span>
              </article>
            );
          })}
        </div>

        <Link
          href="/events/propose"
          prefetch={false}
          className="button home-primary-button justify-self-end gap-2 whitespace-nowrap max-lg:justify-self-start [&_svg]:size-[18px]"
        >
          提交活动申请
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </Link>
      </section>
    </div>
  );
}
