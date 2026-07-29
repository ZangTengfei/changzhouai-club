import Link from "next/link";

import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import { isCorePublicMember, type PublicMember } from "@/lib/community-members";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";

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
      className="relative grid h-full min-h-59 grid-rows-[auto_auto_auto_1fr] gap-4 overflow-hidden rounded-md border-0 bg-white px-4.5 pt-4.5 pb-4 text-inherit no-underline shadow-site-card transition-[transform,box-shadow,border-color] duration-[180ms] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] hover:-translate-y-0.5 hover:border-[rgba(178,200,191,0.9)] hover:shadow-[0_14px_28px_rgba(var(--ink-rgb),0.05),inset_0_1px_0_rgba(255,255,255,0.94)] focus-visible:-translate-y-0.5 focus-visible:border-[rgba(178,200,191,0.9)] focus-visible:shadow-[0_14px_28px_rgba(var(--ink-rgb),0.05),inset_0_1px_0_rgba(255,255,255,0.94)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(var(--accent-rgb),0.18)] max-sm:p-4.5"
      aria-label={`查看 ${member.displayName} 的成员主页`}
    >
      <div className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-3.5 [&>span]:size-14 [&>span]:rounded-full [&>span]:border-0 [&>span]:bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.2),rgba(var(--accent-warm-rgb),0.16))] [&>span]:shadow-[var(--shadow-md)]">
        <MemberAvatar name={member.displayName} avatarUrl={member.avatarUrl} />

        <div className="min-w-0">
          <h3
            className="block min-h-[1.08em] w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-nowrap text-[0.98rem] font-extrabold text-[#152022] [overflow-wrap:normal]! [word-break:normal]!"
            title={member.displayName}
          >
            {member.displayName}
          </h3>
          {headline ? (
            <p className="mt-1 line-clamp-2 text-[0.83rem] leading-[1.45] text-copy-subtle" title={headline}>
              {headline}
            </p>
          ) : null}
        </div>
      </div>

      <p className="m-0 line-clamp-3 min-h-[calc(1.7em*3)] flex-1 text-[0.92rem] leading-[1.68] text-[rgba(var(--ink-rgb),0.68)]">
        {formatMemberBioPreview(member.bio, bioFallback)}
      </p>

      {signals.length > 0 ? (
        <div className="flex min-h-6.75 flex-wrap gap-1.75 overflow-hidden">
          {signals.map((signal) => (
            <span
              className="grid min-h-6.75 max-w-full flex-[0_0_auto] place-items-center whitespace-nowrap rounded-full bg-[rgba(255,252,247,0.82)] px-2.25 text-[0.76rem] leading-none font-[850] text-copy-subtle"
              key={`${member.id}-${signal}`}
            >
              {signal}
            </span>
          ))}
        </div>
      ) : null}

      {visibleSkills.length > 0 ? (
        <div className="member-skill-list min-h-auto flex-nowrap content-start gap-2 overflow-hidden self-end">
          {visibleSkills.map((skill) => (
            <ToneBadge
              key={`${member.id}-${skill}`}
              label={skill}
              className="min-h-auto max-w-full flex-[0_0_auto] overflow-hidden text-ellipsis whitespace-nowrap border-0 bg-[rgba(241,248,243,0.72)] px-2.5 py-1.5 text-[0.84rem] leading-none font-extrabold text-[#20a06d]"
            />
          ))}
        </div>
      ) : (
        <p className="m-0 flex min-h-auto items-center self-end text-[0.84rem] font-extrabold text-[rgba(var(--ink-rgb),0.48)]">
          技能标签待补充
        </p>
      )}
    </Link>
  );
}
