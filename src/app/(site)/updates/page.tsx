import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Heart,
  MessageCircle,
  Plus,
  Sparkles,
  Tags,
  UsersRound,
} from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import {
  communityUpdateTypeLabels,
  getPublicCommunityUpdatesDirectory,
  isCommunityUpdateType,
  type PublicCommunityUpdate,
} from "@/lib/community-updates";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
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

const typeEntries = Object.entries(communityUpdateTypeLabels);

function formatUpdateDate(value: string | null) {
  if (!value) {
    return "刚刚";
  }

  return formatChangzhouDateTime(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function UpdateCard({ update, featured = false }: { update: PublicCommunityUpdate; featured?: boolean }) {
  const previewImages = update.images.slice(0, featured ? 3 : 2);

  return (
    <article className={cn(styles.updateCard, featured ? styles.updateCardFeatured : null)}>
      <div className={styles.updateCardHead}>
        <Link href={update.author.href} className={styles.updateAuthor}>
          <MemberAvatar
            name={update.author.displayName}
            avatarUrl={update.author.avatarUrl}
            size="sm"
          />
          <span>
            <strong>{update.author.displayName}</strong>
            <small>
              {update.author.roleLabel ?? update.author.organization ?? update.author.city}
            </small>
          </span>
        </Link>

        <time dateTime={update.publishedAt ?? update.createdAt}>
          {formatUpdateDate(update.publishedAt ?? update.createdAt)}
        </time>
      </div>

      <Link href={update.href} className={styles.updateCardBody}>
        <div className={styles.updateTypeRow}>
          <span>{update.typeLabel}</span>
          {update.isFeatured ? <i>精华</i> : null}
          {update.isPinned ? <i>置顶</i> : null}
        </div>
        <h2>{update.title || update.typeLabel}</h2>
        <p>{update.excerpt}</p>
      </Link>

      {previewImages.length > 0 ? (
        <Link
          href={update.href}
          className={cn(
            styles.updateImageGrid,
            previewImages.length === 1 ? styles.updateImageGridSingle : null,
          )}
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
          <MessageCircle aria-hidden="true" strokeWidth={1.8} />
          {update.commentCount}
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
  const featuredUpdates = directory.featuredUpdates;
  const updates = directory.updates;
  const stats = [
    {
      value: directory.stats.updates,
      label: "公开动态",
      detail: "成员分享与社区记录",
      icon: MessageCircle,
    },
    {
      value: directory.stats.featured,
      label: "精华沉淀",
      detail: "适合优先阅读",
      icon: Sparkles,
    },
    {
      value: directory.stats.authors,
      label: "参与成员",
      detail: "正在贡献一手经验",
      icon: UsersRound,
    },
    {
      value: directory.stats.images,
      label: "图片记录",
      detail: "活动与项目现场",
      icon: Eye,
    },
  ];

  return (
    <div className={styles.updatesPageStack}>
      <section className={styles.updatesHero} aria-labelledby="updates-hero-title">
        <div className={styles.updatesHeroCopy}>
          <p className="home-kicker">Updates · 社区动态</p>
          <h1 id="updates-hero-title">
            看见社区
            <span>正在发生什么</span>
          </h1>
          <p>
            这里沉淀活动现场、项目进展、经验分享、问题求助和协作招募。它比文档更轻，
            也让值得反复查看的社区精华更容易被找到。
          </p>

          <div className={styles.updatesHeroActions}>
            <Link href="#updates-feed" className="button home-primary-button">
              浏览动态
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/account?submit=update#updates" className="button home-ghost-button">
              <Plus aria-hidden="true" strokeWidth={2} />
              发布动态
            </Link>
          </div>
        </div>

        <aside className={styles.updatesHeroPanel} aria-label="社区动态说明">
          <span>Community Feed</span>
          <strong>{directory.stats.updates || "动态待更新"}</strong>
          <p>
            先用轻量动态记录现场和想法，再把高价值内容整理进活动回顾、项目共建或社区文档。
          </p>
        </aside>
      </section>

      <section className={styles.updatesStatsPanel} aria-label="社区动态数据">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <article className={styles.updatesStatCard} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.9} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </article>
          );
        })}
      </section>

      <section className={styles.updatesFilterPanel} aria-label="动态类型筛选">
        <nav>
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

      {featuredUpdates.length > 0 ? (
        <section className={styles.updatesFeaturedSection} aria-labelledby="updates-featured-title">
          <div className={styles.updatesSectionHeading}>
            <p className="home-kicker">Featured</p>
            <div>
              <h2 id="updates-featured-title">精华动态</h2>
              <p>优先展示已经被社区确认值得继续沉淀的内容。</p>
            </div>
          </div>

          <div className={styles.updatesFeaturedGrid}>
            {featuredUpdates.slice(0, 2).map((update) => (
              <UpdateCard update={update} featured key={`featured-${update.id}`} />
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.updatesFeedSection} id="updates-feed">
        <div className={styles.updatesSectionHeading}>
          <p className="home-kicker">Feed</p>
          <div>
            <h2>{activeType ? communityUpdateTypeLabels[activeType] : "全部动态"}</h2>
            <p>从日常分享里看见真实活动、真实问题和真实协作机会。</p>
          </div>
        </div>

        {updates.length > 0 ? (
          <div className={styles.updatesFeedList}>
            {updates.map((update) => (
              <UpdateCard update={update} key={update.id} />
            ))}
          </div>
        ) : (
          <div className={styles.updatesEmptyPanel}>
            <Sparkles aria-hidden="true" strokeWidth={1.8} />
            <strong>这里还在等待第一批动态</strong>
            <p>成员提交并审核通过后，活动瞬间、项目进展和经验分享会出现在这里。</p>
            <Link href="/account?submit=update#updates" className="button home-primary-button">
              <Plus aria-hidden="true" strokeWidth={2} />
              发布动态
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
