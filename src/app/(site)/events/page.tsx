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

import styles from "./events-page.module.css";

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
  return (
    <div className={styles.pageStack} data-events-page>
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
            一起见面，
            <span>做点新东西</span>
          </h1>
          <p>
            查看近期开放报名的活动，也回看社区现场。
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
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroPhoto}>
            {heroImageUrl ? (
              <RevealImage
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
            <p>{nextEvent?.eventTypeLabel ?? "下一场活动"}</p>
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
            <Link href={nextEvent ? `/events/${nextEvent.slug}` : "#upcoming"} prefetch={false}>
              查看详情 <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </article>

        </div>
      </section>

      <section className={styles.proposalSection} aria-labelledby="event-proposal-title">
        <div className={styles.proposalCopy}>
          <p className="home-kicker">Host · 群友发起</p>
          <h2 id="event-proposal-title">有主题，也可以申请发起一场活动</h2>
          <p>
            有实践、有案例，也可以申请发起一场活动。审核通过后，再一起确认排期和现场支持。
          </p>
        </div>

        <div className={styles.proposalNotes} aria-label="活动发起申请规则">
          {eventProposalNotes.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title}>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <strong>{item.title}</strong>
                <span>{item.summary}</span>
              </article>
            );
          })}
        </div>

        <Link
          href="/events/propose"
          prefetch={false}
          className={`button home-primary-button ${styles.proposalCta}`}
        >
          提交活动申请
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </Link>
      </section>

      <section className={styles.upcomingSection} id="upcoming">
        <div className={styles.sectionHeading}>
          <p className="home-kicker">Upcoming</p>
          <div>
            <h2>近期活动报名</h2>
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
            <p>已收录 {completedEvents.length} 场活动</p>
          </div>
        </div>

        {completedEvents.length > 0 ? (
          <div className={styles.recapList}>
            {completedEvents.map((item, index) => (
              <article className={styles.recapCard} key={item.id}>
                <Link
                  className={styles.recapMedia}
                  href={`/events/${item.slug}`}
                  prefetch={false}
                >
                  <span>{item.dateLabel}</span>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </Link>
                <div className={styles.recapImage}>
                  {item.imageUrl ? (
                    <RevealImage
                      src={getEventImageUrl(item.imageUrl, "event-feature") ?? item.imageUrl}
                      alt={item.title}
                    />
                  ) : (
                    <div className={styles.recapImageFallback}>活动图片待补充</div>
                  )}
                </div>

                <div className={styles.recapCopy}>
                  <div className={styles.recapMeta}>
                    <span
                      className={`${styles.eventTypeBadge} ${
                        item.eventType === "external"
                          ? styles.eventTypeBadgeExternal
                          : styles.eventTypeBadgeCommunity
                      }`}
                    >
                      {item.eventTypeLabel}
                    </span>
                    <span>{item.locationLabel}</span>
                    <span>
                      {(item.gallery?.length ?? 0) > 0
                        ? `${item.gallery?.length ?? 0} 张照片`
                        : "已归档"}
                    </span>
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  <Link
                    href={`/events/${item.slug}`}
                    prefetch={false}
                    className={styles.recapLink}
                  >
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
