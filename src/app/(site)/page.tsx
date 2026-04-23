import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";

import {
  DoodleSparkles,
  FlowPeopleIllustration,
  HandDrawnArrow,
  JoinCommunityIllustration,
} from "@/components/home-visual-assets";
import { HeroPhotoCarousel } from "@/components/hero-photo-carousel";
import { SiteSponsors } from "@/components/site-sponsors";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import {
  getCompletedEventRecaps,
  getScheduledEvents,
} from "@/lib/community-events";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { getCurrentWechatQrCode } from "@/lib/community-social";
import { communitySocialLinks } from "@/lib/site-data";

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

const homeFlowSteps = [
  {
    step: "01",
    title: "参与活动",
    summary: "线下交流、主题分享、拓展你的 AI 视野",
    tone: "green",
    assetNeed: "可替换为：两位成员在桌边交流的 SVG 插画",
  },
  {
    step: "02",
    title: "认识成员",
    summary: "通过交流发现更合拍的伙伴，建立信任连接",
    tone: "orange",
    assetNeed: "可替换为：握手/交换想法的人物 SVG 插画",
  },
  {
    step: "03",
    title: "合作共建",
    summary: "项目合作、资源对接，让想法真正落地",
    tone: "blue",
    assetNeed: "可替换为：拼图/项目共创人物 SVG 插画",
  },
] as const;

const homeAssetGaps = [
  {
    title: "人物插画源文件",
    detail: "首页流程、下一场活动、加入社群这三类人物，最好补同一套 Figma/SVG。",
  },
  {
    title: "装饰图案规范",
    detail: "星星、笑脸、手绘箭头、贴纸胶带、对勾等小元素需要统一笔触和颜色。",
  },
  {
    title: "活动照片精选",
    detail: "需要 1 张横向主视觉照片和 3 张缩略图，建议统一裁切比例和明暗风格。",
  },
];

const heroNotes = [
  {
    className: "home-sticky-note home-sticky-note-green",
    lines: ["在这里", "认识有趣的人", "一起做有意思的事"],
  },
  {
    className: "home-sticky-note home-sticky-note-yellow",
    lines: ["从 0 到 1", "把想法变成", "真实项目"],
  },
  {
    className: "home-sticky-note home-sticky-note-blue",
    lines: ["每一次交流", "都可能带来", "新的机会"],
  },
] as const;

const statIcons = {
  people: UsersRound,
  calendar: CalendarDays,
  clock: Clock3,
  pin: MapPin,
} as const;

type StatIconKey = keyof typeof statIcons;

export default async function HomePage() {
  const scheduledEvents = await getScheduledEvents();
  const completedEvents = await getCompletedEventRecaps();
  const directory = await getPublicMembersDirectory();
  const wechatQrCode = await getCurrentWechatQrCode();
  const primaryScheduledEvent = scheduledEvents[0];
  const latestCompletedEvent = completedEvents[0];
  const recentEvents = completedEvents.slice(0, 3);
  const heroGallery = completedEvents
    .flatMap((event) => [
      event.imageUrl,
      ...event.gallery.map((item) => item.imageUrl),
    ])
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
    .filter((imageUrl, index, items) => items.indexOf(imageUrl) === index)
    .slice(0, 4);
  const memberAvatars = directory.members
    .map((member) => member.avatarUrl)
    .filter((avatarUrl): avatarUrl is string => Boolean(avatarUrl))
    .slice(0, 6);
  const communityStats = [
    {
      value: "200+",
      label: "全网成员",
      detail: "本地 AI 从业者与爱好者",
      icon: "people",
    },
    {
      value: `${completedEvents.length || 7} 场`,
      label: "线下活动",
      detail: "技术分享与交流",
      icon: "calendar",
    },
    {
      value: formatMetricDate(latestCompletedEvent?.isoDate ?? null),
      label: "最近一次活动",
      detail: latestCompletedEvent?.title ?? "AI Agent 实践分享会",
      icon: "clock",
    },
    {
      value: "常州",
      label: "我们的据点",
      detail: "立足常州，连接长三角",
      icon: "pin",
    },
  ] satisfies Array<{
    value: string;
    label: string;
    detail: string;
    icon: StatIconKey;
  }>;
  const nextEventDateLabel = formatEventDateTime(
    primaryScheduledEvent?.event_at ?? null,
  );
  const wechatQrExpiresLabel = wechatQrCode
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(wechatQrCode.expiresAt))
    : null;
  const heroCarouselImages = heroGallery.slice(0, 3);

  return (
    <div className="home-page-stack">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-hero-copy">
          <p className="home-kicker">连接・分享・共创 👋</p>
          <h1 id="home-hero-title">
            常州 <span>AI Club</span>
            <br />
            本地 AI 人的共同家园
          </h1>
          <p className="home-hero-lede">
            连接常州的开发者、产品人、创业者和 AI 爱好者，
            一起探索 AI，落地创新，推动本地 AI 生态发展。
          </p>
          <HandDrawnArrow className="home-hero-arrow" />

          <div className="home-hero-actions">
            <Link href="/join" className="button home-primary-button">
              加入社区
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/events" className="button home-ghost-button">
              了解更多
            </Link>
          </div>

          <div className="home-member-proof" aria-label="社区成员规模">
            <div className="home-avatar-stack" aria-hidden="true">
              {memberAvatars.length > 0 ? (
                memberAvatars.map((avatarUrl, index) => (
                  <img
                    key={`${avatarUrl}-${index}`}
                    src={avatarUrl}
                    alt=""
                    style={{ zIndex: memberAvatars.length - index }}
                    referrerPolicy="no-referrer"
                  />
                ))
              ) : (
                ["AI", "CA", "AG", "PM", "OP"].map((label, index) => (
                  <span key={label} style={{ zIndex: 5 - index }}>
                    {label}
                  </span>
                ))
              )}
            </div>
            <div className="home-member-proof-copy">
              <strong>200+</strong>
              <span>位成员已加入我们</span>
              <small>期待你的加入！</small>
            </div>
          </div>
        </div>

        <HeroPhotoCarousel
          images={heroCarouselImages}
          alt={latestCompletedEvent?.title ?? "常州 AI Club 活动现场"}
          notes={heroNotes.map((note) => ({
            className: note.className,
            lines: [...note.lines],
          }))}
        />
      </section>

      <section className="home-stats-panel" aria-label="社区数据">
        {communityStats.map((item) => {
          const StatIcon = statIcons[item.icon];

          return (
            <article className="home-stat-card" key={item.label}>
              <span className={`home-stat-icon home-stat-icon-${item.icon}`} aria-hidden="true">
                <StatIcon strokeWidth={1.9} />
              </span>
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </div>
            </article>
          );
        })}
      </section>

      <section className="home-flow-section" aria-labelledby="home-flow-title">
        <div className="home-section-heading">
          <h2 id="home-flow-title">从活动到合作</h2>
          <p>在这里，认识更多人，创造更多可能</p>
        </div>

        <div className="home-flow-layout">
          <div className="home-flow-cards">
            {homeFlowSteps.map((item, index) => (
              <article
                className={`home-flow-card home-flow-card-${item.tone}`}
                key={item.title}
              >
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div
                  className="home-flow-illustration"
                  aria-hidden="true"
                  title={item.assetNeed}
                >
                  <FlowPeopleIllustration
                    tone={item.tone}
                    className="home-flow-illustration-svg"
                  />
                </div>
                {index < homeFlowSteps.length - 1 ? (
                  <i className="home-flow-arrow" aria-hidden="true" />
                ) : null}
              </article>
            ))}
          </div>

          <article className="home-next-event-card">
            <p className="home-kicker">下一场活动等你来！</p>
            <h3>
              {primaryScheduledEvent?.title ?? "AI Agent 实践分享会"}
            </h3>
            <ul>
              <li>
                <span aria-hidden="true">◷</span>
                {nextEventDateLabel}
              </li>
              <li>
                <span aria-hidden="true">⌖</span>
                {primaryScheduledEvent?.venue
                  ? `${primaryScheduledEvent.city ?? "常州"} · ${primaryScheduledEvent.venue}`
                  : "常州 · 线下空间待公布"}
              </li>
              <li>
                <span aria-hidden="true">●</span>
                {directory.members.length > 0
                  ? `${Math.min(directory.members.length, 28)} 人已报名`
                  : "开放报名中"}
              </li>
            </ul>
            <Link
              href={primaryScheduledEvent ? `/events/${primaryScheduledEvent.slug}` : "/events"}
              className="button home-primary-button"
            >
              查看活动详情
              <span aria-hidden="true">→</span>
            </Link>
            <Image
              src="/event-card-character.png"
              alt=""
              width={1024}
              height={1536}
              className="home-event-person"
              aria-hidden="true"
              priority={false}
            />
            <DoodleSparkles className="home-doodle home-doodle-event-sparkles" />
          </article>
        </div>
      </section>

      <section className="home-lower-grid" aria-label="活动与加入社区">
        <article className="home-recent-card">
          <div className="home-card-heading">
            <h2>近期活动</h2>
            <Link href="/events">查看全部 →</Link>
          </div>

          {recentEvents.length > 0 ? (
            <div className="home-event-list">
              {recentEvents.map((item) => (
                <Link
                  href={`/events/${item.slug}`}
                  className="home-event-row"
                  key={item.id}
                >
                  <div className="home-event-row-media">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={180}
                        height={112}
                        unoptimized
                        sizes="126px"
                      />
                    ) : (
                      <span>AI</span>
                    )}
                  </div>
                  <div>
                    <h3>{item.title}</h3>
                    <p>
                      <span>{item.dateLabel}</span>
                      <span>{item.locationLabel}</span>
                    </p>
                    <small>{item.highlights[2] ?? "活动已归档"}</small>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home-empty-state">
              暂无活动回顾内容，欢迎稍后再来查看社区最新记录。
            </div>
          )}
        </article>

        <article className="home-join-card">
          <div>
            <p className="home-kicker">加入我们</p>
            <h2>扫码入群，加入常州 AI Club 微信群</h2>
            <p>获取活动通知、资料分享和合作机会。</p>
          </div>

          <div className="home-wechat-row">
            {wechatQrCode ? (
              <img
                src={wechatQrCode.imageUrl}
                alt={wechatQrCode.title}
                width={180}
                height={180}
              />
            ) : (
              <div className="home-wechat-placeholder">微信</div>
            )}
            <div>
              <span>微信群</span>
              <strong>{wechatQrCode?.title ?? "常州 AI Club 微信群"}</strong>
              <small>
                {wechatQrExpiresLabel
                  ? `二维码有效至 ${wechatQrExpiresLabel}`
                  : "二维码 7 天过期，后台更新后会显示在这里。"}
              </small>
            </div>
          </div>
          <JoinCommunityIllustration className="home-join-illustration" />
        </article>
      </section>

      <section className="home-asset-plan" aria-labelledby="home-asset-plan-title">
        <div>
          <p className="home-kicker">视觉资产还原计划</p>
          <h2 id="home-asset-plan-title">下一步需要补齐这些素材</h2>
        </div>
        <div className="home-asset-gap-grid">
          {homeAssetGaps.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-social-section" aria-labelledby="home-social-title">
        <div className="home-section-heading">
          <h2 id="home-social-title">关注我们</h2>
          <p>在各个平台获取常州 AI Club 动态与优质内容</p>
        </div>

        <div className="home-social-grid">
          {communitySocialLinks.map((item) => (
            <Link
              key={item.platform}
              href={item.href}
              className="home-social-card"
              target="_blank"
              rel="noreferrer"
            >
              <span className="home-social-icon" aria-hidden="true">
                <SocialPlatformIcon
                  tone={item.tone}
                  src={item.iconSrc}
                  alt=""
                  className="home-social-svg"
                />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <SiteSponsors />
    </div>
  );
}
