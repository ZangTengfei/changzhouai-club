import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  UsersRound,
} from "lucide-react";

import { RevealImage } from "@/components/reveal-image";

import { DoodleSparkles } from "@/components/home-visual-assets";
import { HeroPhotoCarousel } from "@/components/hero-photo-carousel";
import { SiteSponsors } from "@/components/site-sponsors";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import {
  getHomeCompletedEventRecaps,
  getHomeCompletedEventsCount,
  getHomeScheduledEvents,
} from "@/lib/community-events";
import {
  formatCommunityMemberCount,
  getCommunityMemberCount,
} from "@/lib/community-metrics";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { getEventImageUrl } from "@/lib/public-image-url";
import { cn } from "@/lib/utils";
const HERO_CAROUSEL_IMAGE_LIMIT = 3;

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

function formatReviewDate(value: string | null) {
  if (!value) {
    return "时间待定";
  }

  return value.split("T")[0]?.replaceAll("-", ".") ?? value.replaceAll("-", ".");
}

function extractShortBio(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？])/)
    .map((item) => item.trim())
    .find(Boolean);

  if (!normalized) {
    return null;
  }

  return normalized.length > 42 ? `${normalized.slice(0, 42)}...` : normalized;
}

const heroNotes = [
  {
    lines: ["带着问题来", "一起找到", "可验证的方向"],
    icon: "heart",
  },
] as const;

const statIcons = {
  people: UsersRound,
  calendar: CalendarDays,
  pin: MapPin,
} as const;

const statCardTones = {
  people: "bg-[#e9f9f0] [&_strong]:text-[#0b8a69]",
  calendar: "bg-[#fff2e5] [&_strong]:text-[#f27c22]",
  pin: "bg-[#f3efff] [&_strong]:text-[#7d63f1]",
} satisfies Record<StatIconKey, string>;

const statIconTones = {
  people: "text-[#0b8a69]",
  calendar: "text-[#f27c22]",
  pin: "text-[#7d63f1]",
} satisfies Record<StatIconKey, string>;

const homeButtonClass = "button min-h-[54px] rounded-[var(--radius-sm)] px-7 text-base shadow-[0_14px_28px_rgba(var(--accent-rgb),0.16)] max-sm:min-h-[42px] max-sm:w-auto! max-sm:px-[17px] max-sm:text-[0.9rem]";
const sectionHeadingClass = "flex items-center justify-between gap-4 [&_h2]:m-0 [&_h2]:text-[clamp(1.75rem,3.2vw,2.2rem)] [&_h2]:leading-[1.16] [&_h2]:tracking-[-0.04em] [&_h2]:text-[#172020] [&_a]:shrink-0 [&_a]:text-[0.92rem] [&_a]:font-extrabold [&_a]:text-[rgba(var(--ink-rgb),0.66)]";

type StatIconKey = keyof typeof statIcons;

export default async function HomePage() {
  const [
    scheduledEvents,
    recentCompletedEvents,
    completedEventsCount,
    directory,
    communityMemberCount,
  ] = await Promise.all([
    getHomeScheduledEvents(),
    getHomeCompletedEventRecaps(),
    getHomeCompletedEventsCount(),
    getPublicMembersDirectory(),
    getCommunityMemberCount(),
  ]);
  const communityMemberCountLabel = formatCommunityMemberCount(
    communityMemberCount,
  );
  const primaryScheduledEvent = scheduledEvents[0];
  const hasUpcomingEvent = Boolean(primaryScheduledEvent);
  const latestCompletedEvent = recentCompletedEvents[0];
  const recentEvents = recentCompletedEvents.slice(0, 3);
  const heroCarouselImages = recentCompletedEvents
    .flatMap((event) => {
      const imageUrl = event.imageUrl ?? event.gallery[0]?.imageUrl ?? null;

      if (!imageUrl) {
        return [];
      }

      return [
        {
          mainSrc: getEventImageUrl(imageUrl, "hero-main") ?? imageUrl,
          thumbSrc: getEventImageUrl(imageUrl, "hero-thumb") ?? imageUrl,
          alt: `${event.title} 活动现场`,
          href: `/events/${event.slug}`,
          videoUrl: event.video?.url ?? null,
          videoTitle: event.video?.title ?? null,
          videoPosterSrc: event.video?.coverUrl
            ? getEventImageUrl(event.video.coverUrl, "hero-main") ?? event.video.coverUrl
            : null,
        },
      ];
    })
    .filter((item, index, items) => (
      items.findIndex((candidate) => candidate.mainSrc === item.mainSrc) === index
    ))
    .slice(0, HERO_CAROUSEL_IMAGE_LIMIT);
  const communityStats = [
    {
      value: communityMemberCountLabel,
      label: "全网成员",
      detail: "本地 AI 从业者与爱好者",
      icon: "people",
    },
    {
      value: `${completedEventsCount || 7} 场`,
      label: "线下活动",
      detail: "技术分享与交流",
      icon: "calendar",
    },
    {
      value: "常州",
      label: "我们的据点",
      detail: "立足常州，连接长三角",
      icon: "pin",
    },
  ] satisfies Array<{
    value: string;
    label: string;
    detail: string;
    icon: StatIconKey;
  }>;
  const nextEventDateLabel = formatEventDateTime(
    primaryScheduledEvent?.event_at ?? null,
  );
  const nextEventLocationLabel = primaryScheduledEvent?.venue
    ? `${primaryScheduledEvent.city ?? "常州"} · ${primaryScheduledEvent.venue}`
    : hasUpcomingEvent
      ? "常州 · 线下空间待公布"
      : "新活动发布后会同步时间和地点";
  const storyMembers = directory.members
    .filter((member) => member.avatarUrl || member.bio || member.roleLabel)
    .slice(0, 4)
    .map((member) => {
      const metaParts = [member.roleLabel, member.organization].filter(Boolean);
      const storyTags = member.skills
        .filter((skill) => skill.trim())
        .slice(0, 3)
        .map((skill) => `# ${skill}`);

      if (storyTags.length === 0) {
        if (member.isCoBuilder) {
          storyTags.push("# 共建成员");
        }

        if (member.willingToJoinProjects && !member.isCoBuilder) {
          storyTags.push("# 项目协作");
        }

        if (member.willingToShare) {
          storyTags.push("# 乐于分享");
        }

        if (storyTags.length === 0) {
          storyTags.push("# 社区成员");
        }
      }

      return {
        id: member.id,
        href: member.publicSlug ? `/members/${member.publicSlug}` : "/members",
        avatarUrl: member.avatarUrl,
        name: member.displayName,
        meta: metaParts.join(" @ ") || member.city,
        story:
          extractShortBio(member.bio) ??
          "在这里认识伙伴、交换经验，也让更多想法从交流逐步走向行动。",
        tags: storyTags,
      };
    });
  const memberStories = storyMembers;

  return (
    <div className="grid gap-7 max-sm:gap-[18px]" data-home-page>
      <section className="grid min-h-[542px] grid-cols-[minmax(0,0.88fr)_minmax(470px,1.12fr)] items-start gap-[30px] pt-6 pb-3.5 max-lg:min-h-0 max-lg:grid-cols-1 max-lg:gap-6 max-lg:pt-2.5 max-sm:pt-0" aria-labelledby="home-hero-title">
        <div className="grid content-start gap-[18px] pt-11 max-sm:gap-3.5 max-sm:pt-[18px]">
          <p className="m-0 inline-flex w-fit rounded-[var(--radius-pill)] bg-[rgba(244,240,225,0.96)] px-[13px] py-1.5 text-[0.84rem] font-extrabold tracking-[0.02em] text-[var(--accent-strong)]">连接・分享・共创 👋</p>
          <h1 id="home-hero-title" className="m-0 max-w-[12.8em] font-[var(--font-display)] text-[clamp(2.65rem,4.45vw,3.68rem)] leading-[1.12] font-bold tracking-[-0.038em] text-[#111b1f] after:mt-[-8px] after:ml-[54%] after:block after:h-[13px] after:w-[min(196px,42vw)] after:-rotate-3 after:rounded-[50%] after:border-[3px] after:border-[rgba(244,190,75,0.78)_transparent_transparent_transparent] after:content-[''] max-sm:text-[clamp(2.15rem,10vw,2.5rem)]! max-sm:leading-[1.16]! max-sm:font-[720] max-sm:tracking-[-0.025em] max-sm:after:ml-[44%] max-sm:after:w-40">
            常州 <span className="font-[var(--font-latin-rounded)] font-bold tracking-[-0.012em] text-[var(--accent)]">AI Club</span>
            <br />
            <span className="inline-block max-w-full text-balance max-sm:whitespace-normal">让真实问题长成 AI 项目</span>
          </h1>
          <p className="m-0 max-w-[31rem] text-[clamp(0.97rem,1.18vw,1.07rem)] leading-[1.84] text-[rgba(var(--ink-rgb),0.72)] max-sm:text-[0.94rem] max-sm:leading-[1.62]">
            连接常州 AI 实践者，一起参加活动、认识伙伴，把真实问题推进成项目。
          </p>

          <div className="mt-0.5 flex flex-wrap items-center gap-[18px] max-sm:gap-2.5">
            <Link href="/join" prefetch={false} className={cn(homeButtonClass, "gap-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] focus-visible:bg-[var(--accent-strong)]")}>
              申请加入
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/events" prefetch={false} className={cn(homeButtonClass, "border-[rgba(var(--ink-rgb),0.16)] bg-white/82 text-[var(--ink)] shadow-[var(--shadow-md)] hover:bg-white focus-visible:bg-white")}>
              参加活动
            </Link>
          </div>

        </div>

        <HeroPhotoCarousel
          images={heroCarouselImages}
          fallbackAlt={latestCompletedEvent?.title ?? "常州 AI Club 活动现场"}
          notes={heroNotes.map((note) => ({
            lines: [...note.lines],
            icon: note.icon,
          }))}
        />
      </section>

      <section className="mt-1 grid grid-cols-3 gap-3.5 border-0 bg-transparent p-0 shadow-none max-sm:gap-2" aria-label="社区数据">
        {communityStats.map((item) => {
          const StatIcon = statIcons[item.icon];

          return (
            <article
              className={cn("grid min-h-[82px] min-w-0 grid-cols-[56px_minmax(0,1fr)] items-center gap-4 rounded-[var(--radius-md)] border-0 p-[22px] max-lg:px-6 max-lg:py-[18px] max-sm:min-h-[74px] max-sm:grid-cols-1 max-sm:justify-items-center max-sm:gap-[5px] max-sm:rounded-[var(--radius-sm)] max-sm:px-1.5 max-sm:py-[9px] max-sm:text-center [&_strong]:block [&_strong]:whitespace-nowrap [&_strong]:font-[var(--font-latin-rounded)] [&_strong]:text-[clamp(1.85rem,2.5vw,2.35rem)] [&_strong]:leading-[0.98] [&_strong]:font-extrabold [&_strong]:tracking-[-0.022em] max-sm:[&_strong]:text-[1.18rem] max-sm:[&_strong]:tracking-normal", statCardTones[item.icon])}
              key={item.label}
            >
              <span
                className={cn("grid size-[50px] place-items-center border-0 [&_svg]:size-[42px] [&_svg]:stroke-current max-sm:size-[22px] max-sm:[&_svg]:size-[22px]", statIconTones[item.icon])}
                aria-hidden="true"
              >
                <StatIcon strokeWidth={1.9} />
              </span>
              <div className="[&_>span]:mt-[7px] [&_>span]:block [&_>span]:whitespace-nowrap [&_>span]:text-[0.92rem] [&_>span]:leading-[1.18] [&_>span]:font-extrabold [&_>span]:text-[#152524] [&_small]:mt-[7px] [&_small]:block [&_small]:overflow-hidden [&_small]:text-[0.84rem] [&_small]:leading-[1.35] [&_small]:font-semibold [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[rgba(var(--ink-rgb),0.56)] max-sm:[&_>span]:mt-[3px] max-sm:[&_>span]:text-[0.72rem] max-sm:[&_small]:hidden">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </div>
            </article>
          );
        })}
      </section>

      <section
        className="grid gap-5 pt-3.5 max-[820px]:gap-4 max-[820px]:pt-2"
        aria-labelledby="home-current-events-title"
      >
        <div className={cn(sectionHeadingClass, "m-0")}>
          <div>
            <h2 id="home-current-events-title">近期活动</h2>
            <p className="mt-1.5 mb-0 text-[rgba(var(--ink-rgb),0.62)]">报名下一场，也看看我们最近一起做过什么</p>
          </div>
          <Link href="/events" prefetch={false}>全部活动 →</Link>
        </div>

        <div className="grid grid-cols-2 items-stretch gap-[18px] max-lg:grid-cols-1">
          <article className="relative grid min-h-[346px] w-full self-start overflow-hidden rounded-[var(--radius-lg)] border-0 bg-white px-[30px] py-7 shadow-[0_16px_36px_rgba(var(--ink-rgb),0.075)] before:absolute before:top-[82px] before:right-[114px] before:size-2 before:rounded-[var(--radius-pill)] before:bg-[#7fcf92] before:shadow-[28px_-18px_0_0_#f4c75d,52px_6px_0_0_#8bbcf7,-18px_102px_0_0_rgba(127,207,146,0.76)] before:content-[''] max-[820px]:min-h-0 max-sm:rounded-[var(--radius-md)] max-sm:px-4 max-sm:py-[18px] max-sm:before:hidden">
            <div className="relative z-[1] grid max-w-full content-start gap-4 max-sm:gap-2.5">
              <p className="m-0 text-[0.95rem] leading-[1.1] font-black text-[#149064] max-sm:text-[0.86rem]">
                {hasUpcomingEvent ? "下一场活动等你来！" : "下一场活动筹备中"}
              </p>
              <h3 className="m-0 text-[clamp(1.8rem,2.6vw,2.18rem)] leading-[1.18] font-[740] tracking-[-0.045em] text-[var(--ink)] max-sm:text-[1.32rem] max-sm:font-[720] max-sm:tracking-normal">
                {primaryScheduledEvent?.title ?? "近期活动正在筹备中"}
              </h3>
              <ul className="m-0 grid list-none gap-[11px] p-0 text-[rgba(var(--ink-rgb),0.72)] max-sm:gap-[7px] [&_li]:flex [&_li]:items-center [&_li]:gap-2.5 [&_li]:text-[0.96rem] [&_li]:leading-[1.45] [&_li]:font-semibold max-sm:[&_li]:gap-2 max-sm:[&_li]:text-[0.88rem] max-sm:[&_li]:leading-[1.35] [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-[rgba(var(--ink-rgb),0.72)]">
                <li>
                  <CalendarDays aria-hidden="true" strokeWidth={1.9} />
                  <span>{hasUpcomingEvent ? nextEventDateLabel : "时间待定"}</span>
                </li>
                <li>
                  <MapPin aria-hidden="true" strokeWidth={1.9} />
                  <span>{nextEventLocationLabel}</span>
                </li>
              </ul>
              <p className="m-0 text-[0.96rem] leading-[1.55] font-bold text-[rgba(var(--ink-rgb),0.72)] max-sm:text-[0.86rem] max-sm:leading-[1.45]">
                {hasUpcomingEvent
                  ? "活动已开放报名，报名状态以活动详情页为准。"
                  : "新的线下活动发布后，会第一时间出现在活动页。"}
              </p>
              <Link
                href={primaryScheduledEvent ? `/events/${primaryScheduledEvent.slug}` : "/events"}
                prefetch={false}
                className={cn(homeButtonClass, "w-fit gap-2 bg-[var(--accent)] px-[22px] shadow-[var(--shadow-lg)] hover:bg-[var(--accent-strong)] focus-visible:bg-[var(--accent-strong)] max-sm:min-h-11 max-sm:justify-center max-sm:px-4")}
              >
                {hasUpcomingEvent ? "查看活动详情" : "查看活动列表"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <DoodleSparkles className="pointer-events-none absolute top-7 right-8 z-4 h-auto w-[46px] text-[#f4c75d] max-sm:hidden" />
          </article>

          <aside
            className="grid min-w-0 grid-rows-[auto_1fr] gap-3 rounded-[var(--radius-lg)] border border-[rgba(var(--ink-rgb),0.1)] bg-white/74 p-5 shadow-[0_10px_24px_rgba(var(--ink-rgb),0.035)] max-[820px]:p-4"
            aria-labelledby="home-event-history-title"
          >
            <div className="flex items-end justify-between gap-4 [&_span]:mb-1 [&_span]:block [&_span]:text-[0.78rem] [&_span]:font-black [&_span]:tracking-[0.08em] [&_span]:text-[#2f82ed] [&_h3]:m-0 [&_h3]:text-[1.24rem] [&_h3]:leading-[1.2] [&_h3]:text-[var(--ink)] [&_small]:block [&_small]:whitespace-nowrap [&_small]:text-[0.78rem] [&_small]:font-bold [&_small]:text-[rgba(var(--ink-rgb),0.52)]">
              <div>
                <span>活动回顾</span>
                <h3 id="home-event-history-title">最近举办</h3>
              </div>
              <small>{completedEventsCount || recentEvents.length} 场活动已沉淀</small>
            </div>

            {recentEvents.length > 0 ? (
              <div className="grid gap-0 max-lg:grid-cols-3 max-lg:gap-3 max-[820px]:grid-cols-1! max-[820px]:gap-0!">
                {recentEvents.map((item) => (
                  <Link
                    href={`/events/${item.slug}`}
                    prefetch={false}
                    className="group relative grid min-w-0 grid-cols-[116px_minmax(0,1fr)_20px] items-center gap-3.5 border-b border-[rgba(var(--ink-rgb),0.08)] py-3 text-inherit transition-[color,transform] duration-180 first:pt-1.5 last:border-b-0 last:pb-0 hover:translate-x-0.5 hover:text-[var(--accent-strong)] focus-visible:translate-x-0.5 focus-visible:text-[var(--accent-strong)] max-lg:grid-cols-[1fr_20px] max-lg:grid-rows-[auto_1fr] max-lg:items-start max-lg:border-b-0 max-lg:p-0 max-[820px]:grid-cols-[104px_minmax(0,1fr)_18px]! max-[820px]:grid-rows-none! max-[820px]:items-center! max-[820px]:border-b! max-[820px]:py-2.5! max-[820px]:first:pt-1! max-[820px]:last:border-b-0! max-[820px]:last:pb-0! [&_>svg]:size-[18px] [&_>svg]:text-[rgba(var(--ink-rgb),0.34)] [&_>svg]:transition-colors group-hover:[&_>svg]:text-[var(--accent)] group-focus-visible:[&_>svg]:text-[var(--accent)]"
                    key={item.id}
                  >
                    <div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-[#13181f] font-black text-white max-lg:col-span-full max-[820px]:col-auto! [&_img]:block [&_img]:size-full [&_img]:object-cover">
                      {item.imageUrl ? (
                        <Image
                          src={getEventImageUrl(item.imageUrl, "review-card") ?? item.imageUrl}
                          alt={item.title}
                          width={320}
                          height={180}
                          unoptimized
                          loading="lazy"
                        />
                      ) : (
                        <span>AI</span>
                      )}
                    </div>
                    <div className="min-w-0 max-lg:pt-0.5 max-[820px]:pt-0">
                      <small className="m-0 block text-[0.76rem] font-bold text-[rgba(var(--ink-rgb),0.5)]">{formatReviewDate(item.isoDate)}</small>
                      <h4 className="mt-[5px] line-clamp-2 text-[0.94rem] leading-[1.34] text-[#152022]">{item.title}</h4>
                      <p className="mt-[5px] overflow-hidden text-[0.78rem] leading-[1.35] text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.54)]">{item.locationLabel}</p>
                    </div>
                    <ArrowRight aria-hidden="true" strokeWidth={1.8} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(var(--accent-rgb),0.24)] bg-[rgba(var(--accent-rgb),0.06)] p-[26px] text-[rgba(var(--ink-rgb),0.68)]">
                暂无活动回顾内容，活动结束后会在这里留下记录。
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="grid gap-5 border-0 bg-transparent pt-[18px] shadow-none max-sm:gap-3 max-sm:px-3.5 max-sm:pt-4 max-sm:pb-3.5" aria-labelledby="home-member-stories-title">
        <div className={sectionHeadingClass}>
          <div>
            <h2 id="home-member-stories-title">社区成员</h2>
          </div>
          <Link href="/members" prefetch={false}>查看更多故事 →</Link>
        </div>

        {memberStories.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
            {memberStories.map((item) => (
              <Link
                href={"href" in item ? item.href : "/members"}
                prefetch={false}
                className="relative grid min-h-[214px] gap-4 rounded-[var(--radius-md)] border-0 bg-white px-[18px] pt-[18px] pb-4 shadow-[0_10px_28px_rgba(var(--ink-rgb),0.065)] transition-[transform,box-shadow] duration-180 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(var(--ink-rgb),0.05)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_14px_28px_rgba(var(--ink-rgb),0.05)] max-sm:min-h-0 max-sm:gap-2.5 max-sm:p-3"
                key={item.id}
              >
                <div className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-3.5 max-sm:grid-cols-[44px_minmax(0,1fr)] max-sm:items-center max-sm:gap-3 [&_strong]:block [&_strong]:text-[0.98rem] [&_strong]:text-[#152022] max-sm:[&_strong]:overflow-hidden max-sm:[&_strong]:text-ellipsis max-sm:[&_strong]:whitespace-nowrap [&_small]:mt-1 [&_small]:block [&_small]:text-[0.83rem] [&_small]:text-[rgba(var(--ink-rgb),0.54)] max-sm:[&_small]:line-clamp-2">
                  <div className="size-14 overflow-hidden rounded-[var(--radius-pill)] bg-white shadow-[var(--shadow-md)] max-sm:size-11 [&_img]:block [&_img]:size-full [&_img]:object-cover [&_span]:grid [&_span]:size-full [&_span]:place-items-center [&_span]:text-[1.15rem] [&_span]:font-black [&_span]:text-[var(--accent-strong)]" aria-hidden="true">
                    {"avatarUrl" in item && item.avatarUrl ? (
                      <RevealImage
                        src={item.avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{item.name.slice(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.meta}</small>
                  </div>
                </div>
                <p className="m-0 block text-[0.92rem] leading-[1.68] text-[rgba(var(--ink-rgb),0.68)] max-sm:line-clamp-2 max-sm:text-[0.9rem] max-sm:leading-[1.58]">{item.story}</p>
                <div className="flex flex-nowrap gap-2 self-end overflow-hidden" aria-label="成员技能标签">
                  {item.tags[0] ? <span className="shrink-0 self-end whitespace-nowrap rounded-[var(--radius-pill)] bg-[rgba(241,248,243,0.72)] px-2.5 py-1.5 text-[0.84rem] leading-none font-extrabold text-[#20a06d] max-sm:max-w-full max-sm:overflow-hidden max-sm:text-ellipsis">{item.tags[0]}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[rgba(var(--accent-rgb),0.24)] bg-[rgba(var(--accent-rgb),0.06)] p-[26px] text-[rgba(var(--ink-rgb),0.68)]">
            暂无成员故事，期待你加入后在这里分享经验。
          </div>
        )}
      </section>

      <SiteSponsors />
    </div>
  );
}
