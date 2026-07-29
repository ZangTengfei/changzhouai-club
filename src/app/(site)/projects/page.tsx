import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Timer,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { RevealImage } from "@/components/reveal-image";
import { Button } from "@/components/ui/button";
import { getVisibleProjectOpportunities } from "@/lib/community-projects";

export const metadata: Metadata = {
  title: "项目协作",
  description: "查看常州 AI Club 面向真实政企与企业需求的项目招募、协作状态与参与方式。",
};

const projectNotes = [
  {
    title: "问题线索",
    summary: "项目通常来自企业、机构、园区或成员实践，优先看场景是否真实、具体、可沟通。",
  },
  {
    title: "原型验证",
    summary: "适合推进的机会，会先明确 MVP 范围、目标用户和验证方式，再组织协作。",
  },
  {
    title: "试点沉淀",
    summary: "试点或阶段复盘后，社区会尽量沉淀问题、过程、结果和可公开案例。",
  },
] as const;

export default async function ProjectsPage() {
  const projectDirectory = await getVisibleProjectOpportunities();
  const openOpportunities = projectDirectory.opportunities;

  return (
    <div className="grid gap-7 py-6.5 pb-11 max-sm:gap-5.5 max-sm:pt-3.5">
      <section className="grid max-w-190 gap-3" aria-labelledby="projects-title">
        <p className="home-kicker">Projects · 项目协作</p>
        <h1
          className="m-0 text-[clamp(2.2rem,4vw,3.35rem)] font-black leading-[1.08] text-heading max-sm:text-[clamp(2rem,11vw,2.75rem)]"
          id="projects-title"
        >
          从真实问题到 AI 试点
        </h1>
        <p className="m-0 text-[1.02rem] font-semibold leading-[1.78] text-copy-muted">
          真实政企、企业和成员需求进入社区后，会先做场景澄清、范围定义和角色匹配；
          适合公开招募的机会会展示在这里。
        </p>
      </section>

      <section aria-label="项目列表">
        {openOpportunities.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-4.5">
            {openOpportunities.map((opportunity) => (
              <article
                className="relative grid min-h-80 content-start gap-4.5 overflow-hidden rounded-md bg-white p-5.5 shadow-site-card after:absolute after:-right-6 after:-bottom-7.5 after:size-29.5 after:rounded-full after:bg-primary-soft after:content-[''] max-sm:p-5"
                key={opportunity.id}
              >
                {opportunity.coverImageUrl ? (
                  <div className="relative z-1 -mx-1.5 mt-[-6px] aspect-video overflow-hidden rounded-sm border border-site-border-subtle bg-site-surface-soft">
                    <RevealImage
                      className="block size-full object-cover"
                      src={opportunity.coverImageUrl}
                      alt=""
                    />
                  </div>
                ) : null}

                <div className="relative z-1 grid gap-3">
                  <div className="flex flex-wrap gap-2 [&>span]:inline-flex [&>span]:min-h-7 [&>span]:items-center [&>span]:rounded-full [&>span]:border [&>span]:border-site-border-subtle [&>span]:bg-site-surface-soft [&>span]:px-2.5 [&>span]:text-[0.78rem] [&>span]:font-extrabold [&>span]:text-copy-subtle [&>span:first-child]:border-primary-border [&>span:first-child]:bg-primary-soft [&>span:first-child]:text-primary-strong">
                    <span>{opportunity.typeLabel}</span>
                    <span>{opportunity.statusLabel}</span>
                    {opportunity.visibility !== "public" ? (
                      <span>{opportunity.visibilityLabel}</span>
                    ) : null}
                    <span>
                      {opportunity.externalApplicationUrl
                        ? "外部表单"
                        : opportunity.applicationRequiresLogin
                          ? "登录后申请"
                          : "可直接申请"}
                    </span>
                  </div>
                  <h3 className="m-0 text-[1.34rem] leading-[1.22] text-heading">
                    {opportunity.title}
                  </h3>
                  <p className="m-0 text-[0.94rem] leading-[1.68] text-copy-subtle">
                    {opportunity.summary}
                  </p>
                </div>

                <div className="relative z-1 grid gap-2 [&_span]:grid [&_span]:grid-cols-[18px_minmax(0,1fr)] [&_span]:items-center [&_span]:gap-2 [&_span]:text-[0.88rem] [&_span]:font-bold [&_span]:leading-[1.42] [&_span]:text-copy-muted [&_svg]:size-4.25 [&_svg]:text-primary">
                  {opportunity.headcountLabel ? (
                    <span>
                      <UsersRound aria-hidden="true" strokeWidth={1.8} />
                      {opportunity.headcountLabel}
                    </span>
                  ) : null}
                  {opportunity.timeCommitment ? (
                    <span>
                      <Timer aria-hidden="true" strokeWidth={1.8} />
                      {opportunity.timeCommitment}
                    </span>
                  ) : null}
                  {opportunity.compensation ? (
                    <span>
                      <Sparkles aria-hidden="true" strokeWidth={1.8} />
                      {opportunity.compensation}
                    </span>
                  ) : null}
                  {opportunity.deadlineLabel ? (
                    <span>
                      <CalendarDays aria-hidden="true" strokeWidth={1.8} />
                      截止 {opportunity.deadlineLabel}
                    </span>
                  ) : null}
                </div>

                {[...opportunity.roleTags, ...opportunity.topicTags].length > 0 ? (
                  <div className="relative z-1 flex flex-wrap gap-2 [&>span]:inline-flex [&>span]:min-h-6.5 [&>span]:items-center [&>span]:rounded-full [&>span]:border [&>span]:border-site-border-subtle [&>span]:bg-site-surface-faint [&>span]:px-2.25 [&>span]:text-[0.74rem] [&>span]:font-extrabold [&>span]:text-copy-subtle">
                    {[...opportunity.roleTags, ...opportunity.topicTags].slice(0, 8).map((tag) => (
                      <span key={`${opportunity.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                ) : null}

                <div className="relative z-1 mt-auto flex flex-wrap gap-2.5 self-end">
                  <Button asChild variant="sitePrimary" size="siteCompact">
                    <Link href={opportunity.href} prefetch={false}>
                      查看详情
                      <ArrowRight aria-hidden="true" strokeWidth={2} />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid justify-items-start gap-3 rounded-md border border-[rgba(208,214,207,0.7)] bg-[linear-gradient(180deg,rgba(245,244,238,0.92),rgba(240,239,232,0.9))] p-6.5 shadow-sm max-sm:p-5">
            <BriefcaseBusiness className="size-9.5 text-primary" aria-hidden="true" strokeWidth={1.8} />
            <strong className="m-0 text-[1.18rem] text-heading">
              暂未开放公开招募项目
            </strong>
            <p className="m-0 max-w-168 leading-[1.68] text-copy-subtle">
              有真实场景、项目线索或合作需求，可以先提交给社区，我们确认后再决定是否公开招募。
            </p>
            <Button asChild variant="siteSecondary" size="site">
              <Link href="/cooperate" prefetch={false}>
                提交合作需求
              </Link>
            </Button>
          </div>
        )}
      </section>

      <section className="grid gap-3.5 pt-1.5" aria-labelledby="projects-notes-title">
        <div className="grid gap-2">
          <p className="home-kicker">Collaboration</p>
          <h2
            className="m-0 text-[clamp(1.45rem,2.2vw,1.9rem)] font-black leading-[1.12] text-heading"
            id="projects-notes-title"
          >
            项目如何在社区里推进
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3.5 max-sm:grid-cols-1">
          {projectNotes.map((item) => (
            <article
              className="grid min-h-31 gap-2 rounded-md border border-[rgba(126,170,151,0.18)] bg-site-note p-4.5 shadow-sm"
              key={item.title}
            >
              <h3 className="m-0 text-[1.08rem] font-black leading-[1.22] text-heading">
                {item.title}
              </h3>
              <p className="m-0 text-[0.92rem] font-semibold leading-[1.62] text-copy-subtle">
                {item.summary}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
