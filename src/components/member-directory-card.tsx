import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import type { PublicMember } from "@/lib/community-members";

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

  return (
    <article className="member-directory-card">
      <div className="member-directory-header">
        <MemberAvatar name={member.displayName} avatarUrl={member.avatarUrl} />

        <div className="member-directory-copy">
          <h3 className="member-directory-name" title={member.displayName}>
            {member.displayName}
          </h3>
          {headline ? (
            <p className="member-directory-headline" title={headline}>
              {headline}
            </p>
          ) : null}
        </div>
      </div>

      <p className="member-directory-bio">
        {formatMemberBioPreview(member.bio, bioFallback)}
      </p>

      {visibleSkills.length > 0 ? (
        <div className="member-skill-list member-skill-list-capped">
          {visibleSkills.map((skill) => (
            <ToneBadge key={`${member.id}-${skill}`} label={skill} />
          ))}
        </div>
      ) : (
        <p className="member-directory-tags-empty">技能标签待补充</p>
      )}
    </article>
  );
}
