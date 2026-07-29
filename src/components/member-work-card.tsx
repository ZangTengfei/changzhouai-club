import Link from "next/link";
import {
  ArrowUpRight,
  ExternalLink,
  GitBranch,
  MonitorUp,
  PlayCircle,
} from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { RevealImage } from "@/components/reveal-image";
import { WorkQrCodePreview } from "@/components/work-qr-code-preview";
import type {
  PublicExternalCaseCard,
  PublicMemberWork,
} from "@/lib/community-works";
import { cn } from "@/lib/utils";

type MemberWorkCardProps = {
  work: PublicMemberWork;
  compact?: boolean;
};

function getWorkInitial(title: string) {
  return title.trim().slice(0, 1).toUpperCase() || "W";
}

const workCardClassName =
  "grid min-w-0 overflow-hidden rounded-md border-0 bg-white shadow-site-card";

const workCoverClassName =
  "relative grid aspect-video place-items-center overflow-hidden bg-[radial-gradient(circle_at_16%_18%,rgba(255,199,81,0.28),transparent_26%),linear-gradient(135deg,rgba(16,147,111,0.16),rgba(42,123,211,0.13))] [&>img]:size-full [&>img]:object-cover [&>span]:grid [&>span]:size-18.5 [&>span]:place-items-center [&>span]:rounded-md [&>span]:border [&>span]:border-white/72 [&>span]:bg-[rgba(255,252,247,0.82)] [&>span]:font-[var(--font-latin-rounded)] [&>span]:text-[2.1rem] [&>span]:font-black [&>span]:text-primary-strong";

const workMetaClassName =
  "flex flex-wrap items-center gap-1.75 [&>span]:inline-flex [&>span]:min-h-6.5 [&>span]:items-center [&>span]:rounded-full [&>span]:border [&>span]:border-primary-border [&>span]:bg-[rgba(255,252,247,0.86)] [&>span]:px-2.25 [&>span]:text-[0.76rem] [&>span]:font-[850] [&>span]:text-primary-strong [&>span:nth-child(2)]:border-[rgba(42,123,211,0.18)] [&>span:nth-child(2)]:text-[#2a6fb8]";

const workTitleRowClassName =
  "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5 [&_h3]:m-0 [&_h3]:text-[1.2rem] [&_h3]:leading-[1.18] [&_h3]:font-black [&_h3]:tracking-normal [&_h3]:text-heading [&_svg]:size-4.25";

const workTagsClassName =
  "flex flex-wrap items-center gap-1.75 [&>span]:inline-flex [&>span]:min-h-6 [&>span]:items-center [&>span]:rounded-full [&>span]:border [&>span]:border-primary-border [&>span]:bg-[rgba(255,252,247,0.86)] [&>span]:px-2.25 [&>span]:text-[0.74rem] [&>span]:font-[850] [&>span]:text-copy-subtle";

export function MemberWorkCard({ work, compact = false }: MemberWorkCardProps) {
  const primaryUrl = work.websiteUrl ?? work.demoUrl ?? work.repoUrl;

  return (
    <article className={cn(workCardClassName, compact && "h-full")}>
      <div className={workCoverClassName}>
        {work.coverImageUrl ? (
          <RevealImage src={work.coverImageUrl} alt="" />
        ) : (
          <span>{getWorkInitial(work.title)}</span>
        )}
        {work.qrCodeImageUrl ? (
          <WorkQrCodePreview imageUrl={work.qrCodeImageUrl} title={work.title} />
        ) : null}
      </div>

      <div className="grid gap-3 p-4 max-sm:p-3.5">
        <div className={workMetaClassName}>
          <span>{work.typeLabel}</span>
          <span>{work.statusLabel}</span>
          {work.isFeatured ? <span>精选</span> : null}
        </div>

        <div className={workTitleRowClassName}>
          <h3>{work.title}</h3>
          {primaryUrl ? (
            <a className="inline-flex size-7.5 items-center justify-center rounded-full border border-primary-border bg-[rgba(255,252,247,0.82)] text-primary transition-[color,transform] duration-160 hover:-translate-y-px hover:text-primary-strong focus-visible:-translate-y-px focus-visible:text-primary-strong" href={primaryUrl} target="_blank" rel="noreferrer" aria-label={`打开 ${work.title}`}>
              <ArrowUpRight aria-hidden="true" strokeWidth={2} />
            </a>
          ) : null}
        </div>

        <p className="m-0 text-[0.94rem] leading-[1.62] font-[650] text-copy-muted">{work.summary}</p>

        {work.tags.length > 0 ? (
          <div className={workTagsClassName}>
            {work.tags.slice(0, compact ? 4 : 6).map((tag) => (
              <span key={`${work.id}-${tag}`}>{tag}</span>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 pt-0.5 max-sm:flex-col max-sm:items-start">
          <Link href={work.member.href} prefetch={false} className="flex min-w-0 items-center gap-2.25 text-inherit no-underline [&>span]:grid [&>span]:min-w-0 [&>span]:gap-0.5 [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[0.76rem] [&_small]:font-[750] [&_small]:text-[rgba(var(--ink-rgb),0.55)] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[0.88rem] [&_strong]:font-black [&_strong]:text-[#152524]">
            <MemberAvatar
              name={work.member.displayName}
              avatarUrl={work.member.avatarUrl}
              size="sm"
            />
            <span>
              <strong>{work.member.displayName}</strong>
              <small>{work.roleLabel ?? work.member.roleLabel ?? work.member.city}</small>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 [&_a]:inline-flex [&_a]:size-7 [&_a]:items-center [&_a]:justify-center [&_a]:text-primary [&_a]:transition-[color,transform] [&_a]:duration-160 [&_a:hover]:-translate-y-px [&_a:hover]:text-primary-strong [&_a:focus-visible]:-translate-y-px [&_a:focus-visible]:text-primary-strong [&_svg]:size-4.25">
            {work.websiteUrl ? (
              <a href={work.websiteUrl} target="_blank" rel="noreferrer" aria-label="访问官网">
                <MonitorUp aria-hidden="true" strokeWidth={2} />
              </a>
            ) : null}
            {work.demoUrl ? (
              <a href={work.demoUrl} target="_blank" rel="noreferrer" aria-label="查看 Demo">
                <PlayCircle aria-hidden="true" strokeWidth={2} />
              </a>
            ) : null}
            {work.repoUrl ? (
              <a href={work.repoUrl} target="_blank" rel="noreferrer" aria-label="查看代码仓库">
                <GitBranch aria-hidden="true" strokeWidth={2} />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ExternalCaseCard({ card }: { card: PublicExternalCaseCard }) {
  return (
    <a
      href={card.externalUrl}
      className={cn(
        workCardClassName,
        "text-inherit no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(var(--accent-rgb),0.32)]",
      )}
      target="_blank"
      rel="noreferrer"
    >
      <div className={workCoverClassName} aria-hidden="true">
        {card.coverImageUrl ? (
          <RevealImage src={card.coverImageUrl} alt="" />
        ) : (
          <span>{getWorkInitial(card.title)}</span>
        )}
      </div>

      <div className="grid gap-3 p-4 max-sm:p-3.5">
        <div className={workMetaClassName}>
          <span>{card.typeLabel}</span>
          <span>{card.sourceLabel ?? "外部案例"}</span>
          {card.isFeatured ? <span>精选</span> : null}
        </div>

        <div className={workTitleRowClassName}>
          <h3>{card.title}</h3>
          <span className="inline-flex size-7.5 items-center justify-center text-primary">
            <ExternalLink aria-hidden="true" strokeWidth={2} />
          </span>
        </div>

        <p className="m-0 text-[0.94rem] leading-[1.62] font-[650] text-copy-muted">{card.summary}</p>

        {card.tags.length > 0 ? (
          <div className={workTagsClassName}>
            {card.tags.slice(0, 6).map((tag) => (
              <span key={`${card.id}-${tag}`}>{tag}</span>
            ))}
          </div>
        ) : null}

        <div className="grid gap-0.75 pt-0.5">
          <strong className="text-[0.88rem] font-black text-primary-strong">{card.ctaLabel}</strong>
          <small className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.76rem] font-[750] text-[rgba(var(--ink-rgb),0.55)]">
            {card.externalUrl.replace(/^https?:\/\//, "")}
          </small>
        </div>
      </div>
    </a>
  );
}
