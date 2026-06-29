import Link from "next/link";

import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import { isCorePublicMember, type PublicMember } from "@/lib/community-members";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import { cssModuleCx } from "@/lib/utils";
import styles from "./member-directory-card.module.css";

const cx = cssModuleCx.bind(null, styles);

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

function getMemberSignalLabels(member: PublicMember) {
  const signals: string[] = [];

  if (isCorePublicMember(member)) {
    signals.push("核心成员");
  } else if (member.isCoBuilder) {
    signals.push("共建成员");
  }

  if (member.willingToShare) {
    signals.push("愿意分享");
  }

  if (member.willingToJoinProjects && !member.isCoBuilder) {
    signals.push("愿意共建");
  }

  return signals.slice(0, 3);
}

export function MemberDirectoryCard({
  member,
  headline,
  bioFallback,
}: MemberDirectoryCardProps) {
  const visibleSkills = getVisibleSkills(member.skills);
  const signals = getMemberSignalLabels(member);
  const href = getMemberPublicSlugPath(member);

  return (
    <Link
      href={href}
      prefetch={false}
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

      {signals.length > 0 ? (
        <div className={cx("member-directory-signal-list")}>
          {signals.map((signal) => (
            <span key={`${member.id}-${signal}`}>{signal}</span>
          ))}
        </div>
      ) : null}

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
