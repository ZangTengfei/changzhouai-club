import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { HeroPhotoCarousel } from "@/components/hero-photo-carousel";
import { SiteSponsors } from "@/components/site-sponsors";
import {
  getCompletedEventRecaps,
  getScheduledEvents,
} from "@/lib/community-events";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { getEventImageUrl } from "@/lib/public-image-url";
import { getCurrentWechatQrCode } from "@/lib/community-social";

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

function formatReviewDate(value: string | null) {
  if (!value) {
    return "时间待定";
  }

  return value.replaceAll("-", ".");
}

function extractShortBio(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？])/)
    .map((item) => item.trim())
    .find(Boolean);

  if (!normalized) {
    return null;
  }

  return normalized.length > 42 ? `${normalized.slice(0, 42)}...` : normalized;
}

const homeFlowSteps = [
  {
    step: "01",
    title: "参与活动",
    summary: "线下交流、主题分享、拓展你的 AI 视野",
    tone: "green",
    illustrationSrc: "/home-flow-participate.png",
    illustrationAlt: "",
  },
  {
    step: "02",
    title: "认识成员",
    summary: "通过交流发现更合拍的伙伴，建立信任连接",
    tone: "orange",
    illustrationSrc: "/home-flow-connect.png",
    illustrationAlt: "",
  },
  {
    step: "03",
    title: "合作共建",
    summary: "项目合作、资源对接，让想法真正落地",
    tone: "blue",
    illustrationSrc: "/home-flow-build.png",
    illustrationAlt: "",
  },
] as const;

const heroNotes = [
  {
    className: "home-sticky-note home-sticky-note-green",
    lines: ["在这里", "认识有趣的人", "一起做有意思的事"],
    mark: "♡",
  },
  {
    className: "home-sticky-note home-sticky-note-yellow",
    lines: ["从 0 到 1", "把想法变成", "真实项目"],
    mark: "↗",
  },
  {
    className: "home-sticky-note home-sticky-note-blue",
    lines: ["每一次交流", "都可能带来", "新的机会"],
    mark: "☺",
  },
] as const;

const fallbackMemberStories = [
  {
    id: "story-1",
    name: "社区成员",
    meta: "AI 爱好者",
    story: "在这里认识更多同行者，把零散想法变成一次次具体的交流和实践。",
    tags: ["# 找到方向", "# 真实交流", "# 本地连接"],
  },
  {
    id: "story-2",
    name: "社区成员",
    meta: "技术探索者",
    story: "通过活动里的真实案例和分享，把抽象概念慢慢变成自己能上手的能力。",
    tags: ["# 学习成长", "# AI 实践", "# 知识分享"],
  },
  {
    id: "story-3",
    name: "社区成员",
    meta: "项目参与者",
    story: "一次线下碰面可能带来新的伙伴、资源连接，甚至一次项目的开始。",
    tags: ["# 项目落地", "# 资源对接", "# 合作共建"],
  },
  {
    id: "story-4",
    name: "社区成员",
    meta: "本地 AI 连接者",
    story: "社区让本地开发者、产品人和创业者有了更稳定的相遇和协作场景。",
    tags: ["# 灵感碰撞", "# 常州 AI", "# 社区成长"],
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
  const recentEvents = completedEvents.slice(0, 4);
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
  const heroCarouselImages = heroGallery.slice(0, 3);
  const nextEventAttendeeAvatars = memberAvatars.slice(0, 4);
  const nextEventAttendeeCount = directory.members.length > 0
    ? Math.min(directory.members.length, 28)
    : null;
  const storyMembers = directory.members
    .filter((member) => member.avatarUrl || member.bio || member.roleLabel)
    .slice(0, 4)
    .map((member) => {
      const metaParts = [member.roleLabel, member.organization].filter(Boolean);
      const storyTags = member.skills
        .filter((skill) => skill.trim())
        .slice(0, 3)
        .map((skill) => `# ${skill}`);

      if (storyTags.length === 0) {
        if (member.willingToJoinProjects) {
          storyTags.push("# 项目共建");
        }

        if (member.willingToShare) {
          storyTags.push("# 乐于分享");
        }

        if (storyTags.length === 0) {
          storyTags.push("# 社区成员");
        }
      }

      return {
        id: member.id,
        href: member.publicSlug ? `/members/${member.publicSlug}` : "/members",
        avatarUrl: member.avatarUrl,
        name: member.displayName,
        meta: metaParts.join(" @ ") || member.city,
        story:
          extractShortBio(member.bio) ??
          "在这里认识伙伴、交换经验，也让更多想法从交流逐步走向行动。",
        tags: storyTags,
      };
    });
  const memberStories = storyMembers.length > 0 ? storyMembers : fallbackMemberStories;

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
            <article className={`home-stat-card home-stat-card-${item.icon}`} key={item.label}>
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
        <div className="home-section-heading home-flow-heading">
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
                >
                  <Image
                    src={item.illustrationSrc}
                    alt={item.illustrationAlt}
                    width={1124}
                    height={1400}
                    className="home-flow-illustration-image"
                    aria-hidden="true"
                  />
                </div>
                {index < homeFlowSteps.length - 1 ? (
                  <i className="home-flow-arrow" aria-hidden="true" />
                ) : null}
              </article>
            ))}
          </div>

          <article className="home-next-event-card">
            <div className="home-next-event-copy">
              <p className="home-next-event-kicker">下一场活动等你来！</p>
              <h3>
                {primaryScheduledEvent?.title ?? "AI Agent 实践分享会"}
              </h3>
              <ul className="home-next-event-meta">
                <li>
                  <CalendarDays aria-hidden="true" strokeWidth={1.9} />
                  <span>{nextEventDateLabel}</span>
                </li>
                <li>
                  <MapPin aria-hidden="true" strokeWidth={1.9} />
                  <span>
                    {primaryScheduledEvent?.venue
                      ? `${primaryScheduledEvent.city ?? "常州"} · ${primaryScheduledEvent.venue}`
                      : "常州 · 线下空间待公布"}
                  </span>
                </li>
              </ul>
              <div className="home-next-event-attendance">
                <div className="home-next-event-avatars" aria-hidden="true">
                  {nextEventAttendeeAvatars.length > 0 ? (
                    nextEventAttendeeAvatars.map((avatarUrl, index) => (
                      <img
                        key={`${avatarUrl}-${index}`}
                        src={avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{ zIndex: nextEventAttendeeAvatars.length - index }}
                      />
                    ))
                  ) : (
                    ["AI", "CL", "UB", "CZ"].map((label, index) => (
                      <span key={label} style={{ zIndex: 4 - index }}>
                        {label}
                      </span>
                    ))
                  )}
                </div>
                <span className="home-next-event-attendance-label">
                  {nextEventAttendeeCount
                    ? `${nextEventAttendeeCount} 人已报名`
                    : "开放报名中"}
                </span>
              </div>
              <Link
                href={primaryScheduledEvent ? `/events/${primaryScheduledEvent.slug}` : "/events"}
                className="button home-primary-button home-next-event-button"
              >
                查看活动详情
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <Image
              src="/event-card-character-v2.png"
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

      <section className="home-member-stories" aria-labelledby="home-member-stories-title">
        <div className="home-card-heading home-showcase-heading">
          <div>
            <h2 id="home-member-stories-title">成员故事</h2>
            <p>他们在这里找到方向、伙伴和机会</p>
          </div>
          <Link href="/members">查看更多故事 →</Link>
        </div>

        <div className="home-member-story-grid">
          {memberStories.map((item) => (
            <Link
              href={"href" in item ? item.href : "/members"}
              className="home-member-story-card"
              key={item.id}
            >
              <div className="home-member-story-head">
                <div className="home-member-story-avatar" aria-hidden="true">
                  {"avatarUrl" in item && item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{item.name.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.meta}</small>
                </div>
              </div>
              <p>{item.story}</p>
              <div className="home-member-story-tags" aria-label="成员技能标签">
                {item.tags[0] ? <span>{item.tags[0]}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-event-review-section" aria-labelledby="home-event-review-title">
        <div className="home-card-heading home-showcase-heading">
          <div>
            <h2 id="home-event-review-title">近期活动回顾</h2>
            <p>看看最近几场线下活动的现场氛围</p>
          </div>
          <Link href="/events">查看更多 →</Link>
        </div>

        {recentEvents.length > 0 ? (
          <div className="home-event-review-grid">
            {recentEvents.map((item) => (
              <Link
                href={`/events/${item.slug}`}
                className="home-event-review-card"
                key={item.id}
              >
                <div className="home-event-review-media">
                  {item.imageUrl ? (
                    <Image
                      src={getEventImageUrl(item.imageUrl, "review-card") ?? item.imageUrl}
                      alt={item.title}
                      width={640}
                      height={320}
                      unoptimized
                      sizes="(max-width: 820px) 100vw, 25vw"
                    />
                  ) : (
                    <span>AI</span>
                  )}
                </div>
                <div className="home-event-review-copy">
                  <small>{formatReviewDate(item.isoDate)}</small>
                  <h3>{item.title}</h3>
                  <p>{item.locationLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="home-empty-state">
            暂无活动回顾内容，欢迎稍后再来查看社区最新记录。
          </div>
        )}
      </section>

      <SiteSponsors />

      <section className="home-join-banner" aria-labelledby="home-join-banner-title">
        <div className="home-join-banner-illustration" aria-hidden="true">
          <img
            src="/join-card.png?v=20260424-join-crop"
            alt=""
            className="home-join-banner-illustration-image"
          />
        </div>

        <div className="home-join-banner-copy">
          <h2 id="home-join-banner-title">加入我们，成为常州 AI 生态的一部分</h2>
          <p>
            扫描二维码，加入常州 AI Club 微信群，获取活动通知、资料分享和合作机会。
          </p>
        </div>

        <div className="home-join-banner-side">
          <div className="home-join-banner-qr">
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
          </div>

          <div className="home-join-banner-info">
            <span>微信交流群</span>
            <strong>{wechatQrCode?.title ?? "常州 AI Club 微信群"}</strong>
            <small>200+ 位成员</small>
            <p>活动・学习・合作・成长</p>
          </div>
        </div>
        <Link href="/join" className="button home-primary-button home-join-banner-button">
          扫码加入
        </Link>
      </section>
    </div>
  );
}
