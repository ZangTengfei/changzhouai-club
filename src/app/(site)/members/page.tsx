import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

import { MemberDirectoryCard } from "@/components/member-directory-card";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicMembersDirectory } from "@/lib/community-members";
import { memberTags } from "@/lib/site-data";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "成员地图",
  description: "展示常州 AI Club 的成员技能分布和参与方向。",
  path: "/members",
});

type SearchParams = {
  page?: string | string[];
};

type MembersPageProps = {
  searchParams: Promise<SearchParams>;
};

const MEMBERS_PER_PAGE = 12;
const sectionHeadingClassName =
  "grid gap-1.5 [&_h2]:m-0 [&_h2]:text-[1.82rem] [&_h2]:leading-[1.12] [&_h2]:font-black [&_h2]:tracking-normal [&_h2]:text-[#111a1d] [&_div>p]:mt-[5px] [&_div>p]:mb-0 [&_div>p]:max-w-3xl [&_div>p]:text-[0.96rem] [&_div>p]:leading-[1.58] [&_div>p]:font-[650] [&_div>p]:text-[rgba(var(--ink-rgb),0.64)] max-sm:[&_h2]:text-2xl";
const paginationItemClassName =
  "inline-grid min-h-10 min-w-[42px] place-items-center rounded-[var(--radius-sm)] border border-[rgba(208,214,207,0.82)] bg-[rgba(255,252,247,0.74)] px-[13px] text-[0.9rem] leading-none font-[850] text-[rgba(var(--ink-rgb),0.68)]";
const paginationLinkClassName = `${paginationItemClassName} transition-[transform,border-color,background] duration-200 hover:-translate-y-px hover:border-[rgba(var(--accent-rgb),0.24)] hover:bg-[rgba(var(--accent-rgb),0.08)] hover:text-[var(--accent-strong)] focus-visible:-translate-y-px focus-visible:border-[rgba(var(--accent-rgb),0.24)] focus-visible:bg-[rgba(var(--accent-rgb),0.08)] focus-visible:text-[var(--accent-strong)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[rgba(var(--accent-rgb),0.18)]`;

function parsePageParam(value: SearchParams["page"]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue ?? "1", 10);

  if (Number.isNaN(page) || page < 1) {
    return 1;
  }

  return page;
}

function getMemberPageHref(page: number) {
  if (page <= 1) {
    return "/members#member-directory";
  }

  return `/members?page=${page}#member-directory`;
}

function formatMemberHeadline(member: {
  roleLabel: string | null;
  organization: string | null;
  city: string;
}) {
  const items = [member.roleLabel, member.organization, member.city].filter(Boolean);

  return items.join(" · ");
}

const memberFlowSteps = [
  {
    title: "看方向",
    summary: "从角色、组织、城市和技能标签，先判断对方的实践领域。",
  },
  {
    title: "看信号",
    summary: "核心成员、共建成员、愿意分享等标签，可以帮助你找到合适入口。",
  },
  {
    title: "继续连接",
    summary: "点开成员主页了解更多，也可以通过活动或合作联系发起具体沟通。",
  },
] as const;

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const [directory, params] = await Promise.all([
    getPublicMembersDirectory(),
    searchParams,
  ]);
  const skillTags =
    directory.skillTags.length > 0 ? directory.skillTags : memberTags;
  const totalPages = Math.max(1, Math.ceil(directory.members.length / MEMBERS_PER_PAGE));
  const currentPage = Math.min(parsePageParam(params.page), totalPages);
  const memberStartIndex = (currentPage - 1) * MEMBERS_PER_PAGE;
  const paginatedMembers = directory.members.slice(
    memberStartIndex,
    memberStartIndex + MEMBERS_PER_PAGE,
  );
  const memberEndIndex = memberStartIndex + paginatedMembers.length;
  const memberHighlights = [
    {
      value: directory.stats.publicMembers,
      label: "公开成员",
    },
    {
      value: directory.stats.coBuilders,
      label: "共建成员",
    },
    {
      value: directory.stats.willingToShare,
      label: "愿意分享",
    },
  ];

  return (
    <div className="grid gap-[22px] max-sm:gap-[18px]">
      <section className="grid grid-cols-[minmax(0,1fr)_minmax(260px,360px)] items-end gap-6 pt-[18px] max-lg:grid-cols-1 max-sm:gap-[18px] max-sm:pt-0" aria-labelledby="members-hero-title">
        <div className="grid min-w-0 max-w-[820px] content-start gap-4">
          <p className="home-kicker">Members · 成员地图</p>
          <h1 className="m-0 max-w-[800px] text-[clamp(2.35rem,4vw,3.2rem)] leading-[1.08] font-black tracking-normal text-[#111b1f] max-sm:text-[2.42rem]" id="members-hero-title">找到常州 AI Club 里正在做 AI 的人</h1>
          <p className="m-0 max-w-3xl text-[1.04rem] leading-[1.76] text-[rgba(var(--ink-rgb),0.72)]">
            这里展示成员授权公开的介绍、技能和参与信号。先从卡片认识人，
            再通过线下活动、成员主页或合作联系继续对接。
          </p>

          <div className="flex flex-wrap items-center gap-2.5 [&_svg]:size-[18px]">
            <Link href="#member-directory" prefetch={false} className="button home-primary-button">
              浏览成员
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/join" prefetch={false} className="button home-ghost-button">
              申请加入
            </Link>
            <a
              href="http://ecs.abbs.fun:15173/"
              className="button home-ghost-button"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink aria-hidden="true" strokeWidth={2} />
              查看成员星图
            </a>
          </div>
        </div>

        <div className="grid max-w-[520px] grid-cols-3 overflow-hidden rounded-[var(--radius-md)] bg-[#e9f9f0] max-sm:max-w-none" aria-label="成员概览">
          {memberHighlights.map((item) => (
            <div className="grid min-w-0 gap-[5px] border-r border-[rgba(var(--ink-rgb),0.07)] px-4 py-[18px] last:border-r-0 max-sm:px-2.5 max-sm:py-3.5" key={item.label}>
              <strong className="overflow-hidden font-[var(--font-latin-rounded)] text-[1.62rem] leading-none font-[850] tracking-normal text-ellipsis whitespace-nowrap text-[var(--accent-strong)] max-sm:text-[1.36rem]">{item.value}</strong>
              <span className="overflow-hidden text-[0.86rem] font-[850] text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.62)] max-sm:text-[0.78rem]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {directory.members.length > 0 ? (
        <section className="grid scroll-mt-24 gap-4" id="member-directory">
          <div className={sectionHeadingClassName}>
            <p className="home-kicker">Directory</p>
            <div>
              <h2>公开成员</h2>
              <p>
                每张卡片都来自成员授权公开的信息，用来快速了解方向、技能和参与意愿。
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-[0.9rem] font-[750] text-[rgba(var(--ink-rgb),0.58)]">
            <span className="text-[var(--accent-strong)]">
              第 {currentPage} / {totalPages} 页
            </span>
            <span>
              正在显示 {memberStartIndex + 1}-{memberEndIndex} 位，共 {directory.members.length} 位公开成员
            </span>
          </div>

          <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {paginatedMembers.map((member) => (
              <MemberDirectoryCard
                key={member.id}
                member={member}
                headline={formatMemberHeadline(member)}
                bioFallback="这位成员已经加入社区，正在等待补充更完整的个人介绍。"
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav className="flex flex-wrap items-center justify-center gap-2.5 pt-1" aria-label="公开成员分页">
              {currentPage > 1 ? (
                <Link className={paginationLinkClassName} href={getMemberPageHref(currentPage - 1)} prefetch={false}>上一页</Link>
              ) : (
                <span className={`${paginationItemClassName} opacity-45`} aria-disabled="true">上一页</span>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;

                  return page === currentPage ? (
                    <span className={`${paginationItemClassName} border-[rgba(var(--accent-rgb),0.28)] bg-primary text-white`} aria-current="page" key={page}>
                      {page}
                    </span>
                  ) : (
                    <Link className={paginationLinkClassName} href={getMemberPageHref(page)} prefetch={false} key={page}>
                      {page}
                    </Link>
                  );
                })}
              </div>

              {currentPage < totalPages ? (
                <Link className={paginationLinkClassName} href={getMemberPageHref(currentPage + 1)} prefetch={false}>下一页</Link>
              ) : (
                <span className={`${paginationItemClassName} opacity-45`} aria-disabled="true">下一页</span>
              )}
            </nav>
          ) : null}
        </section>
      ) : (
        <div className="grid justify-items-start gap-2 rounded-[var(--radius-md)] border border-[rgba(208,214,207,0.72)] bg-[linear-gradient(180deg,rgba(246,244,238,0.94),rgba(241,239,232,0.88))] p-6 shadow-[0_12px_28px_rgba(var(--ink-rgb),0.045),inset_0_1px_0_rgba(255,255,255,0.62)] max-sm:p-4">
          <strong className="m-0 text-[1.28rem] font-black text-[#111b1f]">暂无公开成员信息</strong>
          <p className="m-0 leading-[1.62] text-[rgba(var(--ink-rgb),0.64)]">成员授权公开后，会在这里展示方向、技能与参与信号。</p>
        </div>
      )}

      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[rgba(208,214,207,0.72)] bg-[linear-gradient(180deg,rgba(246,244,238,0.94),rgba(241,239,232,0.88))] p-5 shadow-[0_12px_28px_rgba(var(--ink-rgb),0.045),inset_0_1px_0_rgba(255,255,255,0.62)] max-sm:p-4" aria-label="成员地图说明">
        <div className={sectionHeadingClassName}>
          <p className="home-kicker">Guide</p>
          <div>
            <h2>成员地图说明</h2>
            <p>成员地图用于帮助你判断“可以和谁聊”，真正的连接仍然发生在具体交流里。</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 max-[820px]:grid-cols-1">
          {memberFlowSteps.map((item, index) => (
            <article className="grid min-w-0 content-start gap-2 rounded-[var(--radius-sm)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.68)] p-4" key={item.title}>
              <span className="font-[var(--font-latin-rounded)] text-[1.2rem] leading-none font-black text-primary">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="m-0 text-[1.02rem] leading-[1.22] font-black text-[#111b1f]">{item.title}</h3>
              <p className="m-0 text-[0.92rem] leading-[1.62] text-[rgba(var(--ink-rgb),0.64)]">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[rgba(208,214,207,0.72)] bg-[linear-gradient(180deg,rgba(246,244,238,0.94),rgba(241,239,232,0.88))] p-5 shadow-[0_12px_28px_rgba(var(--ink-rgb),0.045),inset_0_1px_0_rgba(255,255,255,0.62)] max-sm:p-4">
        <div className={sectionHeadingClassName}>
          <p className="home-kicker">Skills</p>
          <div>
            <h2>技能标签</h2>
            <p>
              这些标签来自公开成员信息和社区常见方向，可辅助理解成员能力分布。
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {skillTags.map((tag) => (
            <ToneBadge key={tag} label={tag} />
          ))}
        </div>
      </section>
    </div>
  );
}
