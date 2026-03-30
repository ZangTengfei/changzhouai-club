import type { Metadata } from "next";
import Link from "next/link";

import { EventRegistrationForm } from "@/components/event-registration-form";
import { PageHero } from "@/components/page-hero";
import { getCompletedEventRecaps, getScheduledEvents } from "@/lib/community-events";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "活动",
  description: "查看常州 AI 社区的历史活动回顾和当前可报名活动。",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; error?: string }>;
}) {
  const enabled = hasSupabaseEnv();
  const params = await searchParams;
  const completedEvents = await getCompletedEventRecaps();
  const scheduledEvents = await getScheduledEvents();
  let registeredEventIds = new Set<string>();
  let isLoggedIn = false;

  if (enabled) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    isLoggedIn = Boolean(user);

    const [{ data: registrations }] = await Promise.all([
      user
        ? supabase
            .from("event_registrations")
            .select("event_id")
            .eq("user_id", user.id)
            .eq("status", "registered")
        : Promise.resolve({ data: [] }),
    ]);

    registeredEventIds = new Set((registrations ?? []).map((item) => item.event_id));
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Events"
        title="社区活动"
        description={`当前站点会自动展示 ${completedEvents.length} 场已完成活动的回顾，并承接后续活动报名。你在后台更新活动内容后，这里会直接同步。`}
      >
        <div className="note-strip">
          这页现在主打真实活动回顾。后续你只要继续补活动简介、封面和现场照片，它就会越来越有内容密度。
        </div>
      </PageHero>

      {params.registered ? (
        <div className="note-strip">报名成功，已经写入你的社区账号记录。</div>
      ) : null}

      {params.error ? (
        <div className="note-strip">报名失败，请稍后再试。</div>
      ) : null}

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Upcoming</p>
          <h2>活动报名</h2>
          <p>
            只要 Supabase 里有 `scheduled` 状态的活动，这一页就会自动显示报名入口。现在你已经可以用登录账号把报名写入 `event_registrations` 表了。
          </p>
        </div>

        {scheduledEvents.length > 0 ? (
          <div className="card-grid">
            {scheduledEvents.map((event) => (
              <EventRegistrationForm
                key={event.id}
                event={event}
                isLoggedIn={isLoggedIn}
                isRegistered={registeredEventIds.has(event.id)}
                redirectTo={`/events/${event.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="note-strip">
            当前数据库里还没有 `scheduled`
            状态的活动，所以这里先不显示报名卡片。你后面只要新增下一场活动，这里就会自动出现报名入口。
          </div>
        )}
      </section>

      <section className="event-list">
        {completedEvents.length > 0 ? (
          completedEvents.map((item) => (
            <article className="event-feature" key={item.id}>
              <div className="event-feature-media">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.title} loading="lazy" />
                ) : (
                  <div className="event-image-fallback">活动图片待补充</div>
                )}
              </div>
              <div className="event-feature-copy">
                <div className="pill-row">
                  <span className="pill">{item.dateLabel}</span>
                  <span className="pill">已完成</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <div className="detail-pills">
                  {item.highlights.map((highlight) => (
                    <span key={highlight}>{highlight}</span>
                  ))}
                </div>
                <div className="cta-row">
                  <Link href={`/events/${item.slug}`} className="button button-secondary">
                    查看活动详情
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="note-strip">
            当前数据库里还没有已完成活动。把历史活动导入后，这里就会自动展示完整回顾。
          </div>
        )}
      </section>

      <section className="two-up">
        <article className="card">
          <h3>这一页现在最有价值的地方</h3>
          <ul className="detail-list">
            <li>访客能一眼确认社区不是空站，而是真的持续在线下活动</li>
            <li>新成员可以快速感受到社区的真实氛围和线下频率</li>
            <li>一旦下一场活动进入数据库，就能直接开放登录报名</li>
          </ul>
        </article>
        <article className="card">
          <h3>后续还可以继续补什么</h3>
          <ul className="detail-list">
            <li>每场活动的主题关键词</li>
            <li>现场分享人的名字或方向</li>
            <li>当场讨论过的 2-3 个话题</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
