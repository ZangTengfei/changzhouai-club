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
  Sparkles,
  Tags,
  UserRound,
  Wrench,
} from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { MemberWorkCard } from "@/components/member-work-card";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicMemberByHandle, isCorePublicMember } from "@/lib/community-members";
import { getPublicWorksByMemberId } from "@/lib/community-works";
import { getMemberPublicSlugPath, isUuidLike } from "@/lib/member-public-slug";
import {
  createNoIndexMetadata,
  createPageMetadata,
  isSearchIndexablePublicMember,
} from "@/lib/seo";
import { cn } from "@/lib/utils";

const memberSectionClassName =
  "grid gap-4 rounded-[var(--radius-md)] bg-white p-5 shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-sm:p-4";
const memberSectionHeadingClassName =
  "grid gap-1.5 [&_h2]:m-0 [&_h2]:text-[1.72rem] [&_h2]:leading-[1.12] [&_h2]:font-black [&_h2]:tracking-normal [&_h2]:text-[#111a1d] [&_div>p]:mt-[5px] [&_div>p]:mb-0 [&_div>p]:max-w-[44rem] [&_div>p]:text-[0.95rem] [&_div>p]:leading-[1.58] [&_div>p]:font-semibold [&_div>p]:text-[rgba(var(--ink-rgb),0.64)] max-sm:[&_h2]:text-[1.48rem]";
const signalCardToneClassNames = {
  green: "text-primary",
  orange: "text-[#ee7f18]",
  blue: "text-[#2a7bd3]",
} as const;
const signalCardBackgroundClassNames = [
  "bg-[#edf5ff]",
  "bg-[#fff2e5]",
  "bg-[#f3efff]",
  "bg-[#edf5ff]",
] as const;

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
  status: string;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  isCoBuilder: boolean;
}) {
  const items = ["已公开展示"];

  if (isCorePublicMember(member)) {
    items.push("核心成员");
  } else if (member.isCoBuilder) {
    items.push("共建成员");
  }

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
    return createNoIndexMetadata(
      "成员主页",
      "查看常州 AI Club 成员的公开资料。",
      `/members/${memberId}`,
    );
  }

  return createPageMetadata({
    title: `${member.displayName} · 成员主页`,
    description:
      member.bio?.trim() ||
      formatMemberHeadline(member) ||
      "查看常州 AI Club 成员的公开资料。",
    path: getMemberPublicSlugPath(member),
    image: member.avatarUrl,
    imageAlt: `${member.displayName} 的公开成员头像`,
    noIndex: !isSearchIndexablePublicMember(member),
  });
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

  const works = await getPublicWorksByMemberId(member.id);
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
      title: "社区层级",
      value: isCorePublicMember(member)
        ? "核心成员"
        : member.isCoBuilder
          ? "共建成员"
          : "社区成员",
      summary: isCorePublicMember(member)
        ? "参与社区方向、活动节奏与长期维护。"
        : member.isCoBuilder
          ? "已经开始参与活动、内容、项目或运营共建。"
          : "已授权公开展示，可以通过活动和主题继续认识。",
      icon: Sparkles,
      tone: "green",
    },
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
        : "当前未标记项目协作意愿。",
      icon: Wrench,
      tone: "blue",
    },
  ] as const;

  return (
    <div className="grid gap-[22px] max-sm:gap-[18px]">
      <section className="grid grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] items-stretch gap-6 pt-[18px] pb-0.5 max-lg:grid-cols-1 max-sm:gap-[18px] max-sm:pt-0" aria-labelledby="member-detail-title">
        <div className="grid min-w-0 content-center gap-4 max-sm:gap-3.5">
          <p className="home-kicker">Member · 成员主页</p>
          <h1 className="m-0 max-w-[760px] text-[3.3rem] leading-[1.04] font-black tracking-normal text-[#111b1f] max-lg:text-5xl max-sm:text-[2.42rem]" id="member-detail-title">
            {member.displayName}
            <span className="ml-[0.28em] inline text-primary max-sm:ml-0 max-sm:block">的公开成员卡</span>
          </h1>

          {headline ? <p className="m-0 max-w-[42rem] text-[1.02rem] leading-[1.72] text-[rgba(var(--ink-rgb),0.72)]">{headline}</p> : null}

          <p className="m-0 max-w-[45rem] rounded-[var(--radius-sm)] bg-[#e9f9f0] px-4 py-3.5 text-[1.02rem] leading-[1.72] text-[rgba(var(--ink-rgb),0.72)]">
            {member.bio?.trim() ||
              "这位成员已经加入社区，目前公开展示的是基础资料与参与方向。"}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {signals.map((item) => (
              <span className="inline-flex min-h-8 items-center rounded-[var(--radius-pill)] border border-[rgba(var(--accent-rgb),0.14)] bg-[rgba(255,252,247,0.78)] px-[11px] text-[0.84rem] font-[850] text-[var(--accent-strong)]" key={item}>{item}</span>
            ))}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-2.5 max-sm:[&>.button]:w-full [&_svg]:size-[18px]">
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

        <div className="grid gap-4 rounded-[var(--radius-md)] bg-white p-[18px] shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-sm:p-4">
          <div className="grid min-w-0 grid-cols-[96px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 rounded-[var(--radius-sm)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.74)] p-3.5 max-sm:grid-cols-1 max-sm:justify-items-center max-sm:text-center [&_.member-avatar]:row-span-2 [&_.member-avatar]:size-24 [&_.member-avatar]:rounded-[var(--radius-lg)] [&_.member-avatar]:shadow-[var(--shadow-md)] max-sm:[&_.member-avatar]:row-auto max-sm:[&_.member-avatar]:size-28 [&_.member-avatar-fallback]:text-[1.85rem]">
            <MemberAvatar
              name={member.displayName}
              avatarUrl={member.avatarUrl}
            />
            <strong className="min-w-0 overflow-hidden text-[1.65rem] leading-[1.1] font-black text-ellipsis whitespace-nowrap text-[#111b1f] max-sm:whitespace-normal">{member.displayName}</strong>
            <span className="min-w-0 overflow-hidden text-[0.9rem] leading-[1.35] font-extrabold text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.62)] max-sm:whitespace-normal">{headline || "常州 AI Club 成员"}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1" aria-label="公开资料">
            {profileFacts.map((item) => {
              const Icon = item.icon;

              return (
                <article className="grid min-w-0 grid-cols-[30px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-[3px] rounded-[var(--radius-sm)] border border-[rgba(var(--ink-rgb),0.07)] bg-[rgba(255,252,247,0.6)] p-3" key={item.label}>
                  <Icon className="row-span-2 size-6 text-primary" aria-hidden="true" strokeWidth={1.9} />
                  <span className="min-w-0 overflow-hidden text-[0.78rem] font-[850] text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.5)]">{item.label}</span>
                  <strong className="min-w-0 overflow-hidden text-[0.98rem] font-black text-ellipsis whitespace-nowrap text-[#152524]">{item.value}</strong>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.84fr)] items-start gap-[18px] max-lg:grid-cols-1">
        <section className={memberSectionClassName}>
          <div className={memberSectionHeadingClassName}>
            <p className="home-kicker">Skills</p>
            <div>
              <h2>技能与方向</h2>
              <p>成员主动公开的技能标签，便于活动邀约和协作匹配。</p>
            </div>
          </div>

          {member.skills.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {member.skills.map((skill) => (
                <ToneBadge key={`${member.id}-${skill}`} label={skill} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-[var(--radius-sm)] border border-dashed border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--accent-rgb),0.07)] p-3.5 text-[0.92rem] leading-[1.58] font-bold text-[rgba(var(--ink-rgb),0.68)]">
              <Tags className="size-5 text-primary" aria-hidden="true" strokeWidth={1.9} />
              <span>这位成员暂未补充技能标签。</span>
            </div>
          )}
        </section>

        <section className={memberSectionClassName}>
          <div className={memberSectionHeadingClassName}>
            <p className="home-kicker">Signals</p>
            <div>
              <h2>参与信号</h2>
              <p>公开资料不展示联系方式，先判断适合怎样继续对话。</p>
            </div>
          </div>

          <div className="grid gap-2.5">
            {signalCards.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  className={cn(
                    "grid min-w-0 grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-sm)] p-[13px] max-sm:grid-cols-1 max-sm:items-start [&_h3]:m-0 [&_h3]:text-base [&_h3]:leading-[1.2] [&_h3]:font-black [&_h3]:text-[#111a1d] [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[0.88rem] [&_p]:leading-normal [&_p]:text-[rgba(var(--ink-rgb),0.62)] [&>strong]:justify-self-end [&>strong]:text-base [&>strong]:font-black max-lg:[&>strong]:justify-self-start [&>svg]:size-7",
                    signalCardBackgroundClassNames[index],
                    signalCardToneClassNames[item.tone],
                  )}
                  key={item.title}
                >
                  <Icon aria-hidden="true" strokeWidth={1.8} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                  <strong>{item.value}</strong>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {works.length > 0 ? (
        <section className={memberSectionClassName}>
          <div className={memberSectionHeadingClassName}>
            <p className="home-kicker">Works</p>
            <div>
              <h2>作品与产品</h2>
              <p>这位成员公开展示的产品、工具、项目或案例。</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5 max-lg:grid-cols-1">
            {works.map((work) => (
              <MemberWorkCard key={work.id} work={work} compact />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-4 rounded-[var(--radius-md)] bg-[#e9f9f0] p-5 max-lg:grid-cols-1 max-sm:p-4 max-sm:[&>.button]:w-full">
        <Sparkles className="size-[34px] text-primary" aria-hidden="true" strokeWidth={1.8} />
        <div>
          <p className="home-kicker">Next</p>
          <h2 className="mt-[5px] mb-0 text-[1.68rem] leading-[1.16] font-black tracking-normal text-[#111a1d] max-sm:text-[1.48rem]">想和这位成员进一步连接？</h2>
          <p className="mt-1.5 mb-0 leading-[1.62] text-[rgba(var(--ink-rgb),0.66)]">可以先通过活动现场、项目协作或合作联系留下明确的交流场景。</p>
        </div>
        <Link href="/cooperate" className="button home-primary-button [&_svg]:size-[18px]">
          合作联系
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </Link>
      </section>
    </div>
  );
}
