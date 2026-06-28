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

import { EventDetailRegistrationPanel } from "@/components/event-detail-registration-panel";
import { getPublicEventBySlug } from "@/lib/community-events";
import { getPublicCommunityUpdatesForEvent } from "@/lib/community-updates";
import {
  getExternalRegistrationLabel,
  getExternalRegistrationUrl,
  getRegistrationNoteWithoutUrl,
} from "@/lib/event-registration-link";
import { getEventImageUrl } from "@/lib/public-image-url";

import styles from "./event-detail-page.module.css";

type EventDetailSearchParams = {
  registered?: string;
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
    return {
      title: "活动详情",
      description: "查看常州 AI Club 的活动详情。",
    };
  }

  return {
    title: event.title,
    description: event.summary,
  };
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
  const eventDocsHref = event.docsUrl;
  const isExternalDocsHref = eventDocsHref?.startsWith("http") ?? false;
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

  return (
    <div className={styles.eventDetailPage}>
      {query.registered ? (
        <div className={styles.statusNote}>
          <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
          <span>报名成功，已经写入你的社区账号记录。</span>
        </div>
      ) : null}

      {query.error ? (
        <div className={`${styles.statusNote} ${styles.statusNoteError}`}>
          <Clock3 aria-hidden="true" strokeWidth={1.9} />
          <span>报名失败，请稍后再试。</span>
        </div>
      ) : null}

      <section className={styles.eventHero} aria-labelledby="event-detail-title">
        <div className={styles.eventHeroCopy}>
          <div className={styles.eventMetaRow}>
            <span className={`${styles.eventStatusPill} ${styles[`eventStatusPill${statusTone}`]}`}>
              {event.statusLabel}
            </span>
            <span>{event.dateLabel}</span>
            <span>{event.eventTypeLabel}</span>
            <span>{event.city ?? "常州"}</span>
          </div>

          <div className={styles.eventHeroHeading}>
            <p className="home-kicker">Event Detail · 活动详情</p>
            <h1 id="event-detail-title">{event.title}</h1>
            <p>{event.summary}</p>
          </div>

          {externalRegistrationUrl ? (
            <div className={styles.eventHeroActions}>
              <a
                href={externalRegistrationUrl}
                className={`button home-primary-button ${styles.eventHeroRegistrationButton}`}
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

        <div className={styles.eventHeroVisual}>
          <div className={styles.eventHeroMedia}>
            {event.imageUrl ? (
              <img
                src={getEventImageUrl(event.imageUrl, "event-detail-hero") ?? event.imageUrl}
                alt={event.title}
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div className={styles.eventImageFallback}>
                <span>AI</span>
                <strong>活动图片待补充</strong>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.eventQuickFacts} aria-label="活动概览">
        {eventHighlights.map((item, index) => {
          const Icon = item.icon;

          return (
            <article className={styles.eventQuickFact} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.9} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{String(index + 1).padStart(2, "0")}</small>
            </article>
          );
        })}
      </section>

      <div className={styles.eventBodyLayout}>
        <main className={styles.eventMainFlow}>
          <article className={styles.eventContentPanel}>
            <div className={styles.eventSectionHeading}>
              <p className="home-kicker">Story</p>
              <div>
                <h2>活动介绍</h2>
                <p>主题背景、适合人群和现场会发生什么。</p>
              </div>
            </div>

            {hasOverview ? (
              <div className={styles.eventRichtext}>
                {event.descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className={styles.eventSoftNote}>
                活动介绍将围绕主题背景、交流内容与适合参与的人群持续补充。
              </div>
            )}
          </article>

          {hasAgenda || hasSpeakers ? (
            <article className={styles.eventContentPanel}>
              <div className={styles.eventSectionHeading}>
                <p className="home-kicker">Flow</p>
                <div>
                  <h2>议程与分享</h2>
                  <p>从议程安排到分享人信息，帮助你提前进入状态。</p>
                </div>
              </div>

              {hasAgenda ? (
                <div className={styles.eventListBlock}>
                  <h3>议程安排</h3>
                  <ul className={styles.eventStepList}>
                    {event.agendaItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {hasSpeakers ? (
                <div className={styles.eventListBlock}>
                  <h3>分享人与组织者</h3>
                  <ul className={styles.eventStepList}>
                    {event.speakerItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ) : (
            <article className={styles.eventContentPanel}>
              <div className={styles.eventSectionHeading}>
                <p className="home-kicker">Flow</p>
                <div>
                  <h2>议程与分享</h2>
                  <p>议程安排与分享信息将在确认后更新到本页。</p>
                </div>
              </div>

              <div className={styles.eventSoftNote}>
                活动基本信息已发布，详细介绍与议程内容将陆续补充。
              </div>
            </article>
          )}

          {event.video ? (
            <article className={styles.eventVideoPanel}>
              <div className={styles.eventSectionHeading}>
                <p className="home-kicker">Video</p>
                <div>
                  <h2>活动视频</h2>
                  <p>回看现场分享和关键讨论，方便错过活动的朋友补上上下文。</p>
                </div>
              </div>

              <div className={styles.eventVideoFrame}>
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

              <div className={styles.eventVideoMeta}>
                <a href={event.video.url} target="_blank" rel="noreferrer">
                  新窗口打开
                  <ArrowRight aria-hidden="true" strokeWidth={1.8} />
                </a>
              </div>
            </article>
          ) : null}

          {hasRecap ? (
            <section className={styles.eventRecapPanel}>
              <div className={styles.eventSectionHeading}>
                <p className="home-kicker">After Event</p>
                <div>
                  <h2>活动回顾</h2>
                  <p>这里记录活动中的重点内容、交流线索与值得沉淀的现场观察。</p>
                </div>
              </div>

              <div className={styles.eventRichtext}>
                {event.recapParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <aside className={styles.eventSidebar} aria-label="活动侧栏">
          <article className={styles.eventSidebarCard}>
            <div className={styles.eventSidebarHeading}>
              <span className={`${styles.eventStatusPill} ${styles[`eventStatusPill${statusTone}`]}`}>
                {event.statusLabel}
              </span>
              <h2>活动信息</h2>
            </div>

            <ul className={styles.eventDetailList}>
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
                  <span>完整纪要</span>
                  <strong>已整理到文档</strong>
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
              <div className={styles.eventSoftNote}>{registrationNote}</div>
            ) : null}

            <div className={styles.eventSidebarActions}>
              <Link href="/events" className="button home-ghost-button">
                <ArrowLeft aria-hidden="true" strokeWidth={2} />
                返回活动列表
              </Link>
              {eventDocsHref ? (
                isExternalDocsHref ? (
                  <a
                    href={eventDocsHref}
                    className="button home-primary-button"
                    target="_blank"
                    rel="noreferrer"
                  >
                    阅读完整纪要
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </a>
                ) : (
                  <Link href={eventDocsHref} className="button home-primary-button">
                    阅读完整纪要
                    <ArrowRight aria-hidden="true" strokeWidth={2} />
                  </Link>
                )
              ) : null}
              {event.status === "completed" ? (
                <Link href="/archive" className="button home-ghost-button">
                  更多往期回顾
                </Link>
              ) : null}
            </div>
          </article>

          {event.status === "scheduled" ? (
            <div className={styles.eventRegistrationPanel}>
              <EventDetailRegistrationPanel event={event} redirectTo={detailHref} />
            </div>
          ) : (
            <article className={styles.eventStatusPanel}>
              <Sparkles aria-hidden="true" strokeWidth={1.9} />
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
        <section className={styles.eventRelatedUpdatesPanel}>
          <div className={styles.eventSectionHeading}>
            <p className="home-kicker">Updates</p>
            <div>
              <h2>活动报道与社区动态</h2>
              <p>完整推文、复盘文章和成员视角会在这里关联到本场活动。</p>
            </div>
          </div>

          <div className={styles.eventRelatedUpdateList}>
            {relatedUpdates.map((update) => {
              const coverImage = update.images[0];

              return (
                <Link
                  href={update.href}
                  className={
                    coverImage
                      ? styles.eventRelatedUpdateCard
                      : `${styles.eventRelatedUpdateCard} ${styles.eventRelatedUpdateCardNoMedia}`
                  }
                  key={update.id}
                >
                  {coverImage ? (
                    <span className={styles.eventRelatedUpdateMedia}>
                      <img
                        src={coverImage.imageUrl}
                        alt={coverImage.alt ?? update.title ?? update.typeLabel}
                        loading="lazy"
                      />
                    </span>
                  ) : null}
                  <span className={styles.eventRelatedUpdateCopy}>
                    <small>
                      {update.typeLabel} ·{" "}
                      {formatRelatedUpdateDate(update.publishedAt ?? update.createdAt)}
                    </small>
                    <strong>{update.title ?? update.typeLabel}</strong>
                    <span>{update.excerpt}</span>
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
        <section className={styles.eventGallerySection}>
          <div className={styles.eventSectionHeading}>
            <p className="home-kicker">Gallery</p>
            <div>
              <h2>现场照片</h2>
              <p>通过现场照片回看活动氛围与交流瞬间。</p>
            </div>
          </div>

          <div className={styles.eventGalleryGrid}>
            {event.gallery.map((image) => (
              <article className={styles.eventGalleryCard} key={image.id}>
                <div className={styles.eventGalleryMedia}>
                  <img
                    src={getEventImageUrl(image.imageUrl, "gallery") ?? image.imageUrl}
                    alt={image.caption ?? event.title}
                    loading="lazy"
                  />
                </div>
                <div className={styles.eventGalleryCopy}>
                  <h3>{event.title}</h3>
                  {image.caption && image.caption !== event.title ? <p>{image.caption}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
