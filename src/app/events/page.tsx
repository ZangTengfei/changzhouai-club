import type { Metadata } from "next";
import Link from "next/link";

import { EventsRegistrationGrid } from "@/components/events-registration-grid";
import { PageHero } from "@/components/page-hero";
import { getCompletedEventRecaps, getScheduledEvents } from "@/lib/community-events";

export const metadata: Metadata = {
  title: "活动",
  description: "浏览常州 AI 社区的近期活动与往期回顾。",
};

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

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Events"
        title="社区活动"
        description={`浏览社区近期活动与 ${completedEvents.length} 场往期回顾，了解活动主题、报名信息与现场内容。`}
      >
        <div className="note-strip">
          通过活动安排、报名入口与往期回顾，快速了解社区的交流节奏与内容方向。
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
            查看近期开放报名的活动，获取时间、地点、简介与报名方式。
          </p>
        </div>

        {scheduledEvents.length > 0 ? (
          <EventsRegistrationGrid events={scheduledEvents} />
        ) : (
          <div className="note-strip">
            暂无开放报名的活动，欢迎关注社区即将发布的活动安排。
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
            暂无往期活动回顾，欢迎稍后查看更新内容。
          </div>
        )}
      </section>

      <section className="two-up">
        <article className="card">
          <h3>活动页提供什么</h3>
          <ul className="detail-list">
            <li>查看近期活动的时间、地点、主题与报名入口</li>
            <li>了解社区过往活动的内容方向与现场氛围</li>
            <li>为新成员和合作伙伴提供稳定的活动信息窗口</li>
          </ul>
        </article>
        <article className="card">
          <h3>活动内容包含哪些信息</h3>
          <ul className="detail-list">
            <li>活动主题、时间地点与报名说明</li>
            <li>现场分享人与议程安排</li>
            <li>活动回顾、照片与讨论线索</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
