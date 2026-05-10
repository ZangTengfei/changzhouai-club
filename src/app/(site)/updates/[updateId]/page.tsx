import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { MarkdownContent } from "@/components/markdown-content";
import { MemberAvatar } from "@/components/member-avatar";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import { getPublicCommunityUpdateById } from "@/lib/community-updates";

import styles from "./update-detail-page.module.css";

type UpdateDetailPageProps = {
  params: Promise<{
    updateId: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "发布时间待定";
  }

  return formatChangzhouDateTime(value, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({
  params,
}: UpdateDetailPageProps): Promise<Metadata> {
  const { updateId } = await params;
  const update = await getPublicCommunityUpdateById(updateId);

  if (!update) {
    return {
      title: "社区动态",
      description: "查看常州 AI Club 社区动态。",
    };
  }

  return {
    title: update.title ?? update.typeLabel,
    description: update.excerpt,
  };
}

export default async function UpdateDetailPage({
  params,
}: UpdateDetailPageProps) {
  const { updateId } = await params;
  const update = await getPublicCommunityUpdateById(updateId);

  if (!update) {
    notFound();
  }

  return (
    <div className={styles.updateDetailPage}>
      <Link href="/updates" className={styles.backLink}>
        <ArrowLeft aria-hidden="true" strokeWidth={2} />
        返回社区动态
      </Link>

      <article className={styles.updateArticle}>
        <header className={styles.updateHeader}>
          <div className={styles.updateAuthorRow}>
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
              {formatDateTime(update.publishedAt ?? update.createdAt)}
            </time>
          </div>

          <div className={styles.updateTypeRow}>
            <span>{update.typeLabel}</span>
            {update.isFeatured ? <i>精华</i> : null}
            {update.isPinned ? <i>置顶</i> : null}
          </div>

          <h1>{update.title || update.typeLabel}</h1>

          <div className={styles.updateMetrics} aria-label="动态互动数据">
            <span>
              <Heart aria-hidden="true" strokeWidth={1.8} />
              {update.likeCount} 赞
            </span>
            <span>
              <MessageCircle aria-hidden="true" strokeWidth={1.8} />
              {update.commentCount} 评论
            </span>
            <span>
              <Eye aria-hidden="true" strokeWidth={1.8} />
              {update.viewCount} 浏览
            </span>
          </div>
        </header>

        {update.images.length > 0 ? (
          <div className={styles.updateGallery}>
            {update.images.map((image) => (
              <img
                key={image.id}
                src={image.imageUrl}
                alt={image.alt ?? update.title ?? update.typeLabel}
              />
            ))}
          </div>
        ) : null}

        <MarkdownContent content={update.content} className={styles.updateContent} />

        {update.tags.length > 0 ? (
          <div className={styles.updateTags}>
            {update.tags.map((tag) => (
              <span key={`${update.id}-${tag}`}>{tag}</span>
            ))}
          </div>
        ) : null}

        {update.relatedUrl ? (
          <div className={styles.updateRelatedLink}>
            <Sparkles aria-hidden="true" strokeWidth={1.8} />
            <div>
              <strong>{update.relatedTypeLabel ?? "相关链接"}</strong>
              <Link href={update.relatedUrl} target="_blank" rel="noreferrer">
                {update.relatedUrl}
              </Link>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}
