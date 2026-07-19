import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Heart,
  Sparkles,
} from "lucide-react";

import { toggleCommunityUpdateLike } from "@/app/(site)/updates/actions";
import { MemberAvatar } from "@/components/member-avatar";
import { RevealHtmlImages } from "@/components/reveal-image";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import { getViewerCommunityUpdateLike } from "@/lib/community-update-interactions";
import {
  getPublicCommunityUpdateById,
  type CommunityUpdateType,
  type PublicCommunityUpdate,
} from "@/lib/community-updates";
import {
  getWechatArticleTemplate,
  renderWechatArticleHtml,
  type WechatArticleTemplateId,
} from "@/lib/wechat-article-template";

import { CommunityUpdateViewTracker } from "./community-update-view-tracker";
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

function getTemplateIdForUpdateType(type: CommunityUpdateType): WechatArticleTemplateId {
  if (type === "official") {
    return "official";
  }

  if (type === "project" || type === "collab" || type === "help") {
    return "opportunity";
  }

  return "community";
}

function buildWechatArticleMarkdown(update: PublicCommunityUpdate) {
  const imageMarkdown = update.images
    .filter((image) => !update.content.includes(image.imageUrl))
    .map((image) => {
      const alt = image.alt ?? update.title ?? update.typeLabel;
      return `![${alt}](${image.imageUrl})`;
    })
    .join("\n\n");

  return [imageMarkdown, update.content].filter(Boolean).join("\n\n");
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

  const viewerHasLiked = await getViewerCommunityUpdateLike(update.id);
  const template = getWechatArticleTemplate(getTemplateIdForUpdateType(update.type));
  const articleHtml = renderWechatArticleHtml(
    buildWechatArticleMarkdown(update),
    template,
    {
      title: update.title || update.typeLabel,
    },
  );

  return (
    <div className={styles.updateDetailPage}>
      <CommunityUpdateViewTracker updateId={update.id} />

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

          <div className={styles.updateMetrics} aria-label="动态互动数据">
            <form action={toggleCommunityUpdateLike}>
              <input type="hidden" name="update_id" value={update.id} />
              <button
                type="submit"
                className={
                  viewerHasLiked
                    ? `${styles.updateMetricButton} ${styles.updateMetricButtonActive}`
                    : styles.updateMetricButton
                }
                aria-pressed={viewerHasLiked}
              >
                <Heart
                  aria-hidden="true"
                  fill={viewerHasLiked ? "currentColor" : "none"}
                  strokeWidth={1.8}
                />
                {update.likeCount} 赞
              </button>
            </form>
            <span>
              <Eye aria-hidden="true" strokeWidth={1.8} />
              {update.viewCount} 浏览
            </span>
          </div>
        </header>

        <RevealHtmlImages
          className={styles.updateWechatArticle}
          html={articleHtml}
        />

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
