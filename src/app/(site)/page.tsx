import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { HeroPhotoCarousel } from "@/components/hero-photo-carousel";
import { SiteSponsors } from "@/components/site-sponsors";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import {
  getHomeCompletedEventRecaps,
  getHomeCompletedEventsCount,
  getHomeScheduledEvents,
} from "@/lib/community-events";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { getHomeCommunityUpdates } from "@/lib/community-updates";
import { getEventImageUrl } from "@/lib/public-image-url";
import { officialCommunityChannels } from "@/lib/site-data";
import { cssModuleCx } from "@/lib/utils";

import styles from "./home-page.module.css";

const cx = cssModuleCx.bind(null, styles);
const HERO_CAROUSEL_IMAGE_LIMIT = 3;
const CO_BUILDER_RULES_PATH = "/docs/guides/co-builder-rules";

function formatMetricDate(isoDate: string | null) {
  if (!isoDate) {
    return "时间待定";
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

  return formatChangzhouDateTime(value, {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReviewDate(value: string | null) {
  if (!value) {
    return "时间待定";
  }

  return value.split("T")[0]?.replaceAll("-", ".") ?? value.replaceAll("-", ".");
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
    title: "带来问题",
    summary: "从成员实践和企业场景里发现值得验证的 AI 问题",
    tone: "green",
    illustrationSrc: "/home-flow-participate-card.webp",
    illustrationAlt: "",
  },
  {
    step: "02",
    title: "共创原型",
    summary: "用活动、工作坊和项目小队把想法做成最小版本",
    tone: "orange",
    illustrationSrc: "/home-flow-connect-card.webp",
    illustrationAlt: "",
  },
  {
    step: "03",
    title: "试点沉淀",
    summary: "把反馈、案例和方法写下来，反哺下一次项目",
    tone: "blue",
    illustrationSrc: "/home-flow-build-card.webp",
    illustrationAlt: "",
  },
] as const;

const heroNotes = [
  {
    className: "home-sticky-note home-sticky-note-green",
    lines: ["带着问题来", "一起找到", "可验证的方向"],
    icon: "heart",
  },
  {
    className: "home-sticky-note home-sticky-note-yellow",
    lines: ["从想法", "到原型", "再到试点"],
    icon: "arrow",
  },
  {
    className: "home-sticky-note home-sticky-note-blue",
    lines: ["每次活动", "都沉淀成", "新的上下文"],
    icon: "smile",
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
  const [
    scheduledEvents,
    recentCompletedEvents,
    recentCommunityUpdates,
    completedEventsCount,
    directory,
  ] = await Promise.all([
    getHomeScheduledEvents(),
    getHomeCompletedEventRecaps(),
    getHomeCommunityUpdates(),
    getHomeCompletedEventsCount(),
    getPublicMembersDirectory(),
  ]);
  const primaryScheduledEvent = scheduledEvents[0];
  const hasUpcomingEvent = Boolean(primaryScheduledEvent);
  const latestCompletedEvent = recentCompletedEvents[0];
  const recentEvents = recentCompletedEvents;
  const heroCarouselImages = recentCompletedEvents
    .flatMap((event) => {
      const imageUrl = event.imageUrl ?? event.gallery[0]?.imageUrl ?? null;

      if (!imageUrl) {
        return [];
      }

      return [
        {
          mainSrc: getEventImageUrl(imageUrl, "hero-main") ?? imageUrl,
          thumbSrc: getEventImageUrl(imageUrl, "hero-thumb") ?? imageUrl,
          alt: `${event.title} 活动现场`,
          href: `/events/${event.slug}`,
          videoUrl: event.video?.url ?? null,
          videoTitle: event.video?.title ?? null,
          videoPosterSrc: event.video?.coverUrl
            ? getEventImageUrl(event.video.coverUrl, "hero-main") ?? event.video.coverUrl
            : null,
        },
      ];
    })
    .filter((item, index, items) => (
      items.findIndex((candidate) => candidate.mainSrc === item.mainSrc) === index
    ))
    .slice(0, HERO_CAROUSEL_IMAGE_LIMIT);
  const memberAvatars = directory.members
    .map((member) => member.avatarUrl)
    .filter((avatarUrl): avatarUrl is string => Boolean(avatarUrl))
    .slice(0, 6);
  const communityStats = [
    {
      value: "300+",
      label: "全网成员",
      detail: "本地 AI 从业者与爱好者",
      icon: "people",
    },
    {
      value: `${completedEventsCount || 7} 场`,
      label: "线下活动",
      detail: "技术分享与交流",
      icon: "calendar",
    },
    {
      value: formatMetricDate(latestCompletedEvent?.isoDate ?? null),
      label: "最近一次活动",
      detail: latestCompletedEvent?.title ?? "活动回顾待更新",
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
  const nextEventLocationLabel = primaryScheduledEvent?.venue
    ? `${primaryScheduledEvent.city ?? "常州"} · ${primaryScheduledEvent.venue}`
    : hasUpcomingEvent
      ? "常州 · 线下空间待公布"
      : "新活动发布后会同步时间和地点";
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
        if (member.isCoBuilder) {
          storyTags.push("# 共建成员");
        }

        if (member.willingToJoinProjects && !member.isCoBuilder) {
          storyTags.push("# 项目协作");
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
  const memberStories = storyMembers;

  return (
    <div className={cx("home-page-stack")}>
      <section className={cx("home-hero")} aria-labelledby="home-hero-title">
        <div className={cx("home-hero-copy")}>
          <p className={cx("home-kicker")}>连接・分享・共创 👋</p>
          <h1 id="home-hero-title">
            常州 <span className={cx("home-hero-title-accent")}>AI Club</span>
            <br />
            <span className={cx("home-hero-title-line")}>让真实问题长成 AI 项目</span>
          </h1>
          <p className={cx("home-hero-lede")}>
            连接常州的 AI 实践者、企业场景方和共建者，
            把真实问题推进到问题验证、AI 原型、场景试点和案例沉淀。
          </p>

          <div className={cx("home-hero-actions")}>
            <Link href="/join" prefetch={false} className={cx("button home-primary-button")}>
              申请加入
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/events" prefetch={false} className={cx("button home-ghost-button")}>
              参加活动
            </Link>
          </div>

          <div className={cx("home-member-proof")} aria-label="社区成员规模">
            <div className={cx("home-avatar-stack")} aria-hidden="true">
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
            <div className={cx("home-member-proof-copy")}>
              <span className={cx("home-member-proof-line")}>
                <strong>300+</strong>
                <span>位成员已加入我们</span>
              </span>
              <small>期待你的加入！</small>
            </div>
            <HandDrawnArrow className={cx("home-hero-arrow")} />
          </div>
        </div>

        <HeroPhotoCarousel
          images={heroCarouselImages}
          fallbackAlt={latestCompletedEvent?.title ?? "常州 AI Club 活动现场"}
          notes={heroNotes.map((note) => ({
            className: note.className,
            lines: [...note.lines],
          }))}
        />
      </section>

      <section className={cx("home-stats-panel")} aria-label="社区数据">
        {communityStats.map((item) => {
          const StatIcon = statIcons[item.icon];

          return (
            <article
              className={cx("home-stat-card", `home-stat-card-${item.icon}`)}
              key={item.label}
            >
              <span
                className={cx("home-stat-icon", `home-stat-icon-${item.icon}`)}
                aria-hidden="true"
              >
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

      <section className={cx("home-flow-section")} aria-labelledby="home-flow-title">
        <div className={cx("home-section-heading home-flow-heading")}>
          <h2 id="home-flow-title">从活动到合作</h2>
          <p>活动不是终点，而是让问题、伙伴和项目进入同一个现场</p>
        </div>

        <div className={cx("home-flow-layout")}>
          <div className={cx("home-flow-cards")}>
            {homeFlowSteps.map((item, index) => (
              <article
                className={cx("home-flow-card", `home-flow-card-${item.tone}`)}
                key={item.title}
              >
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <div
                  className={cx("home-flow-illustration")}
                  aria-hidden="true"
                >
                  <Image
                    src={item.illustrationSrc}
                    alt={item.illustrationAlt}
                    width={1124}
                    height={1400}
                    className={cx("home-flow-illustration-image")}
                    aria-hidden="true"
                    sizes="(max-width: 820px) 70vw, 220px"
                  />
                </div>
                {index < homeFlowSteps.length - 1 ? (
                  <i className={cx("home-flow-arrow")} aria-hidden="true" />
                ) : null}
              </article>
            ))}
          </div>

          <article className={cx("home-next-event-card")}>
            <div className={cx("home-next-event-copy")}>
              <p className={cx("home-next-event-kicker")}>
                {hasUpcomingEvent ? "下一场活动等你来！" : "下一场活动筹备中"}
              </p>
              <h3>
                {primaryScheduledEvent?.title ?? "近期活动正在筹备中"}
              </h3>
              <ul className={cx("home-next-event-meta")}>
                <li>
                  <CalendarDays aria-hidden="true" strokeWidth={1.9} />
                  <span>{hasUpcomingEvent ? nextEventDateLabel : "时间待定"}</span>
                </li>
                <li>
                  <MapPin aria-hidden="true" strokeWidth={1.9} />
                  <span>{nextEventLocationLabel}</span>
                </li>
              </ul>
              <p className={cx("home-next-event-note")}>
                {hasUpcomingEvent
                  ? "活动已开放报名，报名状态以活动详情页为准。"
                  : "新的线下活动发布后，会第一时间出现在活动页。"}
              </p>
              <Link
                href={primaryScheduledEvent ? `/events/${primaryScheduledEvent.slug}` : "/events"}
                prefetch={false}
                className={cx("button home-primary-button home-next-event-button")}
              >
                {hasUpcomingEvent ? "查看活动详情" : "查看活动列表"}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <Image
              src="/event-card-character-v2-card.webp"
              alt=""
              width={1024}
              height={1536}
              className={cx("home-event-person")}
              aria-hidden="true"
              priority={false}
              sizes="(max-width: 1024px) 1px, 220px"
            />
            <DoodleSparkles className={cx("home-doodle home-doodle-event-sparkles")} />
          </article>
        </div>
      </section>

      <section className={cx("home-member-stories")} aria-labelledby="home-member-stories-title">
        <div className={cx("home-card-heading home-showcase-heading")}>
          <div>
            <h2 id="home-member-stories-title">成员故事</h2>
            <p>他们在这里把经验、问题和 AI 能力连接起来</p>
          </div>
          <Link href="/members" prefetch={false}>查看更多故事 →</Link>
        </div>

        {memberStories.length > 0 ? (
          <div className={cx("home-member-story-grid")}>
            {memberStories.map((item) => (
              <Link
                href={"href" in item ? item.href : "/members"}
                prefetch={false}
                className={cx("home-member-story-card")}
                key={item.id}
              >
                <div className={cx("home-member-story-head")}>
                  <div className={cx("home-member-story-avatar")} aria-hidden="true">
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
                <div className={cx("home-member-story-tags")} aria-label="成员技能标签">
                  {item.tags[0] ? <span>{item.tags[0]}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={cx("home-empty-state")}>
            暂无成员故事，期待你加入后在这里分享经验。
          </div>
        )}
      </section>

      <section className={cx("home-community-updates")} aria-labelledby="home-community-updates-title">
        <div className={cx("home-card-heading home-showcase-heading")}>
          <div>
            <h2 id="home-community-updates-title">社区动态</h2>
            <p>活动报道、成员分享和项目进展，会先在这里轻量沉淀</p>
          </div>
          <Link href="/updates" prefetch={false}>查看全部动态 →</Link>
        </div>

        {recentCommunityUpdates.length > 0 ? (
          <div className={cx("home-community-update-list")}>
            {recentCommunityUpdates.map((update) => {
              const updateDate = update.publishedAt ?? update.createdAt;
              const coverImage = update.images[0];

              return (
                <Link
                  href={update.href}
                  prefetch={false}
                  className={cx("home-community-update-card")}
                  key={update.id}
                >
                  <div className={cx("home-community-update-head")}>
                    <div className={cx("home-community-update-avatar")} aria-hidden="true">
                      {update.author.avatarUrl ? (
                        <img
                          src={update.author.avatarUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{update.author.displayName.slice(0, 1)}</span>
                      )}
                    </div>
                    <div>
                      <strong>{update.author.displayName}</strong>
                      <small>
                        {update.author.roleLabel ?? update.author.organization ?? update.author.city}
                      </small>
                    </div>
                  </div>

                  <div className={cx("home-community-update-body")}>
                    <h3>{update.title ?? update.typeLabel}</h3>
                    <p>{update.excerpt}</p>
                  </div>

                  {coverImage ? (
                    <div className={cx("home-community-update-media")}>
                      <img
                        src={coverImage.imageUrl}
                        alt={coverImage.alt ?? update.title ?? update.typeLabel}
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  <div className={cx("home-community-update-foot")}>
                    <span>{update.typeLabel}</span>
                    <small>
                      <Clock3 aria-hidden="true" strokeWidth={1.8} />
                      {formatReviewDate(updateDate)}
                    </small>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={cx("home-empty-state")}>
            暂无公开社区动态。活动报道、成员分享和项目进展发布后会出现在这里。
          </div>
        )}
      </section>

      <section className={cx("home-event-review-section")} aria-labelledby="home-event-review-title">
        <div className={cx("home-card-heading home-showcase-heading")}>
          <div>
            <h2 id="home-event-review-title">近期活动回顾</h2>
            <p>看看最近几场线下活动如何沉淀问题、案例和连接</p>
          </div>
          <Link href="/events" prefetch={false}>查看更多 →</Link>
        </div>

        {recentEvents.length > 0 ? (
          <div className={cx("home-event-review-grid")}>
            {recentEvents.map((item) => (
              <Link
                href={`/events/${item.slug}`}
                prefetch={false}
                className={cx("home-event-review-card")}
                key={item.id}
              >
                <div className={cx("home-event-review-media")}>
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
                <div className={cx("home-event-review-copy")}>
                  <small>{formatReviewDate(item.isoDate)}</small>
                  <h3>{item.title}</h3>
                  <p>{item.locationLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={cx("home-empty-state")}>
            暂无活动回顾内容，欢迎稍后再来查看社区最新记录。
          </div>
        )}
      </section>

      <SiteSponsors />

      <section className={cx("home-join-banner")} aria-labelledby="home-join-banner-title">
        <div className={cx("home-join-banner-copy")}>
          <span className={cx("home-join-banner-eyebrow")}>连接・分享・共创</span>
          <h2 id="home-join-banner-title">
            <span>加入社区，</span>把问题带到现场
          </h2>
          <div className={cx("home-join-banner-actions")}>
            <Link href="/join" prefetch={false} className={cx("button home-primary-button home-join-banner-button")}>
              申请加入
              <span aria-hidden="true">→</span>
            </Link>
            <div className={cx("home-join-banner-proof")}>
              <strong>300+</strong>
              <span>位成员已加入我们</span>
            </div>
          </div>
          <Link href={CO_BUILDER_RULES_PATH} prefetch={false} className={cx("home-join-banner-rule-link")}>
            想参与社区共建？查看协作规则
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
        </div>

        <div className={cx("home-join-banner-illustration")} aria-hidden="true">
          <Image
            src="/join-card-optimized.webp"
            alt=""
            width={1000}
            height={577}
            sizes="(max-width: 820px) 180px, 320px"
            className={cx("home-join-banner-illustration-image")}
          />
        </div>

        <div className={cx("home-join-official")}>
          <div className={cx("home-join-official-copy")}>
            <span>关注公众号</span>
            <strong>常州 AI Club 共创社区</strong>
          </div>
          <div className={cx("home-join-official-qr")}>
            <img
              src={officialCommunityChannels[0].qrImageUrl}
              alt="常州 AI Club 共创社区公众号二维码"
              width={196}
              height={196}
            />
          </div>
          <div className={cx("home-join-official-action")}>
            <SocialPlatformIcon tone="wechat" className={cx("home-join-official-icon")} />
            <span>扫码关注</span>
          </div>
        </div>
      </section>
    </div>
  );
}
