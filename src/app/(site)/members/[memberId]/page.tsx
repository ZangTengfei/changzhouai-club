import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  MessageCircle,
  Network,
  Sparkles,
  Tags,
  UserRound,
  Wrench,
} from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicMemberByHandle } from "@/lib/community-members";
import { getMemberPublicSlugPath, isUuidLike } from "@/lib/member-public-slug";

import styles from "./member-detail-page.module.css";

function formatMemberHeadline(member: {
  roleLabel: string | null;
  organization: string | null;
  city: string;
}) {
  const items = [member.roleLabel, member.organization, member.city].filter(Boolean);
  return items.join(" · ");
}

function formatJoinDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildParticipationSignals(member: {
  willingToShare: boolean;
  willingToJoinProjects: boolean;
}) {
  const items = ["已公开展示"];

  if (member.willingToShare) {
    items.push("愿意分享");
  }

  if (member.willingToJoinProjects) {
    items.push("愿意参与共建");
  }

  return items;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberId: string }>;
}): Promise<Metadata> {
  const { memberId } = await params;
  const member = await getPublicMemberByHandle(memberId);

  if (!member) {
    return {
      title: "成员主页",
      description: "查看常州 AI Club 成员的公开资料。",
    };
  }

  return {
    title: `${member.displayName} · 成员主页`,
    description:
      member.bio?.trim() ||
      formatMemberHeadline(member) ||
      "查看常州 AI Club 成员的公开资料。",
  };
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = await getPublicMemberByHandle(memberId);

  if (!member) {
    notFound();
  }

  if (isUuidLike(memberId) && member.publicSlug) {
    permanentRedirect(getMemberPublicSlugPath(member));
  }

  const headline = formatMemberHeadline(member);
  const signals = buildParticipationSignals(member);
  const profileFacts = [
    {
      label: "城市",
      value: member.city,
      icon: MapPin,
    },
    {
      label: "角色",
      value: member.roleLabel ?? "未填写",
      icon: UserRound,
    },
    {
      label: "组织",
      value: member.organization ?? "未填写",
      icon: BriefcaseBusiness,
    },
    {
      label: "加入时间",
      value: formatJoinDate(member.joinedAt),
      icon: CalendarDays,
    },
  ];
  const signalCards = [
    {
      title: "公开展示",
      value: "是",
      summary: "这位成员已授权在成员地图中展示公开资料。",
      icon: BadgeCheck,
      tone: "green",
    },
    {
      title: "愿意分享",
      value: member.willingToShare ? "是" : "否",
      summary: member.willingToShare
        ? "适合活动邀约、主题交流或经验分享。"
        : "当前未标记分享意愿，可先通过活动现场认识。",
      icon: MessageCircle,
      tone: "orange",
    },
    {
      title: "愿意共建",
      value: member.willingToJoinProjects ? "是" : "否",
      summary: member.willingToJoinProjects
        ? "适合项目试点、需求对接和协作探索。"
        : "当前未标记项目共建意愿。",
      icon: Wrench,
      tone: "blue",
    },
  ] as const;

  return (
    <div className={styles.memberDetailPage}>
      <section className={styles.memberHero} aria-labelledby="member-detail-title">
        <div className={styles.memberHeroCopy}>
          <p className="home-kicker">Member · 成员主页</p>
          <h1 id="member-detail-title">
            {member.displayName}
            <span>的公开成员卡</span>
          </h1>

          {headline ? <p>{headline}</p> : null}

          <p className={styles.memberHeroSummary}>
            {member.bio?.trim() ||
              "这位成员已经加入社区，目前公开展示的是基础资料与参与方向。"}
          </p>

          <div className={styles.memberSignalRow}>
            {signals.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <div className={styles.memberHeroActions}>
            <Link href="/members" className="button home-ghost-button">
              <ArrowLeft aria-hidden="true" strokeWidth={2} />
            返回成员地图
          </Link>
            <Link href="/cooperate" className="button home-primary-button">
            发起合作意向
              <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
          </div>
        </div>

        <div className={styles.memberIdentityPanel}>
          <div className={styles.memberAvatarStage}>
            <MemberAvatar
              name={member.displayName}
              avatarUrl={member.avatarUrl}
            />
            <strong>{member.displayName}</strong>
            <span>{headline || "常州 AI Club 成员"}</span>
          </div>

          <div className={styles.memberConnectionStrip}>
            <span>活动</span>
            <i aria-hidden="true" />
            <span>分享</span>
            <i aria-hidden="true" />
            <span>共建</span>
          </div>

          <div className={styles.memberStickyNote}>
            <span>成员线索</span>
            <strong>先看方向，再把一次交流变成真实合作</strong>
          </div>
          <DoodleSparkles className={styles.memberHeroDoodle} />
          <HandDrawnArrow className={styles.memberHeroArrow} />
        </div>
      </section>

      <section className={styles.memberFactsPanel} aria-label="公开资料">
        {profileFacts.map((item, index) => {
          const Icon = item.icon;

          return (
            <article className={styles.memberFactCard} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.9} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{String(index + 1).padStart(2, "0")}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.memberSignalsSection}>
        <div className={styles.memberSectionHeading}>
          <p className="home-kicker">Signals</p>
          <div>
            <h2>参与信号</h2>
            <p>公开资料不直接展示联系方式，先用这些信号判断适合怎样继续对话。</p>
          </div>
        </div>

        <div className={styles.memberSignalGrid}>
          {signalCards.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                className={`${styles.memberSignalCard} ${styles[`memberSignalCard${item.tone}`]}`}
                key={item.title}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <div>
                  <h3>{item.title}</h3>
                  <strong>{item.value}</strong>
                </div>
                <p>{item.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.memberSkillsSection}>
        <div className={styles.memberSectionHeading}>
          <p className="home-kicker">Skills</p>
          <div>
            <h2>技能与方向</h2>
            <p>这里展示成员主动公开的技能标签，便于活动邀约和协作匹配。</p>
          </div>
        </div>

        {member.skills.length > 0 ? (
          <div className={styles.memberSkillCloud}>
            {member.skills.map((skill) => (
              <ToneBadge key={`${member.id}-${skill}`} label={skill} />
            ))}
          </div>
        ) : (
          <div className={styles.memberSoftNote}>
            <Tags aria-hidden="true" strokeWidth={1.9} />
            <span>这位成员暂未补充技能标签。</span>
          </div>
        )}
      </section>

      <section className={styles.memberJoinPanel}>
        <Network aria-hidden="true" strokeWidth={1.8} />
        <div>
          <p className="home-kicker">Next</p>
          <h2>想和这位成员进一步连接？</h2>
          <p>可以先通过活动现场、项目共建或合作联系留下明确的交流场景。</p>
        </div>
        <Link href="/cooperate" className="button home-primary-button">
          合作联系
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </Link>
      </section>
    </div>
  );
}
