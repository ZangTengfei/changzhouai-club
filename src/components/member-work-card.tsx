import Link from "next/link";
import { ArrowUpRight, GitBranch, MonitorUp, PlayCircle } from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import type { PublicMemberWork } from "@/lib/community-works";
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
      <div className={styles.workCover} aria-hidden="true">
        {work.coverImageUrl ? (
          <img src={work.coverImageUrl} alt="" loading="lazy" />
        ) : (
          <span>{getWorkInitial(work.title)}</span>
        )}
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
          <Link href={work.member.href} className={styles.workMaker}>
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
