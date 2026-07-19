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

import styles from "./member-work-card.module.css";

type MemberWorkCardProps = {
  work: PublicMemberWork;
  compact?: boolean;
};

function getWorkInitial(title: string) {
  return title.trim().slice(0, 1).toUpperCase() || "W";
}

export function MemberWorkCard({ work, compact = false }: MemberWorkCardProps) {
  const primaryUrl = work.websiteUrl ?? work.demoUrl ?? work.repoUrl;

  return (
    <article className={cn(styles.workCard, compact ? styles.workCardCompact : null)}>
      <div className={styles.workCover}>
        {work.coverImageUrl ? (
          <RevealImage src={work.coverImageUrl} alt="" />
        ) : (
          <span>{getWorkInitial(work.title)}</span>
        )}
        {work.qrCodeImageUrl ? (
          <WorkQrCodePreview imageUrl={work.qrCodeImageUrl} title={work.title} />
        ) : null}
      </div>

      <div className={styles.workBody}>
        <div className={styles.workMeta}>
          <span>{work.typeLabel}</span>
          <span>{work.statusLabel}</span>
          {work.isFeatured ? <span>精选</span> : null}
        </div>

        <div className={styles.workTitleRow}>
          <h3>{work.title}</h3>
          {primaryUrl ? (
            <a href={primaryUrl} target="_blank" rel="noreferrer" aria-label={`打开 ${work.title}`}>
              <ArrowUpRight aria-hidden="true" strokeWidth={2} />
            </a>
          ) : null}
        </div>

        <p>{work.summary}</p>

        {work.tags.length > 0 ? (
          <div className={styles.workTags}>
            {work.tags.slice(0, compact ? 4 : 6).map((tag) => (
              <span key={`${work.id}-${tag}`}>{tag}</span>
            ))}
          </div>
        ) : null}

        <div className={styles.workFooter}>
          <Link href={work.member.href} prefetch={false} className={styles.workMaker}>
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

          <div className={styles.workLinks}>
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
      className={cn(styles.workCard, styles.workCardLink)}
      target="_blank"
      rel="noreferrer"
    >
      <div className={styles.workCover} aria-hidden="true">
        {card.coverImageUrl ? (
          <RevealImage src={card.coverImageUrl} alt="" />
        ) : (
          <span>{getWorkInitial(card.title)}</span>
        )}
      </div>

      <div className={styles.workBody}>
        <div className={styles.workMeta}>
          <span>{card.typeLabel}</span>
          <span>{card.sourceLabel ?? "外部案例"}</span>
          {card.isFeatured ? <span>精选</span> : null}
        </div>

        <div className={styles.workTitleRow}>
          <h3>{card.title}</h3>
          <span className={styles.workTitleIcon}>
            <ExternalLink aria-hidden="true" strokeWidth={2} />
          </span>
        </div>

        <p>{card.summary}</p>

        {card.tags.length > 0 ? (
          <div className={styles.workTags}>
            {card.tags.slice(0, 6).map((tag) => (
              <span key={`${card.id}-${tag}`}>{tag}</span>
            ))}
          </div>
        ) : null}

        <div className={styles.workExternalFooter}>
          <strong>{card.ctaLabel}</strong>
          <small>{card.externalUrl.replace(/^https?:\/\//, "")}</small>
        </div>
      </div>
    </a>
  );
}
