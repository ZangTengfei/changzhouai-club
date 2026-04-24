import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  MapPin,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { EventsRegistrationGrid } from "@/components/events-registration-grid";
import { getCompletedEventRecaps, getScheduledEvents } from "@/lib/community-events";
import { getEventImageUrl } from "@/lib/public-image-url";

import styles from "./events-page.module.css";

export const metadata: Metadata = {
  title: "活动",
  description: "浏览常州 AI Club 的近期活动与往期回顾。",
};

function formatEventMetricDate(value: string | null) {
  if (!value) {
    return "待公布";
  }

  const [, month, day] = value.split("-");

  if (!month || !day) {
    return value.replaceAll("-", ".");
  }

  return `${month}.${day}`;
}

function formatEventDateTime(value: string | null) {
  if (!value) {
    return "时间待定";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const eventFlowSteps = [
  {
    title: "先来听一场",
    summary: "从 AI 工具、产品实践到真实案例，快速找到你感兴趣的话题。",
    tone: "green",
  },
  {
    title: "现场认识人",
    summary: "和开发者、产品人、创业者面对面交流，把名字变成真实连接。",
    tone: "orange",
  },
  {
    title: "把想法带走",
    summary: "把灵感沉淀成项目、合作线索或下一次分享的主题。",
    tone: "blue",
  },
] as const;

const eventFlowToneClassName = {
  green: "",
  orange: styles.flowCardOrange,
  blue: styles.flowCardBlue,
} satisfies Record<(typeof eventFlowSteps)[number]["tone"], string>;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [completedEvents, scheduledEvents] = await Promise.all([
    getCompletedEventRecaps(),
    getScheduledEvents(),
  ]);
  const nextEvent = scheduledEvents[0];
  const latestCompletedEvent = completedEvents[0];
  const heroImageUrl =
    latestCompletedEvent?.imageUrl
      ? getEventImageUrl(latestCompletedEvent.imageUrl, "event-detail-hero") ??
        latestCompletedEvent.imageUrl
      : null;
  const totalPhotoCount = completedEvents.reduce(
    (count, event) => count + event.gallery.length,
    0,
  );
  const eventStats = [
    {
      value: scheduledEvents.length > 0 ? `${scheduledEvents.length} 场` : "开放中",
      label: "近期活动",
      detail: nextEvent?.title ?? "下一场主题正在筹备",
      icon: CalendarDays,
    },
    {
      value: `${completedEvents.length} 场`,
      label: "往期回顾",
      detail: "技术分享与线下交流",
      icon: UsersRound,
    },
    {
      value: totalPhotoCount > 0 ? `${totalPhotoCount} 张` : "持续补充",
      label: "现场记录",
      detail: "用图片保留活动氛围",
      icon: Camera,
    },
    {
      value: formatEventMetricDate(latestCompletedEvent?.isoDate ?? null),
      label: "最近更新",
      detail: latestCompletedEvent?.title ?? "活动内容陆续归档",
      icon: Sparkles,
    },
  ];

  return (
    <div className={styles.pageStack}>
      {params.registered ? (
        <div className={styles.statusNote}>报名成功，已经写入你的社区账号记录。</div>
      ) : null}

      {params.error ? (
        <div className={`${styles.statusNote} ${styles.statusNoteError}`}>
          报名失败，请稍后再试。
        </div>
      ) : null}

      <section className={styles.hero} aria-labelledby="events-hero-title">
        <div className={styles.heroCopy}>
          <p className="home-kicker">Events · 线下相遇</p>
          <h1 id="events-hero-title">
            把每一次相遇，
            <span>变成下一次共创</span>
          </h1>
          <p>
            在这里找到近期开放报名的活动，也回看社区过去的分享、讨论和现场照片。
            活动是常州 AI Club 最稳定的连接方式。
          </p>

          <div className={styles.heroActions}>
            <Link href="#upcoming" className="button home-primary-button">
              查看报名
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="#reviews" className="button home-ghost-button">
              往期回顾
            </Link>
          </div>

          <div className={styles.heroProof}>
            {eventStats.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.label}>
                  <Icon aria-hidden="true" strokeWidth={1.9} />
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                  <small>{item.detail}</small>
                </article>
              );
            })}
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroPhoto}>
            {heroImageUrl ? (
              <img
                src={heroImageUrl}
                alt={latestCompletedEvent?.title ?? "常州 AI Club 活动现场"}
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div className={styles.heroPhotoFallback}>
                <span>AI</span>
                <strong>下一张现场照片，等你入镜</strong>
              </div>
            )}
          </div>

          <article className={styles.nextCard}>
            <p>下一场活动</p>
            <h2>{nextEvent?.title ?? "新的线下活动正在筹备"}</h2>
            <div>
              <span>
                <CalendarDays aria-hidden="true" strokeWidth={1.9} />
                {formatEventDateTime(nextEvent?.event_at ?? null)}
              </span>
              <span>
                <MapPin aria-hidden="true" strokeWidth={1.9} />
                {nextEvent?.venue
                  ? `${nextEvent.city ?? "常州"} · ${nextEvent.venue}`
                  : "常州 · 线下空间待公布"}
              </span>
            </div>
            <Link href={nextEvent ? `/events/${nextEvent.slug}` : "#upcoming"}>
              查看详情 <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </article>

          <div className={styles.stickyNote}>
            <span>活动现场</span>
            <strong>见面聊，比群里聊更快一步</strong>
          </div>
          <DoodleSparkles className={styles.heroDoodle} />
          <HandDrawnArrow className={styles.heroArrow} />
        </div>
      </section>

      <section className={styles.flowStrip} aria-label="活动参与方式">
        {eventFlowSteps.map((item, index) => (
          <article
            className={`${styles.flowCard} ${eventFlowToneClassName[item.tone]}`}
            key={item.title}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
          </article>
        ))}
      </section>

      <section className={styles.upcomingSection} id="upcoming">
        <div className={styles.sectionHeading}>
          <p className="home-kicker">Upcoming</p>
          <div>
            <h2>近期活动报名</h2>
            <p>查看开放报名的活动，获取时间、地点、主题介绍与报名入口。</p>
          </div>
        </div>

        {scheduledEvents.length > 0 ? (
          <EventsRegistrationGrid events={scheduledEvents} />
        ) : (
          <div className={styles.emptyPanel}>
            <strong>暂无开放报名的活动</strong>
            <p>新的线下安排确认后会发布在这里，也会同步到社区通知。</p>
          </div>
        )}
      </section>

      <section className={styles.recapSection} id="reviews">
        <div className={styles.sectionHeading}>
          <p className="home-kicker">Recap</p>
          <div>
            <h2>往期活动回顾</h2>
            <p>
              共收录 {completedEvents.length} 场活动，用照片、主题和摘要保留现场发生过的连接。
            </p>
          </div>
        </div>

        {completedEvents.length > 0 ? (
          <div className={styles.recapList}>
            {completedEvents.map((item, index) => (
              <article className={styles.recapCard} key={item.id}>
                <Link className={styles.recapMedia} href={`/events/${item.slug}`}>
                  <span>{item.dateLabel}</span>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </Link>
                <div className={styles.recapImage}>
                  {item.imageUrl ? (
                    <img
                      src={getEventImageUrl(item.imageUrl, "event-feature") ?? item.imageUrl}
                      alt={item.title}
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                    />
                  ) : (
                    <div className={styles.recapImageFallback}>活动图片待补充</div>
                  )}
                </div>

                <div className={styles.recapCopy}>
                  <div className={styles.recapMeta}>
                    <span>{item.locationLabel}</span>
                    <span>
                      {item.gallery.length > 0
                        ? `${item.gallery.length} 张照片`
                        : "已归档"}
                    </span>
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  <div className={styles.recapTags}>
                    {item.highlights.map((highlight) => (
                      <span key={highlight}>{highlight}</span>
                    ))}
                  </div>
                  <Link href={`/events/${item.slug}`} className={styles.recapLink}>
                    查看活动详情
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyPanel}>
            <strong>暂无往期活动回顾</strong>
            <p>第一场活动完成后，现场照片与内容摘要会在这里归档。</p>
          </div>
        )}
      </section>
    </div>
  );
}
