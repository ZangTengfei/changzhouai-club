import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Heart,
  Sparkles,
  Tags,
} from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { RevealImage } from "@/components/reveal-image";
import { formatChangzhouDateTime, formatChangzhouIsoDate } from "@/lib/changzhou-time";
import {
  communityUpdateTypeLabels,
  getPublicCommunityUpdatesDirectory,
  isCommunityUpdateType,
  type PublicCommunityUpdate,
} from "@/lib/community-updates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "社区动态",
  description: "查看常州 AI Club 成员的活动瞬间、项目进展、经验分享和协作招募。",
};

type UpdatesPageProps = {
  searchParams: Promise<{
    type?: string;
  }>;
};

type TimelineGroup = {
  key: string;
  label: string;
  updates: PublicCommunityUpdate[];
};

const typeEntries = Object.entries(communityUpdateTypeLabels);
const filterLinkClassName =
  "inline-flex min-h-[34px] items-center rounded-[var(--radius-pill)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.66)] px-3 text-[0.86rem] font-[850] text-[rgba(var(--ink-rgb),0.68)] no-underline transition-colors hover:border-[rgba(var(--accent-rgb),0.28)] hover:bg-[rgba(var(--accent-rgb),0.1)] hover:text-[var(--accent-strong)] focus-visible:border-[rgba(var(--accent-rgb),0.28)] focus-visible:bg-[rgba(var(--accent-rgb),0.1)] focus-visible:text-[var(--accent-strong)]";
const activeFilterLinkClassName =
  "border-[rgba(var(--accent-rgb),0.28)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent-strong)]";

function getUpdateDateValue(update: PublicCommunityUpdate) {
  return update.publishedAt ?? update.createdAt;
}

function getUpdateTimestamp(update: PublicCommunityUpdate) {
  const timestamp = new Date(getUpdateDateValue(update)).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatTimelineDay(value: string) {
  return formatChangzhouDateTime(value, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimelineTime(value: string) {
  return formatChangzhouDateTime(value, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getTimelineGroups(updates: PublicCommunityUpdate[]) {
  const groups = new Map<string, TimelineGroup>();

  [...updates]
    .sort((a, b) => getUpdateTimestamp(b) - getUpdateTimestamp(a))
    .forEach((update) => {
      const updateDate = getUpdateDateValue(update);
      const key = formatChangzhouIsoDate(updateDate) ?? updateDate;
      const existingGroup = groups.get(key);

      if (existingGroup) {
        existingGroup.updates.push(update);
        return;
      }

      groups.set(key, {
        key,
        label: formatTimelineDay(updateDate),
        updates: [update],
      });
    });

  return [...groups.values()];
}

function TimelineUpdate({ update }: { update: PublicCommunityUpdate }) {
  const updateDate = getUpdateDateValue(update);
  const previewImages = update.images.slice(0, 4);
  const authorMeta = update.author.roleLabel ?? update.author.organization ?? update.author.city;

  return (
    <article className="grid min-w-0 gap-3 rounded-[var(--radius-md)] bg-white p-[18px] shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)]">
      <div className="flex items-start justify-between gap-3.5 max-[820px]:grid">
        <Link href={update.author.href} prefetch={false} className="grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3 text-inherit no-underline">
          <MemberAvatar
            name={update.author.displayName}
            avatarUrl={update.author.avatarUrl}
            size="sm"
          />
          <span className="grid min-w-0 gap-[3px]">
            <strong className="block overflow-hidden text-[0.95rem] font-black text-ellipsis whitespace-nowrap text-[#111b1f]">{update.author.displayName}</strong>
            <small className="block text-[0.8rem] leading-[1.35] font-[750] text-[rgba(var(--ink-rgb),0.54)]">{authorMeta}</small>
          </span>
        </Link>

        <time className="block flex-none pt-[5px] text-[0.8rem] leading-[1.35] font-[750] text-[rgba(var(--ink-rgb),0.54)] max-[820px]:pt-0" dateTime={updateDate}>{formatTimelineTime(updateDate)}</time>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex min-h-[26px] items-center rounded-[var(--radius-pill)] bg-[rgba(var(--accent-rgb),0.1)] px-[9px] text-xs font-black text-[var(--accent-strong)]">{update.typeLabel}</span>
        {update.isPinned ? <i className="inline-flex min-h-[26px] items-center rounded-[var(--radius-pill)] bg-[rgba(246,190,75,0.17)] px-[9px] text-xs font-black not-italic text-[#a76b12]">置顶</i> : null}
        {update.isFeatured ? <i className="inline-flex min-h-[26px] items-center rounded-[var(--radius-pill)] bg-[rgba(246,190,75,0.17)] px-[9px] text-xs font-black not-italic text-[#a76b12]">精华</i> : null}
      </div>

      <div className="grid min-w-0 max-w-[740px] gap-2.5">
        {update.title ? (
          <Link href={update.href} prefetch={false} className="text-inherit no-underline [&_h2]:m-0 [&_h2]:text-[1.22rem] [&_h2]:leading-[1.32] [&_h2]:font-black [&_h2]:tracking-normal [&_h2]:text-[#111b1f] hover:[&_h2]:text-[var(--accent-strong)] focus-visible:[&_h2]:text-[var(--accent-strong)]">
            <h2>{update.title}</h2>
          </Link>
        ) : null}

        <p className="m-0 line-clamp-4 text-[0.98rem] leading-[1.78] text-[rgba(var(--ink-rgb),0.7)]">{update.excerpt}</p>
      </div>

      {previewImages.length > 0 ? (
        <Link
          href={update.href}
          prefetch={false}
          className={cn(
            "grid max-w-[720px] grid-cols-3 gap-2 no-underline hover:[&_img]:scale-[1.02] focus-visible:[&_img]:scale-[1.02] max-[820px]:grid-cols-1 [&_img]:block [&_img]:size-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-200 [&>span]:aspect-[1.6/1] [&>span]:overflow-hidden [&>span]:rounded-[var(--radius-sm)] [&>span]:bg-[#dbe3db]",
            previewImages.length === 1 && "grid-cols-[minmax(0,520px)] max-[820px]:grid-cols-1 [&>span]:aspect-[2.1/1]",
          )}
          aria-label={`查看 ${update.title ?? update.typeLabel} 的图片动态`}
        >
          {previewImages.map((image) => (
            <span key={image.id}>
              <RevealImage
                src={image.imageUrl}
                alt={image.alt ?? update.title ?? update.typeLabel}
              />
            </span>
          ))}
        </Link>
      ) : null}

      {update.tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {update.tags.slice(0, 5).map((tag) => (
            <span className="inline-flex min-h-[26px] items-center rounded-[var(--radius-pill)] border border-[rgba(var(--accent-rgb),0.12)] bg-[rgba(var(--accent-rgb),0.07)] px-[9px] text-[0.76rem] font-[850] text-[rgba(var(--ink-rgb),0.66)]" key={`${update.id}-${tag}`}>{tag}</span>
          ))}
        </div>
      ) : null}

      <div className="flex max-w-[740px] flex-wrap items-center gap-[13px] [&_svg]:size-4">
        <span className="inline-flex items-center gap-[5px] text-[0.82rem] font-[850] text-[rgba(var(--ink-rgb),0.58)]">
          <Heart aria-hidden="true" strokeWidth={1.8} />
          {update.likeCount}
        </span>
        <span className="inline-flex items-center gap-[5px] text-[0.82rem] font-[850] text-[rgba(var(--ink-rgb),0.58)]">
          <Eye aria-hidden="true" strokeWidth={1.8} />
          {update.viewCount}
        </span>
        <Link className="ml-auto inline-flex items-center gap-[5px] text-[0.82rem] font-[850] text-[var(--accent-strong)] no-underline max-[820px]:ml-0 max-[820px]:w-full" href={update.href} prefetch={false}>
          查看详情
          <ArrowRight aria-hidden="true" strokeWidth={2} />
        </Link>
      </div>
    </article>
  );
}

export default async function UpdatesPage({ searchParams }: UpdatesPageProps) {
  const params = await searchParams;
  const activeType = params.type && isCommunityUpdateType(params.type) ? params.type : null;
  const directory = await getPublicCommunityUpdatesDirectory(activeType);
  const timelineGroups = getTimelineGroups(directory.updates);
  const feedTitle = activeType ? communityUpdateTypeLabels[activeType] : "社区正在发生什么";

  return (
    <div className="mx-auto grid max-w-[980px] gap-5 max-[820px]:gap-[18px]">
      <section className="flex items-end justify-between gap-6 border-b border-[rgba(var(--ink-rgb),0.08)] pt-2 pb-[18px] max-lg:items-start max-[820px]:grid" aria-labelledby="updates-title">
        <div className="grid min-w-0 gap-3">
          <p className="home-kicker">Updates · 社区动态</p>
          <h1 className="m-0 text-[clamp(2.35rem,5vw,3.45rem)] leading-[1.05] font-black tracking-normal text-[#111b1f]" id="updates-title">{feedTitle}</h1>
          <p className="m-0 max-w-[44rem] text-base leading-[1.76] text-[rgba(var(--ink-rgb),0.68)]">
            按时间记录活动现场、项目进展、经验分享、问题求助和协作招募。轻量记录先沉淀，
            高价值内容再整理进活动回顾、项目协作或案例库。
          </p>
        </div>

        <div className="grid flex-none justify-items-end gap-3 max-[820px]:justify-items-start">
          <span className="text-[0.86rem] font-[850] text-[rgba(var(--ink-rgb),0.58)]">{directory.stats.updates} 条动态</span>
        </div>
      </section>

      <section className="grid gap-3 pb-2" aria-label="动态类型筛选">
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/updates"
            prefetch={false}
            className={cn(filterLinkClassName, !activeType && activeFilterLinkClassName)}
          >
            全部
          </Link>
          {typeEntries.map(([type, label]) => (
            <Link
              href={`/updates?type=${type}`}
              prefetch={false}
              className={cn(filterLinkClassName, activeType === type && activeFilterLinkClassName)}
              key={type}
            >
              {label}
            </Link>
          ))}
        </nav>

        {directory.tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-[0.82rem] font-extrabold text-[rgba(var(--ink-rgb),0.56)]">
            <Tags className="size-[18px] text-primary" aria-hidden="true" strokeWidth={1.8} />
            {directory.tags.slice(0, 8).map((tag) => (
              <span className="inline-flex min-h-[26px] items-center rounded-[var(--radius-pill)] bg-[rgba(var(--ink-rgb),0.045)] px-[9px]" key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </section>

      {timelineGroups.length > 0 ? (
        <section className="grid gap-[26px]" id="updates-feed" aria-label="社区动态时间线">
          {timelineGroups.map((group) => (
            <div className="grid grid-cols-[118px_minmax(0,1fr)] items-start gap-[22px] max-lg:grid-cols-1 max-lg:gap-2.5" key={group.key}>
              <time className="sticky top-[94px] inline-flex min-h-[34px] items-center justify-end text-right text-[0.86rem] leading-[1.35] font-black text-[rgba(var(--ink-rgb),0.58)] max-lg:static max-lg:justify-start max-lg:text-left" dateTime={group.key}>
                {group.label}
              </time>

              <ol className="m-0 grid min-w-0 list-none gap-0 border-l border-[rgba(var(--accent-rgb),0.18)] py-0 pr-0 pl-6 max-[820px]:pl-5">
                {group.updates.map((update) => (
                  <li className="relative min-w-0 pb-7 last:pb-0.5 before:absolute before:top-[18px] before:left-[-30px] before:size-[11px] before:rounded-[var(--radius-pill)] before:border-2 before:border-[rgba(var(--accent-rgb),0.34)] before:bg-[#faf8f1] before:content-[''] max-[820px]:before:left-[-26px]" key={update.id}>
                    <TimelineUpdate update={update} />
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ) : (
        <section className="grid justify-items-start gap-2.5 rounded-[var(--radius-md)] border border-[rgba(208,214,207,0.72)] bg-[linear-gradient(180deg,rgba(246,244,238,0.94),rgba(241,239,232,0.88))] p-7 shadow-[0_12px_28px_rgba(var(--ink-rgb),0.045),inset_0_1px_0_rgba(255,255,255,0.62)]">
          <Sparkles className="size-10 text-primary" aria-hidden="true" strokeWidth={1.8} />
          <strong className="m-0 text-[1.18rem] text-[#111b1f]">这里还在等待第一批动态</strong>
          <p className="m-0 leading-[1.68] text-[rgba(var(--ink-rgb),0.62)]">成员提交并审核通过后，活动瞬间、项目进展和经验分享会按时间出现在这里。</p>
        </section>
      )}
    </div>
  );
}
