import Link from "next/link";

import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import type { PublicMember } from "@/lib/community-members";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import styles from "./member-directory-card.module.css";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes
    .flatMap((className) =>
      typeof className === "string" ? className.split(/\s+/) : [],
    )
    .filter(Boolean)
    .map((className) => styles[className as keyof typeof styles] ?? className)
    .join(" ");
}

type MemberDirectoryCardProps = {
  member: PublicMember;
  headline: string | null;
  bioFallback: string;
};

function formatMemberBioPreview(bio: string | null, fallback: string) {
  if (!bio?.trim()) {
    return fallback;
  }

  return bio.replace(/\s+/g, " ").trim();
}

function getVisibleSkills(skills: string[]) {
  return skills
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function MemberDirectoryCard({
  member,
  headline,
  bioFallback,
}: MemberDirectoryCardProps) {
  const visibleSkills = getVisibleSkills(member.skills);
  const href = getMemberPublicSlugPath(member);

  return (
    <Link
      href={href}
      className={cx("member-directory-card member-directory-card-link")}
      aria-label={`查看 ${member.displayName} 的成员主页`}
    >
      <div className={cx("member-directory-header")}>
        <MemberAvatar name={member.displayName} avatarUrl={member.avatarUrl} />

        <div className={cx("member-directory-copy")}>
          <h3 className={cx("member-directory-name")} title={member.displayName}>
            {member.displayName}
          </h3>
          {headline ? (
            <p className={cx("member-directory-headline")} title={headline}>
              {headline}
            </p>
          ) : null}
        </div>
      </div>

      <p className={cx("member-directory-bio")}>
        {formatMemberBioPreview(member.bio, bioFallback)}
      </p>

      {visibleSkills.length > 0 ? (
        <div className={cx("member-skill-list member-skill-list-capped")}>
          {visibleSkills.map((skill) => (
            <ToneBadge
              key={`${member.id}-${skill}`}
              label={skill}
              className={styles["member-skill-badge"]}
            />
          ))}
        </div>
      ) : (
        <p className={cx("member-directory-tags-empty")}>技能标签待补充</p>
      )}
    </Link>
  );
}
