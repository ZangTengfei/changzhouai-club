import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  MapPin,
  PlayCircle,
  Sparkles,
  Ticket,
} from "lucide-react";

import { RevealImage } from "@/components/reveal-image";
import { JsonLd } from "@/components/json-ld";

import { EventDetailRegistrationPanel } from "@/components/event-detail-registration-panel";
import { getPublicEventBySlug } from "@/lib/community-events";
import { getPublicCommunityUpdatesForEvent } from "@/lib/community-updates";
import {
  getExternalRegistrationLabel,
  getExternalRegistrationUrl,
  getRegistrationNoteWithoutUrl,
} from "@/lib/event-registration-link";
import { getEventImageUrl } from "@/lib/public-image-url";
import {
  SITE_NAME,
  SITE_URL,
  createNoIndexMetadata,
  createPageMetadata,
} from "@/lib/seo";
import { cn } from "@/lib/utils";

const eventPanelClassName =
  "grid min-w-0 gap-5 rounded-[var(--radius-lg)] bg-white p-6 shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-sm:p-5";
const eventSectionHeadingClassName =
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 max-[820px]:grid-cols-1 max-[820px]:gap-3 [&_h2]:m-0 [&_h2]:text-[2rem] [&_h2]:leading-[1.1] [&_h2]:font-black [&_h2]:tracking-normal [&_h2]:text-[#111a1d] [&_div>p]:mt-2 [&_div>p]:mb-0 [&_div>p]:text-[0.98rem] [&_div>p]:leading-[1.65] [&_div>p]:font-[650] [&_div>p]:text-[rgba(var(--ink-rgb),0.64)]";
const eventStatusPillClassName =
  "inline-flex min-h-[30px] max-w-full items-center justify-self-start rounded-[var(--radius-pill)] px-3 text-[0.88rem] leading-[1.2] font-[850]";
const eventStatusToneClassNames: Record<string, string> = {
  green: "bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent-strong)]",
  orange: "bg-[rgba(238,127,24,0.12)] text-[#b95e14]",
  blue: "bg-[rgba(42,123,211,0.12)] text-[#2363b8]",
};
const eventSoftNoteClassName =
  "min-w-0 rounded-[var(--radius-md)] border border-dashed border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--accent-rgb),0.07)] px-4 py-[15px] text-[0.95rem] leading-[1.62] font-bold text-[rgba(var(--ink-rgb),0.68)] [overflow-wrap:anywhere] [word-break:break-word]";

type EventDetailSearchParams = {
  registration?: string;
  error?: string;
};

const statusToneMap: Record<string, string> = {
  scheduled: "green",
  completed: "orange",
  cancelled: "blue",
};

function formatRelatedUpdateDate(value: string | null) {
  if (!value) {
    return "发布时间待定";
  }

  return value.split("T")[0]?.replaceAll("-", ".") ?? value.replaceAll("-", ".");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    return createNoIndexMetadata(
      "活动详情",
      "查看常州 AI Club 的活动详情。",
      `/events/${slug}`,
    );
  }

  return createPageMetadata({
    title: event.title,
    description: event.summary,
    path: `/events/${event.slug}`,
    image: event.imageUrl,
    imageAlt: `${event.title} 活动现场`,
  });
}

function getEventSchemaStatus(status: string) {
  if (status === "completed") {
    return "https://schema.org/EventCompleted";
  }

  if (status === "cancelled") {
    return "https://schema.org/EventCancelled";
  }

  return "https://schema.org/EventScheduled";
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<EventDetailSearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const event = await getPublicEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const relatedUpdates = await getPublicCommunityUpdatesForEvent(event.slug);
  const detailHref = `/events/${event.slug}`;
  const hasOverview = event.descriptionParagraphs.length > 0;
  const hasAgenda = event.agendaItems.length > 0;
  const hasSpeakers = event.speakerItems.length > 0;
  const hasRecap = event.recapParagraphs.length > 0;
  const hasRelatedUpdates = relatedUpdates.length > 0;
  const statusTone = statusToneMap[event.status] ?? "green";
  const eventDocsHref = event.docsUrl?.startsWith("http") ? event.docsUrl : null;
  const videoPosterUrl = event.video?.coverUrl
    ? getEventImageUrl(event.video.coverUrl, "event-detail-hero") ?? event.video.coverUrl
    : undefined;
  const registrationNote = getRegistrationNoteWithoutUrl(
    event.registrationNote,
    event.registrationUrl,
  );
  const externalRegistrationUrl =
    event.status === "scheduled"
      ? getExternalRegistrationUrl(event.registrationUrl, event.registrationNote)
      : null;
  const eventHighlights = [
    {
      label: "活动状态",
      value: event.statusLabel,
      icon: Ticket,
    },
    {
      label: "活动类型",
      value: event.eventTypeLabel,
      icon: Sparkles,
    },
    {
      label: "活动时间",
      value: event.dateTimeLabel,
      icon: CalendarDays,
    },
    {
      label: "活动地点",
      value: event.locationLabel,
      icon: MapPin,
    },
    {
      label: "现场照片",
      value: event.gallery.length > 0 ? `${event.gallery.length} 张` : "待补充",
      icon: Camera,
    },
  ];
  const structuredData: Array<Record<string, unknown>> = [];

  if (event.eventAt) {
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "Event",
      "@id": `${SITE_URL}${detailHref}#event`,
      name: event.title,
      description: event.summary,
      url: `${SITE_URL}${detailHref}`,
      startDate: event.eventAt,
      eventStatus: getEventSchemaStatus(event.status),
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: event.imageUrl ? [event.imageUrl] : undefined,
      location: {
        "@type": "Place",
        name: event.venue ?? event.locationLabel,
        address: {
          "@type": "PostalAddress",
          addressLocality: event.city ?? "常州",
          addressRegion: "江苏",
          addressCountry: "CN",
        },
      },
      organizer: {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
      },
    });
  }

  structuredData.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "首页",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "活动",
        item: `${SITE_URL}/events`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: event.title,
        item: `${SITE_URL}${detailHref}`,
      },
    ],
  });

  return (
    <div className="grid min-w-0 gap-7 max-sm:gap-[22px]">
      <JsonLd data={structuredData} />
      {query.registration ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[var(--radius-md)] border border-dashed border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.08)] px-[18px] py-4 font-extrabold text-[var(--accent-strong)]">
          <CheckCircle2 className="size-5" aria-hidden="true" strokeWidth={1.9} />
          <span>
            {query.registration === "pending"
              ? "报名申请已提交，请等待组织方审核。"
              : query.registration === "waitlisted"
                ? "当前确认名额已满，你已进入候补。"
                : "报名成功，已经写入你的社区账号记录。"}
          </span>
        </div>
      ) : null}

      {query.error ? (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[var(--radius-md)] border border-dashed border-[rgba(197,91,79,0.28)] bg-[rgba(197,91,79,0.08)] px-[18px] py-4 font-extrabold text-[var(--destructive)]">
          <Clock3 className="size-5" aria-hidden="true" strokeWidth={1.9} />
          <span>报名失败，请稍后再试。</span>
        </div>
      ) : null}

      <section className="grid grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] items-center gap-8 pt-[18px] max-lg:grid-cols-1 max-sm:pt-0" aria-labelledby="event-detail-title">
        <div className="grid content-start gap-5 pt-9 max-lg:pt-2.5 max-sm:gap-[18px] max-sm:pt-[18px]">
          <div className="flex flex-wrap items-center gap-2.5 [&>span:not(:first-child)]:inline-flex [&>span:not(:first-child)]:min-h-9 [&>span:not(:first-child)]:items-center [&>span:not(:first-child)]:rounded-[var(--radius-pill)] [&>span:not(:first-child)]:border [&>span:not(:first-child)]:border-[rgba(var(--ink-rgb),0.08)] [&>span:not(:first-child)]:bg-[rgba(255,252,247,0.74)] [&>span:not(:first-child)]:px-[13px] [&>span:not(:first-child)]:text-[0.88rem] [&>span:not(:first-child)]:font-[850] [&>span:not(:first-child)]:text-[rgba(var(--ink-rgb),0.64)]">
            <span className={cn(eventStatusPillClassName, eventStatusToneClassNames[statusTone])}>
              {event.statusLabel}
            </span>
            <span>{event.dateLabel}</span>
            <span>{event.eventTypeLabel}</span>
            <span>{event.city ?? "常州"}</span>
          </div>

          <div className="grid gap-4">
            <p className="home-kicker">Event Detail · 活动详情</p>
            <h1 className="m-0 text-[3.45rem] leading-[1.08] font-black tracking-normal text-[#111b1f] after:mt-0.5 after:block after:h-[13px] after:w-[min(190px,44vw)] after:-rotate-3 after:rounded-[50%] after:border-[3px] after:border-transparent after:border-t-[rgba(244,190,75,0.78)] after:content-[''] after:[margin-left:38%] max-lg:text-[3.2rem] max-sm:text-[2.72rem] max-sm:after:ml-[34%] max-sm:after:w-[154px]" id="event-detail-title">{event.title}</h1>
            <p className="m-0 max-w-[34rem] text-[1.08rem] leading-[1.82] text-[rgba(var(--ink-rgb),0.72)]">{event.summary}</p>
          </div>

          {externalRegistrationUrl ? (
            <div className="flex flex-wrap items-center gap-3 max-sm:w-full">
              <a
                href={externalRegistrationUrl}
                className="button home-primary-button min-h-[46px] max-sm:w-full max-sm:justify-center [&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_svg]:size-[18px] [&_svg]:flex-none"
                target="_blank"
                rel="noreferrer"
              >
                <Ticket aria-hidden="true" strokeWidth={2} />
                <span>{getExternalRegistrationLabel(externalRegistrationUrl)}</span>
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </a>
            </div>
          ) : null}
        </div>

        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(212,216,209,0.7)] bg-[linear-gradient(180deg,rgba(246,244,238,0.94),rgba(241,239,232,0.88))] p-4 shadow-[0_18px_38px_rgba(var(--ink-rgb),0.08),inset_0_1px_0_rgba(255,255,255,0.7)] max-[820px]:p-3.5">
          <div className="relative z-[2] aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.78)] [&_img]:block [&_img]:size-full [&_img]:object-cover [&_img]:object-center">
            {event.imageUrl ? (
              <RevealImage
                src={getEventImageUrl(event.imageUrl, "event-detail-hero") ?? event.imageUrl}
                alt={event.title}
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div className="grid min-h-full place-content-center place-items-center gap-2.5 text-primary">
                <span className="text-5xl font-black">AI</span>
                <strong className="text-[rgba(var(--ink-rgb),0.68)]">活动图片待补充</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-4 gap-0 rounded-[var(--radius-md)] border border-[rgba(212,216,209,0.7)] bg-[linear-gradient(180deg,rgba(246,244,238,0.94),rgba(241,239,232,0.88))] px-7 pt-[25px] pb-6 shadow-[0_12px_28px_rgba(var(--ink-rgb),0.04),inset_0_1px_0_rgba(255,255,255,0.5)] max-lg:grid-cols-2 max-lg:px-[22px] max-lg:py-5 max-sm:grid-cols-1 max-sm:px-[18px] max-sm:py-1.5" aria-label="活动概览">
        {eventHighlights.map((item, index) => {
          const Icon = item.icon;

          return (
            <article className="relative grid min-h-24 min-w-0 grid-cols-[46px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-[7px] border-r border-[rgba(var(--ink-rgb),0.075)] px-[22px] last:border-r-0 max-lg:border-r-0 max-lg:border-b max-lg:px-6 max-lg:py-[18px] max-lg:odd:border-r max-lg:[&:nth-last-child(-n+2)]:border-b-0 max-sm:min-h-[78px] max-sm:border-r-0! max-sm:border-b! max-sm:px-0 max-sm:py-[18px] max-sm:last:border-b-0!" key={item.label}>
              <Icon className={cn("row-span-3 size-[38px]", ["text-primary", "text-[#ee7f18]", "text-[#2a7bd3]", "text-[#7d63f1]"][index] ?? "text-primary")} aria-hidden="true" strokeWidth={1.9} />
              <strong className={cn("line-clamp-2 overflow-hidden font-[var(--font-latin-rounded)] text-[1.42rem] leading-[1.18] font-[850] [overflow-wrap:anywhere]", ["text-primary", "text-[#ee7f18]", "text-[#2a7bd3]", "text-[#7d63f1]"][index] ?? "text-primary")}>{item.value}</strong>
              <span className="overflow-hidden text-[0.9rem] leading-[1.2] font-[850] text-ellipsis whitespace-nowrap text-[#152524]">{item.label}</span>
              <small className="overflow-hidden text-[0.78rem] leading-[1.2] font-[850] text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.42)]">{String(index + 1).padStart(2, "0")}</small>
            </article>
          );
        })}
      </section>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(300px,340px)] items-start gap-[22px] max-lg:grid-cols-1">
        <main className="grid min-w-0 gap-[22px]">
          <article className={eventPanelClassName}>
            <div className={eventSectionHeadingClassName}>
              <p className="home-kicker">Story</p>
              <div>
                <h2>活动介绍</h2>
                <p>主题背景、适合人群和现场会发生什么。</p>
              </div>
            </div>

            {hasOverview ? (
              <div className="grid gap-3.5 [&_p]:m-0 [&_p]:text-base [&_p]:leading-[1.82] [&_p]:text-[rgba(var(--ink-rgb),0.68)]">
                {event.descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className={eventSoftNoteClassName}>
                活动介绍将围绕主题背景、交流内容与适合参与的人群持续补充。
              </div>
            )}
          </article>

          {hasAgenda || hasSpeakers ? (
            <article className={eventPanelClassName}>
              <div className={eventSectionHeadingClassName}>
                <p className="home-kicker">Flow</p>
                <div>
                  <h2>议程与分享</h2>
                  <p>从议程安排到分享人信息，帮助你提前进入状态。</p>
                </div>
              </div>

              {hasAgenda ? (
                <div className="grid gap-2.5 [&_h3]:m-0 [&_h3]:text-[1.18rem] [&_h3]:text-[#111a1d]">
                  <h3>议程安排</h3>
                  <ul className="m-0 grid list-none gap-2.5 p-0 [counter-reset:event-step] [&_li]:relative [&_li]:grid [&_li]:grid-cols-[36px_minmax(0,1fr)] [&_li]:items-start [&_li]:gap-2.5 [&_li]:leading-[1.62] [&_li]:text-[rgba(var(--ink-rgb),0.68)] [&_li]:[counter-increment:event-step] [&_li]:before:grid [&_li]:before:h-[30px] [&_li]:before:w-9 [&_li]:before:place-items-center [&_li]:before:rounded-[var(--radius-pill)] [&_li]:before:bg-[rgba(var(--accent-rgb),0.1)] [&_li]:before:font-[var(--font-latin-rounded)] [&_li]:before:text-xs [&_li]:before:font-black [&_li]:before:text-primary [&_li]:before:content-[counter(event-step,decimal-leading-zero)]">
                    {event.agendaItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasSpeakers ? (
                <div className="grid gap-2.5 [&_h3]:m-0 [&_h3]:text-[1.18rem] [&_h3]:text-[#111a1d]">
                  <h3>分享人与组织者</h3>
                  <ul className="m-0 grid list-none gap-2.5 p-0 [counter-reset:event-step] [&_li]:relative [&_li]:grid [&_li]:grid-cols-[36px_minmax(0,1fr)] [&_li]:items-start [&_li]:gap-2.5 [&_li]:leading-[1.62] [&_li]:text-[rgba(var(--ink-rgb),0.68)] [&_li]:[counter-increment:event-step] [&_li]:before:grid [&_li]:before:h-[30px] [&_li]:before:w-9 [&_li]:before:place-items-center [&_li]:before:rounded-[var(--radius-pill)] [&_li]:before:bg-[rgba(var(--accent-rgb),0.1)] [&_li]:before:font-[var(--font-latin-rounded)] [&_li]:before:text-xs [&_li]:before:font-black [&_li]:before:text-primary [&_li]:before:content-[counter(event-step,decimal-leading-zero)]">
                    {event.speakerItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ) : (
            <article className={eventPanelClassName}>
              <div className={eventSectionHeadingClassName}>
                <p className="home-kicker">Flow</p>
                <div>
                  <h2>议程与分享</h2>
                  <p>议程安排与分享信息将在确认后更新到本页。</p>
                </div>
              </div>

              <div className={eventSoftNoteClassName}>
                活动基本信息已发布，详细介绍与议程内容将陆续补充。
              </div>
            </article>
          )}

          {event.video ? (
            <article className={eventPanelClassName}>
              <div className={eventSectionHeadingClassName}>
                <p className="home-kicker">Video</p>
                <div>
                  <h2>活动视频</h2>
                  <p>回看现场分享和关键讨论，方便错过活动的朋友补上上下文。</p>
                </div>
              </div>

              <div className="aspect-video overflow-hidden rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[#101518] shadow-[var(--shadow-md)] [&_video]:block [&_video]:size-full [&_video]:bg-[#101518] [&_video]:object-contain">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  poster={videoPosterUrl}
                  aria-label={event.video.title ?? event.title}
                >
                  <source src={event.video.url} type="video/mp4" />
                  <a href={event.video.url}>打开活动视频</a>
                </video>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a className="inline-flex min-h-[34px] items-center gap-[7px] rounded-[var(--radius-pill)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.72)] px-3 text-[0.86rem] leading-[1.2] font-[850] text-[#2363b8] no-underline [&_svg]:size-[17px]" href={event.video.url} target="_blank" rel="noreferrer">
                  新窗口打开
                  <ArrowRight aria-hidden="true" strokeWidth={1.8} />
                </a>
              </div>
            </article>
          ) : null}

          {hasRecap ? (
            <section className={eventPanelClassName}>
              <div className={eventSectionHeadingClassName}>
                <p className="home-kicker">After Event</p>
                <div>
                  <h2>活动回顾</h2>
                  <p>这里记录活动中的重点内容、交流线索与值得沉淀的现场观察。</p>
                </div>
              </div>

              <div className="grid gap-3.5 [&_p]:m-0 [&_p]:text-base [&_p]:leading-[1.82] [&_p]:text-[rgba(var(--ink-rgb),0.68)]">
                {event.recapParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <aside className="sticky top-[92px] grid min-w-0 gap-4 max-lg:static" aria-label="活动侧栏">
          <article className={`${eventPanelClassName} gap-[18px] p-5`}>
            <div className="grid justify-items-start gap-3">
              <span className={cn(eventStatusPillClassName, eventStatusToneClassNames[statusTone])}>
                {event.statusLabel}
              </span>
              <h2 className="m-0 text-[1.45rem] leading-[1.12] font-black text-[#111a1d]">活动信息</h2>
            </div>

            <ul className="m-0 grid list-none gap-3 p-0 [&_li]:grid [&_li]:min-h-14 [&_li]:min-w-0 [&_li]:grid-cols-[32px_minmax(0,1fr)] [&_li]:items-start [&_li]:gap-x-3 [&_li]:gap-y-1.5 [&_li]:rounded-[var(--radius-md)] [&_li]:border [&_li]:border-[rgba(var(--ink-rgb),0.06)] [&_li]:bg-[rgba(255,252,247,0.62)] [&_li]:p-3 max-sm:[&_li]:gap-x-2.5 max-sm:[&_li]:gap-y-2 [&_li_svg]:row-span-2 [&_li_svg]:size-[22px] [&_li_svg]:text-primary [&_li_span]:text-[0.86rem] [&_li_span]:font-extrabold [&_li_span]:text-[rgba(var(--ink-rgb),0.52)] [&_li_strong]:col-start-2 [&_li_strong]:overflow-hidden [&_li_strong]:text-[0.94rem] [&_li_strong]:leading-[1.45] [&_li_strong]:text-ellipsis [&_li_strong]:text-[#132321] [&_li_strong]:[overflow-wrap:anywhere]">
              <li>
                <Sparkles aria-hidden="true" strokeWidth={1.8} />
                <span>活动类型</span>
                <strong>{event.eventTypeLabel}</strong>
              </li>
              <li>
                <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                <span>活动时间</span>
                <strong>{event.dateTimeLabel}</strong>
              </li>
              <li>
                <MapPin aria-hidden="true" strokeWidth={1.8} />
                <span>活动地点</span>
                <strong>{event.locationLabel}</strong>
              </li>
              <li>
                <Camera aria-hidden="true" strokeWidth={1.8} />
                <span>现场照片</span>
                <strong>{event.gallery.length > 0 ? `${event.gallery.length} 张` : "待补充"}</strong>
              </li>
              <li>
                <ListChecks aria-hidden="true" strokeWidth={1.8} />
                <span>议程安排</span>
                <strong>{hasAgenda ? `${event.agendaItems.length} 项` : "待补充"}</strong>
              </li>
              {eventDocsHref ? (
                <li>
                  <FileText aria-hidden="true" strokeWidth={1.8} />
                  <span>活动资料</span>
                  <strong>已发布</strong>
                </li>
              ) : null}
              {event.video ? (
                <li>
                  <PlayCircle aria-hidden="true" strokeWidth={1.8} />
                  <span>活动视频</span>
                  <strong>已发布</strong>
                </li>
              ) : null}
              {hasRelatedUpdates ? (
                <li>
                  <FileText aria-hidden="true" strokeWidth={1.8} />
                  <span>活动报道</span>
                  <strong>{relatedUpdates.length} 篇</strong>
                </li>
              ) : null}
            </ul>

            {registrationNote ? (
              <div className={eventSoftNoteClassName}>{registrationNote}</div>
            ) : null}

            <div className="grid gap-2.5 [&_.button]:w-full [&_.button]:max-w-full [&_.button]:justify-center [&_svg]:size-[18px]">
              <Link href="/events" className="button home-ghost-button">
                <ArrowLeft aria-hidden="true" strokeWidth={2} />
                返回活动列表
              </Link>
              {eventDocsHref ? (
                <a
                  href={eventDocsHref}
                  className="button home-primary-button"
                  target="_blank"
                  rel="noreferrer"
                >
                  查看活动资料
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </a>
              ) : null}
              {event.status === "completed" ? (
                <Link href="/archive" className="button home-ghost-button">
                  更多往期回顾
                </Link>
              ) : null}
            </div>
          </article>

          {event.status === "scheduled" ? (
            <div id="registration" className="min-w-0 scroll-mt-24 [&_.event-registration-card]:grid [&_.event-registration-card]:min-w-0 [&_.event-registration-card]:gap-3.5 [&_.event-registration-card]:rounded-[var(--radius-lg)] [&_.event-registration-card]:border [&_.event-registration-card]:border-[rgba(var(--accent-rgb),0.15)] [&_.event-registration-card]:bg-white [&_.event-registration-card]:p-[22px] [&_.event-registration-card]:shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-sm:[&_.event-registration-card]:p-5 [&_.event-registration-card_h3]:m-0 [&_.event-registration-card_h3]:text-[1.45rem] [&_.event-registration-card_h3]:leading-[1.18] [&_.event-registration-card_h3]:text-[#111a1d] [&_.event-registration-card_p]:m-0 [&_.event-registration-card_p]:leading-[1.62] [&_.event-registration-card_p]:text-[rgba(var(--ink-rgb),0.64)] [&_.note-strip]:min-w-0 [&_.note-strip]:[overflow-wrap:anywhere] [&_.note-strip]:[word-break:break-word] [&_.detail-list]:m-0 [&_.detail-list]:grid [&_.detail-list]:gap-2 [&_.detail-list]:pl-[18px] [&_.registration-form]:grid [&_.registration-form]:gap-3 [&_.textarea]:min-h-[110px]">
              <EventDetailRegistrationPanel event={event} redirectTo={detailHref} />
            </div>
          ) : (
            <article className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-[var(--radius-md)] bg-[#e9f9f0] p-[18px] max-sm:p-5 [&_h2]:m-0 [&_h2]:text-[1.12rem] [&_h2]:font-black [&_h2]:text-[#111a1d] [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[0.92rem] [&_p]:leading-[1.58] [&_p]:font-[650] [&_p]:text-[rgba(var(--ink-rgb),0.64)]">
              <Sparkles className="size-7 text-[#f4c75d]" aria-hidden="true" strokeWidth={1.9} />
              <div>
                <h2>{event.status === "completed" ? "活动已结束" : "当前状态"}</h2>
                <p>
                  {event.status === "completed"
                    ? "回顾内容、完整纪要和现场照片会在这里持续沉淀。"
                    : "相关信息以页面发布内容为准。"}
                </p>
              </div>
            </article>
          )}
        </aside>
      </div>

      {hasRelatedUpdates ? (
        <section className={eventPanelClassName}>
          <div className={eventSectionHeadingClassName}>
            <p className="home-kicker">Updates</p>
            <div>
              <h2>活动报道与社区动态</h2>
              <p>完整推文、复盘文章和成员视角会在这里关联到本场活动。</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 max-lg:grid-cols-1">
            {relatedUpdates.map((update) => {
              const coverImage = update.images[0];

              return (
                <Link
                  href={update.href}
                  className={cn(
                    "grid min-h-[148px] min-w-0 grid-cols-[minmax(110px,0.42fr)_minmax(0,1fr)] items-stretch gap-3.5 rounded-[var(--radius-md)] bg-[#edf5ff] p-3.5 text-inherit no-underline transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 max-sm:grid-cols-1 [&>i]:col-span-full [&>i]:inline-flex [&>i]:items-center [&>i]:justify-self-start [&>i]:gap-[7px] [&>i]:text-[0.86rem] [&>i]:font-black [&>i]:not-italic [&>i]:text-primary [&>i_svg]:size-4",
                    !coverImage && "grid-cols-1",
                  )}
                  key={update.id}
                >
                  {coverImage ? (
                    <span className="min-w-0 overflow-hidden rounded-[var(--radius-sm)] bg-[rgba(var(--accent-rgb),0.08)] max-sm:aspect-[1.9/1] [&_img]:block [&_img]:h-full [&_img]:min-h-[120px] [&_img]:w-full [&_img]:object-cover">
                      <RevealImage
                        src={coverImage.imageUrl}
                        alt={coverImage.alt ?? update.title ?? update.typeLabel}
                        loading="lazy"
                      />
                    </span>
                  ) : null}
                  <span className="grid min-w-0 content-start gap-[7px]">
                    <small className="min-w-0 text-[0.8rem] font-extrabold text-[rgba(var(--ink-rgb),0.52)]">
                      {update.typeLabel} ·{" "}
                      {formatRelatedUpdateDate(update.publishedAt ?? update.createdAt)}
                    </small>
                    <strong className="line-clamp-2 min-w-0 overflow-hidden text-[1.04rem] leading-[1.38] text-[#111a1d]">{update.title ?? update.typeLabel}</strong>
                    <span className="line-clamp-3 min-w-0 overflow-hidden text-[0.9rem] leading-[1.58] text-[rgba(var(--ink-rgb),0.66)]">{update.excerpt}</span>
                  </span>
                  <i>
                    阅读全文
                    <ArrowRight aria-hidden="true" strokeWidth={1.8} />
                  </i>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {event.gallery.length > 0 ? (
        <section className={eventPanelClassName}>
          <div className={eventSectionHeadingClassName}>
            <p className="home-kicker">Gallery</p>
            <div>
              <h2>现场照片</h2>
              <p>通过现场照片回看活动氛围与交流瞬间。</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {event.gallery.map((image) => (
              <article className="min-w-0 overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)]" key={image.id}>
                <div className="aspect-[4/3] overflow-hidden bg-[rgba(var(--accent-rgb),0.08)] [&_img]:block [&_img]:size-full [&_img]:object-cover">
                  <RevealImage
                    src={getEventImageUrl(image.imageUrl, "gallery") ?? image.imageUrl}
                    alt={image.caption ?? event.title}
                    loading="lazy"
                  />
                </div>
                <div className="grid gap-1.5 p-4">
                  <h3 className="m-0 overflow-hidden text-base leading-[1.25] text-ellipsis whitespace-nowrap text-[#111a1d]">{event.title}</h3>
                  {image.caption && image.caption !== event.title ? <p className="m-0 text-[0.9rem] leading-[1.52] text-[rgba(var(--ink-rgb),0.62)]">{image.caption}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
