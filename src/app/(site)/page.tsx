import Image from "next/image";
import Link from "next/link";

import { MemberDirectoryCard } from "@/components/member-directory-card";
import { SectionHeading } from "@/components/section-heading";
import { SiteSponsors } from "@/components/site-sponsors";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { ToneBadge } from "@/components/tone-badge";
import {
  getCompletedEventRecaps,
  getScheduledEvents,
} from "@/lib/community-events";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { getCurrentWechatQrCode } from "@/lib/community-social";
import {
  communitySocialLinks,
  cooperationAreas,
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

function formatMemberHeadline(member: {
  roleLabel: string | null;
  organization: string | null;
}) {
  if (member.roleLabel && member.organization) {
    return `${member.roleLabel} · ${member.organization}`;
  }

  return member.roleLabel ?? member.organization;
}

export default async function HomePage() {
  const scheduledEvents = await getScheduledEvents();
  const completedEvents = await getCompletedEventRecaps();
  const directory = await getPublicMembersDirectory();
  const wechatQrCode = await getCurrentWechatQrCode();
  const featuredScheduledEvents = scheduledEvents.slice(0, 3);
  const primaryScheduledEvent = featuredScheduledEvents[0];
  const latestCompletedEvent = completedEvents[0];
  const recentEvents = completedEvents.slice(0, 3);
  const featuredMembers = directory.members
    .filter((member) => member.isFeaturedOnHome)
    .slice(0, 8);
  const primaryEventHasCover = Boolean(primaryScheduledEvent?.cover_image_url);
  const primaryEventPanelStyle =
    primaryScheduledEvent?.cover_image_url
      ? {
          backgroundImage: `linear-gradient(180deg, var(--hero-overlay-start) 0%, var(--hero-overlay-mid) 56%, var(--hero-overlay-end) 100%), url("${primaryScheduledEvent.cover_image_url}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }
      : undefined;
  const communityStats = [
    { value: "200+", label: "全网群成员" },
    { value: `${completedEvents.length} 场`, label: "已举办线下活动" },
    {
      value: formatMetricDate(latestCompletedEvent?.isoDate ?? null),
      label: "最近一次活动日期",
    },
  ];
  const wechatQrExpiresLabel = wechatQrCode
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(wechatQrCode.expiresAt))
    : null;

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
              立即加入社区
            </Link>
          </div>

          <div className="community-social-panel" aria-label="社区外部平台入口">
            <div className="community-social-heading">
              <span className="community-social-kicker">社区入口</span>
              <strong>在公开平台关注社区动态</strong>
            </div>
            <div className="community-social-links">
              {communitySocialLinks.map((item) => (
                <Link
                  key={item.platform}
                  href={item.href}
                  className={`community-social-link community-social-link-${item.tone}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="community-social-icon" aria-hidden="true">
                    <SocialPlatformIcon
                      tone={item.tone}
                      src={item.iconSrc}
                      alt=""
                      className="community-social-icon-svg"
                    />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </Link>
              ))}
            </div>
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

        <aside
          className={`hero-panel${primaryEventHasCover ? " hero-panel-with-image" : ""}`}
          style={primaryEventPanelStyle}
        >
          <p className="eyebrow">开放报名活动</p>
          {primaryScheduledEvent ? (
            <>
              <h2>{primaryScheduledEvent.title}</h2>
              <p>
                {primaryScheduledEvent.summary ?? "这是一场已经开放报名的社区活动。"}
              </p>
              <div className="detail-pills">
                <span>
                  {primaryScheduledEvent.event_at
                    ? new Date(primaryScheduledEvent.event_at).toLocaleString("zh-CN")
                    : "时间待定"}
                </span>
                <span>{primaryScheduledEvent.city ?? "常州"}</span>
                <span>开放报名</span>
              </div>
              <div className="hero-note">
                地点：{primaryScheduledEvent.venue ?? "待公布"}
              </div>
              <div className="cta-row">
                <Link
                  href={`/events/${primaryScheduledEvent.slug}`}
                  className="button"
                >
                  查看详情并报名
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2>近期报名活动正在筹备</h2>
              <p>
                新一期线下交流和主题分享正在准备中，活动开放后会第一时间在这里更新。
              </p>
              <div className="detail-pills">
                <span>线下活动</span>
                <span>主题分享</span>
                <span>持续更新</span>
              </div>
              <div className="cta-row">
                <Link href="/events" className="button">
                  查看活动页
                </Link>
              </div>
            </>
          )}
          <div className="community-wechat-card hero-wechat-card">
            {wechatQrCode ? (
              <>
                <div className="community-wechat-qr">
                  <img
                    src={wechatQrCode.imageUrl}
                    alt={wechatQrCode.title}
                    width={160}
                    height={160}
                  />
                </div>
                <div className="community-wechat-copy">
                  <span className="community-social-kicker">微信群</span>
                  <strong>{wechatQrCode.title}</strong>
                  <small>扫码入群，活动通知和现场交流会同步在群里。有效至 {wechatQrExpiresLabel}</small>
                </div>
              </>
            ) : (
              <>
                <div className="community-wechat-qr-placeholder" aria-hidden="true">
                  微信
                </div>
                <div className="community-wechat-copy">
                  <span className="community-social-kicker">微信群</span>
                  <strong>二维码更新中</strong>
                  <small>二维码 7 天过期，后台更新后会显示在活动区域。</small>
                </div>
              </>
            )}
          </div>
        </aside>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="社区定位"
          title="以活动为连接点，汇聚本地 AI 人才与合作机会"
          description="社区围绕固定线下见面、成员分享与合作对接，帮助常州本地实践者建立长期交流网络。"
        />
        <div className="card-grid">
          <article className="card">
            <h3>线下活动</h3>
            <p>
              持续组织线下交流和主题分享，让本地开发者、产品人、创业者和高校同学有稳定碰面的场域。
            </p>
          </article>
          <article className="card">
            <h3>成员连接</h3>
            <p>
              通过成员地图和资料沉淀，让大家更容易找到相近方向的人，建立长期的交流与互助关系。
            </p>
          </article>
          <article className="card">
            <h3>合作对接</h3>
            <p>
              面向企业、园区、高校与独立实践者开放合作入口，支持主题分享、PoC、项目协作和人才连接。
            </p>
          </article>
        </div>
      </section>

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
                className="event-card event-card-link event-card-link-home"
                key={item.id}
              >
                <div className="event-media">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={720}
                      height={540}
                      sizes="(max-width: 820px) calc(100vw - 20px), (max-width: 1024px) calc((100vw - 32px - 18px) / 2), 349px"
                    />
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
          eyebrow="成员地图"
          title="社区成员来自不同角色，但会在同一类问题上碰面"
          description="成员来自开发、产品、创业、教育与产业一线，在 AI 应用、工程实践与合作探索中持续交流。"
        />

        {featuredMembers.length > 0 ? (
          <div className="member-directory-grid member-directory-grid-home">
            {featuredMembers.map((member) => (
              <MemberDirectoryCard
                key={member.id}
                member={member}
                headline={formatMemberHeadline(member)}
                bioFallback="这位成员已加入社区，欢迎在线下活动和交流中进一步认识。"
              />
            ))}
          </div>
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
