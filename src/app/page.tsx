import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { getCompletedEventRecaps, getScheduledEvents } from "@/lib/community-events";
import {
  activityMoments,
  cooperationAreas,
  homeHighlights,
  joinSteps,
  memberTags,
} from "@/lib/site-data";

function formatMetricDate(isoDate: string | null) {
  if (!isoDate) {
    return "待更新";
  }

  return isoDate.replaceAll("-", ".");
}

export default async function HomePage() {
  const scheduledEvents = await getScheduledEvents();
  const completedEvents = await getCompletedEventRecaps();
  const featuredScheduledEvents = scheduledEvents.slice(0, 3);
  const latestCompletedEvent = completedEvents[0];
  const recentEvents = completedEvents.slice(0, 3);
  const communityStats = [
    { value: "200+", label: "现有群成员" },
    { value: `${completedEvents.length} 场`, label: "已举办线下活动" },
    {
      value: formatMetricDate(latestCompletedEvent?.isoDate ?? null),
      label: "最近一次活动日期",
    },
  ];

  return (
    <div className="page-stack">
      <section className="hero surface">
        <div className="hero-copy">
          <p className="eyebrow">Changzhou AI Club</p>
          <h1>常州本地 AI 开发者社区</h1>
          <p>
            连接常州的开发者、产品人、创业者与企业需求，定期组织线下交流与主题分享。
            {latestCompletedEvent
              ? `到 ${latestCompletedEvent.dateLabel}，我们已经完成了 ${completedEvents.length} 场线下活动。`
              : "社区正在持续组织线下交流与主题分享。"}
            {scheduledEvents.length > 0
              ? ` 当前还有 ${scheduledEvents.length} 场活动正在开放报名。`
              : ""}
          </p>

          <div className="cta-row">
            <Link href="/join" className="button">
              立即加入社群
            </Link>
            <Link href="/events" className="button button-secondary">
              {scheduledEvents.length > 0
                ? `查看 ${scheduledEvents.length} 场可报名活动`
                : `查看 ${completedEvents.length} 场活动回顾`}
            </Link>
          </div>

          <div className="stat-grid">
            {communityStats.map((item) => (
              <div className="metric-card" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="hero-panel">
          <p className="eyebrow">现在的社区状态</p>
          <h2>先把活动做好，再自然长出后面的共建</h2>
          <p>
            现在最真实、最有说服力的资产就是已经发生的线下活动。网站第一阶段会优先把这些活动和分享氛围沉淀下来。
          </p>
          <div className="detail-pills">
            <span>真实活动回顾</span>
            <span>成员分享氛围</span>
            <span>本地合作入口</span>
          </div>
          <div className="hero-note">
            社区还没有正式公开招募的共建项目，但活动里已经开始出现成员自研项目的分享。
          </div>
        </aside>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="我们在做什么"
          title="把本地的 AI 人连接起来，让交流先稳定发生"
          description="这一阶段最重要的是把活动节奏、分享氛围和社区信任感建立起来，而不是过早包装成很重的项目平台。"
        />
        <div className="card-grid">
          {homeHighlights.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      {featuredScheduledEvents.length > 0 ? (
        <section className="section">
          <SectionHeading
            eyebrow="正在报名"
            title="首页也直接展示当前可报名的活动"
            description="让第一次来到网站的人不用再点进二级页，也能立刻看到社区下一步正在发生什么。"
          />
          <div className="card-grid">
            {featuredScheduledEvents.map((event) => (
              <article className="card" key={event.id}>
                <div className="pill-row">
                  <span className="pill">
                    {event.event_at ? new Date(event.event_at).toLocaleString("zh-CN") : "时间待定"}
                  </span>
                  <span className="pill">{event.city ?? "常州"}</span>
                  <span className="pill">开放报名</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.summary ?? "这是一场已经开放报名的社区活动。"}</p>
                <ul className="detail-list">
                  <li>地点：{event.venue ?? "待公布"}</li>
                  <li>活动标识：{event.slug}</li>
                </ul>
                <div className="cta-row">
                  <Link href="/events" className="button">
                    去活动页报名
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <SectionHeading
          eyebrow="最近活动"
          title="最近几场活动已经形成了稳定的线下节奏"
          description="先让访客看到活动是真的在持续发生，再让他们决定要不要加入，这是目前最重要的转化逻辑。"
        />
        {recentEvents.length > 0 ? (
          <div className="card-grid">
            {recentEvents.map((item) => (
              <article className="event-card" key={item.id}>
                <div className="event-media">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} loading="lazy" />
                  ) : (
                    <div className="event-image-fallback">活动图片待补充</div>
                  )}
                </div>
                <div className="event-card-body">
                  <div className="pill-row">
                    <span className="pill">{item.dateLabel}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <div className="detail-pills">
                    {item.highlights.map((highlight) => (
                      <span key={highlight}>{highlight}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="note-strip">
            当前数据库里还没有已完成活动。把历史活动种子导入后，这里就会自动展示最近的活动回顾。
          </div>
        )}
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="社区现状"
          title="现在最值得展示的，不是想象中的未来，而是已经发生的现场"
          description="网站首页会先围绕活动事实和成员分享展开，项目部分保持诚实克制，避免过度承诺。"
        />
        <div className="three-up">
          {activityMoments.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="成员地图"
          title="社区成员来自不同角色，但会在同一类问题上碰面"
          description="第一版先做能力标签和参与方向展示，不急着做公开名录，让成员能力先被看见。"
        />
        <div className="tag-cloud">
          {memberTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="加入方式"
          title="从加入社群到参与活动，再进入后续分享与协作"
          description="把转化路径做短，让新成员一眼就知道自己接下来能做什么。"
        />
        <div className="three-up">
          {joinSteps.map((step, index) => (
            <article className="step-card" key={step}>
              <span>0{index + 1}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="合作联系"
          title="欢迎企业、机构、园区与高校一起合作"
          description="如果你有分享、培训、PoC、项目协作或人才连接需求，这个网站也会成为合作入口。"
        />
        <div className="two-up">
          <article className="card">
            <h3>可合作方向</h3>
            <div className="tag-cloud">
              {cooperationAreas.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
          <article className="card">
            <h3>下一步最值得补充的内容</h3>
            <p>
              现在最适合继续补上的，是每场活动的标题、简短回顾和 1-2
              个当场讨论过的话题。这样网站会比现在更有现场感，也更方便转发。
            </p>
            <div className="cta-row">
              <Link href="/events" className="button">
                继续完善活动页
              </Link>
              <Link href="/cooperate" className="button button-secondary">
                查看合作页
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
