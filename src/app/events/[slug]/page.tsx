import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventRegistrationForm } from "@/components/event-registration-form";
import { hasSupabaseEnv } from "@/lib/env";
import { getPublicEventBySlug } from "@/lib/community-events";
import { createClient } from "@/lib/supabase/server";

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

  let isLoggedIn = false;
  let isRegistered = false;

  if (hasSupabaseEnv() && event.status === "scheduled") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    isLoggedIn = Boolean(user);

    if (user) {
      const { data: registration } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .eq("status", "registered")
        .maybeSingle();

      isRegistered = Boolean(registration);
    }
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
              这场活动的详细说明还在补充中。你可以先看时间地点和报名状态，后面活动介绍、议程和分享内容会继续完善。
            </div>
          ) : null}
        </article>

        {event.status === "scheduled" ? (
          <EventRegistrationForm
            event={{
              id: event.id,
              title: event.title,
              summary: event.summary,
              event_at: event.eventAt,
              venue: event.venue,
              city: event.city,
              slug: event.slug,
              registration_note: event.registrationNote,
            }}
            isLoggedIn={isLoggedIn}
            isRegistered={isRegistered}
            redirectTo={detailHref}
            showDetailLink={false}
          />
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
                ? "这场活动已经结束，当前页面会继续沉淀活动回顾、现场照片和分享线索。"
                : "这场活动目前不开放报名。如有变更，页面内容会随后台同步更新。"}
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
                当前还没有补充更完整的活动介绍，后面可以在后台继续完善活动背景、议题安排和适合参与的人群。
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
                当前还没有补充议程和分享信息，后面可以继续把这场活动的结构化内容沉淀到这里。
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
            <p>这一部分适合持续沉淀每场活动最值得留下来的观察、问题和后续动作。</p>
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
            <p>活动封面和后台上传的照片会一起沉淀在这里。</p>
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
