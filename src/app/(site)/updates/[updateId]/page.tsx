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
import { cn } from "@/lib/utils";

import { CommunityUpdateViewTracker } from "./community-update-view-tracker";

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
    <div className="mx-auto grid max-w-235 gap-4.5">
      <CommunityUpdateViewTracker updateId={update.id} />

      <Link href="/updates" className="inline-flex w-fit items-center gap-2 font-black text-primary-strong [&_svg]:size-4.5">
        <ArrowLeft aria-hidden="true" strokeWidth={2} />
        返回社区动态
      </Link>

      <article className="grid gap-5.5 rounded-lg bg-white p-6 shadow-site-card max-md:p-5">
        <header className="grid gap-4">
          <div className="flex items-start justify-between gap-3.5 max-md:grid">
            <Link href={update.author.href} className="grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3">
              <MemberAvatar
                name={update.author.displayName}
                avatarUrl={update.author.avatarUrl}
                size="sm"
              />
              <span className="grid min-w-0 gap-0.75">
                <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[0.96rem] font-black text-heading">{update.author.displayName}</strong>
                <small className="block text-[0.82rem] font-bold leading-[1.35] text-[rgba(var(--ink-rgb),0.54)]">
                  {update.author.roleLabel ?? update.author.organization ?? update.author.city}
                </small>
              </span>
            </Link>

            <time className="block flex-none pt-1.25 text-[0.82rem] font-bold leading-[1.35] text-[rgba(var(--ink-rgb),0.54)] max-md:pt-0" dateTime={update.publishedAt ?? update.createdAt}>
              {formatDateTime(update.publishedAt ?? update.createdAt)}
            </time>
          </div>

          <div className="flex flex-wrap items-center gap-2 [&>i]:inline-flex [&>i]:min-h-7 [&>i]:items-center [&>i]:rounded-full [&>i]:bg-[rgba(246,190,75,0.17)] [&>i]:px-2.5 [&>i]:text-[0.78rem] [&>i]:font-black [&>i]:not-italic [&>i]:text-[#a76b12] [&>span]:inline-flex [&>span]:min-h-7 [&>span]:items-center [&>span]:rounded-full [&>span]:bg-primary-soft [&>span]:px-2.5 [&>span]:text-[0.78rem] [&>span]:font-black [&>span]:text-primary-strong">
            <span>{update.typeLabel}</span>
            {update.isFeatured ? <i>精华</i> : null}
            {update.isPinned ? <i>置顶</i> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3.5 pt-1 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-1.25 [&>span]:text-[0.86rem] [&>span]:font-[850] [&>span]:text-copy-muted [&_form]:m-0 [&_svg]:size-4" aria-label="动态互动数据">
            <form action={toggleCommunityUpdateLike}>
              <input type="hidden" name="update_id" value={update.id} />
              <button
                type="submit"
                className={cn(
                  "inline-flex min-h-7.5 cursor-pointer items-center gap-1.25 border-0 bg-transparent p-0 text-[0.86rem] font-[850] text-copy-muted hover:text-primary-strong focus-visible:text-primary-strong",
                  viewerHasLiked && "text-primary-strong",
                )}
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
          className="max-w-[677px] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(225,219,206,0.88)] bg-transparent [&>section]:shadow-[0_1px_0_rgba(255,255,255,0.5)] [&_img]:invisible [&_img]:opacity-0 [&_img[data-loaded='true']]:visible [&_img[data-loaded='true']]:opacity-100 [&_img[data-loaded='true']]:transition-opacity [&_img[data-loaded='true']]:duration-150"
          html={articleHtml}
        />

        {update.tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 [&>span]:inline-flex [&>span]:min-h-7 [&>span]:items-center [&>span]:rounded-full [&>span]:border [&>span]:border-primary-border [&>span]:bg-primary-soft [&>span]:px-2.5 [&>span]:text-[0.78rem] [&>span]:font-[850] [&>span]:text-copy-muted">
            {update.tags.map((tag) => (
              <span key={`${update.id}-${tag}`}>{tag}</span>
            ))}
          </div>
        ) : null}

        {update.relatedUrl ? (
          <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-3 rounded-md border border-dashed border-primary-border bg-primary-soft p-4 [&_a]:mt-1 [&_a]:block [&_a]:[overflow-wrap:anywhere] [&_a]:text-[0.88rem] [&_a]:font-extrabold [&_a]:text-primary-strong [&_strong]:block [&_strong]:text-[0.92rem] [&_strong]:text-heading">
            <Sparkles className="size-7.5 text-primary" aria-hidden="true" strokeWidth={1.8} />
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
