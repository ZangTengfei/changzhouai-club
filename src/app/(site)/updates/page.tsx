import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Heart,
  Plus,
  Sparkles,
  Tags,
} from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { formatChangzhouDateTime, formatChangzhouIsoDate } from "@/lib/changzhou-time";
import {
  communityUpdateTypeLabels,
  getPublicCommunityUpdatesDirectory,
  isCommunityUpdateType,
  type PublicCommunityUpdate,
} from "@/lib/community-updates";
import { cn } from "@/lib/utils";

import styles from "./updates-page.module.css";

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
    <article className={styles.updateCard}>
      <div className={styles.updateCardHead}>
        <Link href={update.author.href} className={styles.updateAuthor}>
          <MemberAvatar
            name={update.author.displayName}
            avatarUrl={update.author.avatarUrl}
            size="sm"
          />
          <span>
            <strong>{update.author.displayName}</strong>
            <small>{authorMeta}</small>
          </span>
        </Link>

        <time dateTime={updateDate}>{formatTimelineTime(updateDate)}</time>
      </div>

      <div className={styles.updateActionRow}>
        <span>{update.typeLabel}</span>
        {update.isPinned ? <i>置顶</i> : null}
        {update.isFeatured ? <i>精华</i> : null}
      </div>

      <div className={styles.updateCardBody}>
        {update.title ? (
          <Link href={update.href} className={styles.updateTitleLink}>
            <h2>{update.title}</h2>
          </Link>
        ) : null}

        <p className={styles.updateExcerpt}>{update.excerpt}</p>
      </div>

      {previewImages.length > 0 ? (
        <Link
          href={update.href}
          className={cn(
            styles.updateImageGrid,
            previewImages.length === 1 ? styles.updateImageGridSingle : null,
          )}
          aria-label={`查看 ${update.title ?? update.typeLabel} 的图片动态`}
        >
          {previewImages.map((image) => (
            <span key={image.id}>
              <img
                src={image.imageUrl}
                alt={image.alt ?? update.title ?? update.typeLabel}
              />
            </span>
          ))}
        </Link>
      ) : null}

      {update.tags.length > 0 ? (
        <div className={styles.updateTags}>
          {update.tags.slice(0, 5).map((tag) => (
            <span key={`${update.id}-${tag}`}>{tag}</span>
          ))}
        </div>
      ) : null}

      <div className={styles.updateCardFoot}>
        <span>
          <Heart aria-hidden="true" strokeWidth={1.8} />
          {update.likeCount}
        </span>
        <span>
          <Eye aria-hidden="true" strokeWidth={1.8} />
          {update.viewCount}
        </span>
        <Link href={update.href}>
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
    <div className={styles.updatesPageStack}>
      <section className={styles.timelineHeader} aria-labelledby="updates-title">
        <div className={styles.timelineHeaderCopy}>
          <p className="home-kicker">Updates · 社区动态</p>
          <h1 id="updates-title">{feedTitle}</h1>
          <p>
            按时间记录活动现场、项目进展、经验分享、问题求助和协作招募。轻量记录先沉淀，
            高价值内容再整理进活动回顾、项目协作或社区文档。
          </p>
        </div>

        <div className={styles.timelineHeaderSide}>
          <span>{directory.stats.updates} 条动态</span>
          <Link href="/account?submit=update#updates" className="button home-primary-button">
            <Plus aria-hidden="true" strokeWidth={2} />
            发布动态
          </Link>
        </div>
      </section>

      <section className={styles.updatesFilterPanel} aria-label="动态类型筛选">
        <nav className={styles.typeFilters}>
          <Link
            href="/updates"
            className={!activeType ? styles.activeFilter : undefined}
          >
            全部
          </Link>
          {typeEntries.map(([type, label]) => (
            <Link
              href={`/updates?type=${type}`}
              className={activeType === type ? styles.activeFilter : undefined}
              key={type}
            >
              {label}
            </Link>
          ))}
        </nav>

        {directory.tags.length > 0 ? (
          <div className={styles.updatesHotTags}>
            <Tags aria-hidden="true" strokeWidth={1.8} />
            {directory.tags.slice(0, 8).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </section>

      {timelineGroups.length > 0 ? (
        <section className={styles.timelineSection} id="updates-feed" aria-label="社区动态时间线">
          {timelineGroups.map((group) => (
            <div className={styles.timelineGroup} key={group.key}>
              <time className={styles.timelineDate} dateTime={group.key}>
                {group.label}
              </time>

              <ol className={styles.timelineItems}>
                {group.updates.map((update) => (
                  <li className={styles.timelineItem} key={update.id}>
                    <TimelineUpdate update={update} />
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ) : (
        <section className={styles.updatesEmptyPanel}>
          <Sparkles aria-hidden="true" strokeWidth={1.8} />
          <strong>这里还在等待第一批动态</strong>
          <p>成员提交并审核通过后，活动瞬间、项目进展和经验分享会按时间出现在这里。</p>
          <Link href="/account?submit=update#updates" className="button home-primary-button">
            <Plus aria-hidden="true" strokeWidth={2} />
            发布动态
          </Link>
        </section>
      )}
    </div>
  );
}
