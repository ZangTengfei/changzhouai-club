import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventDetailRegistrationPanel } from "@/components/event-detail-registration-panel";
import { getPublicEventBySlug } from "@/lib/community-events";

type EventDetailSearchParams = {
  registered?: string;
  error?: string;
};

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
      description: "查看常州 AI 开发者社区的活动详情。",
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

  const detailHref = `/events/${event.slug}`;
  const hasOverview = event.descriptionParagraphs.length > 0;
  const hasAgenda = event.agendaItems.length > 0;
  const hasSpeakers = event.speakerItems.length > 0;
  const hasRecap = event.recapParagraphs.length > 0;

  return (
    <div className="page-stack">
      {query.registered ? (
        <div className="note-strip">报名成功，已经写入你的社区账号记录。</div>
      ) : null}

      {query.error ? (
        <div className="note-strip">报名失败，请稍后再试。</div>
      ) : null}

      <section className="surface event-detail-hero">
        <div className="event-detail-copy">
          <div className="pill-row">
            <span className="pill">{event.statusLabel}</span>
            <span className="pill">{event.dateLabel}</span>
            <span className="pill">{event.locationLabel}</span>
          </div>

          <div className="event-detail-heading">
            <p className="eyebrow">Event Detail</p>
            <h1>{event.title}</h1>
            <p className="event-detail-summary">{event.summary}</p>
          </div>

          <div className="detail-pills">
            <span>{event.venue ?? "地点待补充"}</span>
            <span>{event.gallery.length > 0 ? `${event.gallery.length} 张活动图片` : "图片待补充"}</span>
            <span>{hasAgenda ? `${event.agendaItems.length} 项议程` : "议程待补充"}</span>
          </div>

          <div className="cta-row">
            <Link href="/events" className="button button-secondary">
              返回活动列表
            </Link>
            {event.status === "completed" ? (
              <Link href="/archive" className="button">
                查看更多往期回顾
              </Link>
            ) : null}
          </div>
        </div>

        <div className="event-detail-media">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} />
          ) : (
            <div className="event-image-fallback">活动图片待补充</div>
          )}
        </div>
      </section>

      <section className="two-up">
        <article className="card event-detail-panel">
          <div className="section-heading">
            <p className="eyebrow">Overview</p>
            <h2>活动信息</h2>
          </div>

          <ul className="detail-list">
            <li>活动时间：{event.dateTimeLabel}</li>
            <li>活动地点：{event.locationLabel}</li>
            <li>活动状态：{event.statusLabel}</li>
            <li>活动链接：{detailHref}</li>
          </ul>

          {!hasOverview && !hasAgenda && !hasSpeakers ? (
            <div className="note-strip">
              活动基本信息已发布，详细介绍与议程内容将陆续补充。
            </div>
          ) : null}
        </article>

        {event.status === "scheduled" ? (
          <EventDetailRegistrationPanel event={event} redirectTo={detailHref} />
        ) : (
          <article className="card event-detail-panel">
            <div className="section-heading">
              <p className="eyebrow">
                {event.status === "completed" ? "Recap" : "Status"}
              </p>
              <h2>{event.status === "completed" ? "活动已结束" : "当前状态"}</h2>
            </div>

            <p>
              {event.status === "completed"
                ? "活动已结束，欢迎通过本页继续查看回顾内容与现场照片。"
                : "本场活动当前暂未开放报名，相关信息以页面发布内容为准。"}
            </p>

            {event.registrationNote ? (
              <div className="note-strip">{event.registrationNote}</div>
            ) : null}
          </article>
        )}
      </section>

      {hasOverview || hasAgenda || hasSpeakers ? (
        <section className="two-up">
          <article className="card event-detail-panel">
            <div className="section-heading">
              <p className="eyebrow">Story</p>
              <h2>活动介绍</h2>
            </div>

            {hasOverview ? (
              <div className="event-detail-richtext">
                {event.descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="note-strip">
                活动介绍将围绕主题背景、交流内容与适合参与的人群持续补充。
              </div>
            )}
          </article>

          <article className="card event-detail-panel">
            <div className="section-heading">
              <p className="eyebrow">Flow</p>
              <h2>议程与分享</h2>
            </div>

            {hasAgenda ? (
              <div>
                <h3>议程安排</h3>
                <ul className="event-detail-list">
                  {event.agendaItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {hasSpeakers ? (
              <div>
                <h3>分享人与组织者</h3>
                <ul className="event-detail-list">
                  {event.speakerItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!hasAgenda && !hasSpeakers ? (
              <div className="note-strip">
                议程安排与分享信息将在确认后更新到本页。
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

      {hasRecap ? (
        <section className="surface account-shell">
          <div className="section-heading">
            <p className="eyebrow">After Event</p>
            <h2>活动回顾</h2>
            <p>这里记录活动中的重点内容、交流线索与值得沉淀的现场观察。</p>
          </div>

          <div className="event-detail-richtext">
            {event.recapParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ) : null}

      {event.gallery.length > 0 ? (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Gallery</p>
            <h2>现场照片</h2>
            <p>通过现场照片回看活动氛围与交流瞬间。</p>
          </div>

          <div className="gallery-grid">
            {event.gallery.map((image) => (
              <article className="gallery-card" key={image.id}>
                <div className="gallery-media">
                  <img src={image.imageUrl} alt={image.caption ?? event.title} loading="lazy" />
                </div>
                <div className="gallery-copy">
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
