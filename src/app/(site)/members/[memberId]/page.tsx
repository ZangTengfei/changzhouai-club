import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberAvatar } from "@/components/member-avatar";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicMemberById } from "@/lib/community-members";

function formatMemberHeadline(member: {
  roleLabel: string | null;
  organization: string | null;
  city: string;
}) {
  const items = [member.roleLabel, member.organization, member.city].filter(Boolean);
  return items.join(" · ");
}

function formatJoinDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", { dateStyle: "long" }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildParticipationSignals(member: {
  willingToShare: boolean;
  willingToJoinProjects: boolean;
}) {
  const items = ["已公开展示"];

  if (member.willingToShare) {
    items.push("愿意分享");
  }

  if (member.willingToJoinProjects) {
    items.push("愿意参与共建");
  }

  return items;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ memberId: string }>;
}): Promise<Metadata> {
  const { memberId } = await params;
  const member = await getPublicMemberById(memberId);

  if (!member) {
    return {
      title: "成员主页",
      description: "查看常州 AI Club 成员的公开资料。",
    };
  }

  return {
    title: `${member.displayName} · 成员主页`,
    description:
      member.bio?.trim() ||
      formatMemberHeadline(member) ||
      "查看常州 AI Club 成员的公开资料。",
  };
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const member = await getPublicMemberById(memberId);

  if (!member) {
    notFound();
  }

  const headline = formatMemberHeadline(member);
  const signals = buildParticipationSignals(member);

  return (
    <div className="page-stack">
      <section className="surface member-profile-hero">
        <div className="member-profile-identity">
          <MemberAvatar
            name={member.displayName}
            avatarUrl={member.avatarUrl}
          />

          <div className="member-profile-copy">
            <div>
              <p className="eyebrow">Member</p>
              <h1>{member.displayName}</h1>
            </div>

            {headline ? <p>{headline}</p> : null}

            <div className="pill-row">
              {signals.map((item) => (
                <span key={item} className="pill">
                  {item}
                </span>
              ))}
            </div>

            <p className="member-profile-summary">
              {member.bio?.trim() ||
                "这位成员已经加入社区，目前公开展示的是基础资料与参与方向。"}
            </p>
          </div>
        </div>

        <div className="cta-row">
          <Link href="/members" className="button button-secondary">
            返回成员地图
          </Link>
          <Link href="/cooperate" className="button">
            发起合作意向
          </Link>
        </div>
      </section>

      <section className="member-detail-grid">
        <article className="field-panel">
          <h3>公开资料</h3>
          <ul className="detail-list">
            <li>城市：{member.city}</li>
            <li>角色：{member.roleLabel ?? "未填写"}</li>
            <li>组织 / 公司 / 学校：{member.organization ?? "未填写"}</li>
            <li>加入社区时间：{formatJoinDate(member.joinedAt)}</li>
          </ul>
        </article>

        <article className="field-panel">
          <h3>参与信号</h3>
          <ul className="detail-list">
            <li>公开展示：是</li>
            <li>愿意分享：{member.willingToShare ? "是" : "否"}</li>
            <li>愿意参与共建：{member.willingToJoinProjects ? "是" : "否"}</li>
          </ul>
        </article>
      </section>

      <section className="surface account-shell">
        <div className="section-heading">
          <p className="eyebrow">Skills</p>
          <h2>技能与方向</h2>
          <p>这里展示成员主动公开的技能标签，便于活动邀约和协作匹配。</p>
        </div>

        {member.skills.length > 0 ? (
          <div className="tag-cloud">
            {member.skills.map((skill) => (
              <ToneBadge key={`${member.id}-${skill}`} label={skill} />
            ))}
          </div>
        ) : (
          <div className="note-strip">这位成员暂未补充技能标签。</div>
        )}
      </section>
    </div>
  );
}
