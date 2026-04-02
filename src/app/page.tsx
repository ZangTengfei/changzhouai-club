import Link from "next/link";

import { MemberAvatar } from "@/components/member-avatar";
import { SectionHeading } from "@/components/section-heading";
import { SiteSponsors } from "@/components/site-sponsors";
import { ToneBadge } from "@/components/tone-badge";
import {
  getCompletedEventRecaps,
  getScheduledEvents,
} from "@/lib/community-events";
import { getPublicMembersDirectory } from "@/lib/community-members";
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

  const [, month, day] = isoDate.split("-");

  if (!month || !day) {
    return isoDate.replaceAll("-", ".");
  }

  return `${month}.${day}`;
}

function formatMemberStatus(status: string) {
  switch (status) {
    case "admin":
      return "管理员";
    case "organizer":
      return "组织者";
    case "active":
      return "活跃成员";
    case "pending":
      return "待完善";
    case "paused":
      return "暂停中";
    default:
      return status;
  }
}

function buildPrimaryMemberSignal(member: { status: string }) {
  return formatMemberStatus(member.status);
}

export default async function HomePage() {
  const scheduledEvents = await getScheduledEvents();
  const completedEvents = await getCompletedEventRecaps();
  const directory = await getPublicMembersDirectory();
  const featuredScheduledEvents = scheduledEvents.slice(0, 3);
  const latestCompletedEvent = completedEvents[0];
  const recentEvents = completedEvents.slice(0, 3);
  const featuredMembers = directory.members.slice(0, 6);
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
          <h1>常州 AI 社区</h1>
          <p>
            连接常州的开发者、OPC、产品人、创业者、高校同学与企业伙伴，持续组织线下交流、主题分享与合作对接。
            {latestCompletedEvent
              ? `到 ${latestCompletedEvent.dateLabel}，我们已经完成了 ${completedEvents.length} 场线下活动。`
              : "社区持续举办线下交流与主题分享活动。"}
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
          <p className="eyebrow">社区定位</p>
          <h2>以活动为连接点，汇聚本地 AI 人才与合作机会</h2>
          <p>
            社区以线下活动、成员连接和合作对接为核心，面向本地实践者与组织建立长期交流网络。
          </p>
          <div className="detail-pills">
            <span>线下活动</span>
            <span>成员分享</span>
            <span>合作对接</span>
          </div>
          <div className="hero-note">
            欢迎开发者、OPC、产品人、创业者、高校师生与企业伙伴加入交流。
          </div>
        </aside>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="我们在做什么"
          title="连接 AI 开发者与实践场景"
          description="通过活动、分享与合作交流，把分散在不同角色和行业中的 AI 实践者连接起来。"
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
            eyebrow="近期活动"
            title="开放报名中的活动"
            description="浏览近期正在开放报名的社区活动，了解时间、地点与主题安排。"
          />
          <div className="card-grid">
            {featuredScheduledEvents.map((event) => (
              <article className="card scheduled-event-card" key={event.id}>
                <div className="pill-row">
                  <span className="pill">
                    {event.event_at
                      ? new Date(event.event_at).toLocaleString("zh-CN")
                      : "时间待定"}
                  </span>
                  <span className="pill">{event.city ?? "常州"}</span>
                  <span className="pill">开放报名</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.summary ?? "这是一场已经开放报名的社区活动。"}</p>
                <ul className="detail-list">
                  <li>地点：{event.venue ?? "待公布"}</li>
                </ul>
                <div className="cta-row">
                  <Link href={`/events/${event.slug}`} className="button">
                    查看详情并报名
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <SectionHeading
          eyebrow="活动回顾"
          title="从过往活动了解社区氛围"
          description="通过活动回顾、现场照片与主题线索，快速认识社区的交流节奏与内容方向。"
        />
        {recentEvents.length > 0 ? (
          <div className="card-grid">
            {recentEvents.map((item) => (
              <Link
                href={`/events/${item.slug}`}
                className="event-card event-card-link"
                key={item.id}
              >
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
              </Link>
            ))}
          </div>
        ) : (
          <div className="note-strip">
            暂无活动回顾内容，欢迎稍后再来查看社区的最新活动记录。
          </div>
        )}
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="社区特色"
          title="围绕活动、成员与合作持续生长"
          description="社区以真实交流为基础，逐步沉淀成员连接、内容分享与本地合作机会。"
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
          description="成员来自开发、产品、创业、教育与产业一线，在 AI 应用、工程实践与合作探索中持续交流。"
        />

        {featuredMembers.length > 0 ? (
          <>
            <div className="member-directory-grid member-directory-grid-home">
              {featuredMembers.map((member) => (
                <article className="member-directory-card" key={member.id}>
                  <div className="member-directory-header">
                    <MemberAvatar
                      name={member.displayName}
                      avatarUrl={member.avatarUrl}
                    />

                    <div className="member-directory-copy">
                      <h3>{member.displayName}</h3>
                      <div className="member-directory-meta">
                        <div className="member-directory-signals member-directory-signals-compact">
                          <span className="pill member-signal-pill member-signal-pill-compact">
                            {buildPrimaryMemberSignal(member)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="member-directory-bio">
                    {member.bio ??
                      "这位成员已加入社区，欢迎在线下活动和交流中进一步认识。"}
                  </p>

                  {member.skills.length > 0 ? (
                    <div className="member-skill-list member-skill-list-home">
                      {member.skills.slice(0, 4).map((skill) => (
                        <ToneBadge key={`${member.id}-${skill}`} label={skill} />
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="cta-row">
              <Link href="/members" className="button button-secondary">
                查看全部成员
              </Link>
            </div>
          </>
        ) : (
          <div className="note-strip">
            成员名录正在持续完善，欢迎前往加入页面提交资料，成为首页展示的社区成员。
          </div>
        )}

        <div className="tag-cloud">
          {(directory.skillTags.length > 0
            ? directory.skillTags
            : memberTags
          ).map((tag) => (
            <ToneBadge key={tag} label={tag} />
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="加入方式"
          title="从加入社区到参与活动与协作"
          description="通过简单清晰的参与路径，让新朋友更快融入社区交流与合作。"
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
          description="如果你有分享、培训、PoC、项目协作或人才连接需求，这里提供稳定清晰的合作入口。"
        />
        <div className="two-up">
          <article className="card">
            <h3>可合作方向</h3>
            <div className="tag-cloud">
              {cooperationAreas.map((item) => (
                <ToneBadge key={item} label={item} />
              ))}
            </div>
          </article>
          <article className="card">
            <h3>合作入口</h3>
            <p>
              面向企业、机构、园区与高校开放合作交流，支持主题分享、培训、PoC、项目协作与人才连接。
            </p>
            <div className="cta-row">
              <Link href="/cooperate" className="button">
                提交合作需求
              </Link>
              <Link href="/events" className="button button-secondary">
                查看活动安排
              </Link>
            </div>
          </article>
        </div>
      </section>

      <SiteSponsors />
    </div>
  );
}
