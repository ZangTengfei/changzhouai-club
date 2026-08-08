import type { Metadata } from "next";
import { randomUUID } from "crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Timer,
  UsersRound,
} from "lucide-react";

import { RevealImage } from "@/components/reveal-image";
import { getProjectCoverImageUrl } from "@/lib/public-image-url";

import { submitProjectApplication } from "@/app/(site)/projects/actions";
import { MarkdownContent } from "@/components/markdown-content";
import { getVisibleProjectOpportunityBySlug } from "@/lib/community-projects";
import { createNoIndexMetadata, createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { resolveCommunityUserId } from "@/lib/community-user";

import { ProjectApplicationSubmitButton } from "./project-application-submit-button";
import { ProjectApplicationToast } from "./project-application-toast";
import { ProjectAnchorScroll } from "./project-anchor-scroll";

const contentPanelClassName =
  "grid gap-5 rounded-[var(--radius-lg)] bg-white p-6 shadow-[0_14px_34px_rgba(var(--ink-rgb),0.07)] max-sm:p-5";
const sectionHeadingClassName =
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 max-sm:grid-cols-1 max-sm:gap-2.5 [&_h2]:m-0 [&_h2]:text-[1.8rem] [&_h2]:leading-[1.12] [&_h2]:font-black [&_h2]:tracking-normal [&_h2]:text-[#111a1d] [&_div>p]:mt-2 [&_div>p]:mb-0 [&_div>p]:leading-[1.68] [&_div>p]:text-[rgba(var(--ink-rgb),0.62)]";
const softNoteClassName =
  "rounded-[var(--radius-md)] bg-[#e9f9f0] px-4 py-3.5 font-bold leading-[1.62] text-[rgba(var(--ink-rgb),0.68)]";
const applicationStatePanelClassName =
  "grid gap-3.5 rounded-[var(--radius-md)] p-[18px] [&>.button]:w-full [&>.button]:justify-center [&_svg]:size-[34px] [&_svg]:text-primary [&_strong]:m-0 [&_strong]:text-[1.05rem] [&_strong]:leading-[1.28] [&_strong]:font-black [&_strong]:text-[#111a1d] [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:leading-[1.62] [&_p]:text-[rgba(var(--ink-rgb),0.64)]";

const occupationOptions = [
  "学生",
  "公司职员",
  "自由职业者",
  "个体经营者",
  "暂无工作",
  "退休",
  "其他",
];

type ProjectDetailSearchParams = {
  applied?: string;
  error?: string;
};

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing_required_fields") {
    return "请填写姓名和职业 / 当前身份。";
  }

  if (error === "missing_contact_channel") {
    return "请填写微信号和手机号。";
  }

  if (error === "applications_closed") {
    return "这个机会当前不在招募状态，暂时不能提交申请。";
  }

  if (error === "project_not_found") {
    return "没有找到可申请的项目机会。";
  }

  if (error === "login_required") {
    return "这个机会需要登录后申请。";
  }

  return "提交失败，请稍后再试。";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = await getVisibleProjectOpportunityBySlug(slug);

  if (!opportunity) {
    return createNoIndexMetadata(
      "项目机会",
      "查看常州 AI Club 的项目协作机会。",
      `/projects/${slug}`,
    );
  }

  return createPageMetadata({
    title: opportunity.title,
    description: opportunity.summary,
    path: `/projects/${opportunity.slug}`,
    image: opportunity.coverImageUrl,
  });
}

async function getSignedInUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? resolveCommunityUserId(supabase, user.id) : null;
}

async function hasSignedInUserApplied(projectId: string, userId: string | null) {
  if (!userId) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_applications")
    .select("id")
    .eq("project_id", projectId)
    .eq("applicant_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check current user's project application.", {
      projectId,
      error,
    });
    return false;
  }

  return Boolean(data);
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProjectDetailSearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const opportunity = await getVisibleProjectOpportunityBySlug(slug);

  if (!opportunity) {
    notFound();
  }

  const errorMessage = getErrorMessage(query.error);
  const justSubmitted = Boolean(query.applied);
  const signedInUserId = await getSignedInUserId();
  const hasApplied = justSubmitted || (await hasSignedInUserApplied(opportunity.id, signedInUserId));
  const submissionKey = randomUUID();
  const descriptionMarkdown = opportunity.description?.trim();
  const isRecruiting = opportunity.status === "recruiting";
  const externalApplicationUrl = opportunity.externalApplicationUrl;
  const hasExternalApplication = Boolean(externalApplicationUrl);
  const requiresLogin = opportunity.applicationRequiresLogin;
  const canApplyNow =
    isRecruiting &&
    !hasExternalApplication &&
    !hasApplied &&
    (!requiresLogin || Boolean(signedInUserId));
  const shouldPromptLogin =
    isRecruiting && !hasExternalApplication && !hasApplied && requiresLogin && !signedInUserId;
  const loginHref = `/login?next=${encodeURIComponent(`/projects/${opportunity.slug}#application-form`)}`;
  const quickFacts = [
    {
      label: "机会类型",
      value: opportunity.typeLabel,
      icon: BriefcaseBusiness,
    },
    {
      label: "当前状态",
      value: opportunity.statusLabel,
      icon: ShieldCheck,
    },
    {
      label: "招募人数",
      value: opportunity.headcountLabel ?? "按需匹配",
      icon: UsersRound,
    },
    {
      label: "截止时间",
      value: opportunity.deadlineLabel ?? "待定",
      icon: CalendarDays,
    },
  ];
  const detailItems = [
    {
      label: "时间投入",
      value: opportunity.timeCommitment,
      icon: Timer,
    },
    {
      label: "合作回报",
      value: opportunity.compensation,
      icon: Sparkles,
    },
    {
      label: "地点 / 形式",
      value: opportunity.location,
      icon: MapPin,
    },
  ].filter((item) => item.value);

  return (
    <div className="grid gap-7 max-sm:gap-[22px]">
      <ProjectAnchorScroll targetId="application-form" />
      <ProjectApplicationToast
        applied={justSubmitted}
        errorMessage={errorMessage}
      />

      <Link href="/projects#opportunities" className="inline-flex w-fit items-center gap-2 text-[0.92rem] font-extrabold text-[rgba(var(--ink-rgb),0.62)] no-underline transition-colors hover:text-[var(--accent-strong)] focus-visible:text-[var(--accent-strong)] [&_svg]:size-[18px]">
        <ArrowLeft aria-hidden="true" strokeWidth={1.9} />
        返回项目协作
      </Link>

      <section className="grid grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] items-stretch gap-7 max-lg:grid-cols-1" aria-labelledby="project-detail-title">
        <div className="grid content-start gap-[22px] rounded-[var(--radius-lg)] border border-[rgba(212,216,209,0.7)] bg-[linear-gradient(180deg,rgba(246,244,238,0.94),rgba(241,239,232,0.88))] p-7 shadow-[0_16px_34px_rgba(var(--ink-rgb),0.055),inset_0_1px_0_rgba(255,255,255,0.62)] max-sm:p-5">
          <div className="flex flex-wrap gap-2.5 [&_span]:inline-flex [&_span]:min-h-[34px] [&_span]:items-center [&_span]:rounded-[var(--radius-pill)] [&_span]:border [&_span]:border-[rgba(var(--ink-rgb),0.08)] [&_span]:bg-[rgba(255,252,247,0.74)] [&_span]:px-3 [&_span]:text-[0.84rem] [&_span]:font-[850] [&_span]:text-[rgba(var(--ink-rgb),0.64)] [&_span:first-child]:bg-[rgba(var(--accent-rgb),0.1)] [&_span:first-child]:text-[var(--accent-strong)]">
            <span>{opportunity.typeLabel}</span>
            <span>{opportunity.statusLabel}</span>
            <span>{opportunity.visibilityLabel}</span>
            <span>
              {hasExternalApplication ? "外部表单" : requiresLogin ? "登录后申请" : "可直接申请"}
            </span>
          </div>

          <div className="grid gap-4">
            <p className="home-kicker">Project Opportunity · 项目机会</p>
            <h1 className="m-0 text-[3.1rem] leading-[1.08] font-black tracking-normal text-[#111b1f] max-sm:text-[2.32rem]" id="project-detail-title">{opportunity.title}</h1>
            <p className="m-0 max-w-[42rem] text-[1.06rem] leading-[1.82] text-[rgba(var(--ink-rgb),0.72)]">{opportunity.summary}</p>
          </div>

          <div className="flex flex-wrap gap-3 max-sm:[&>.button]:w-full [&_svg]:size-[18px]">
            {canApplyNow ? (
              <Link href="#application-form" className="button home-primary-button">
                {opportunity.applicationCta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            ) : null}
            {isRecruiting && externalApplicationUrl ? (
              <a
                href={externalApplicationUrl}
                className="button home-primary-button"
                target="_blank"
                rel="noreferrer"
              >
                {opportunity.applicationCta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </a>
            ) : null}
            {shouldPromptLogin ? (
              <Link href={loginHref} className="button home-primary-button">
                登录后申请
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            ) : null}
            <Link href="/cooperate" className="button home-ghost-button">
              发起类似需求
            </Link>
          </div>
        </div>

        <aside className="grid content-start gap-3.5 rounded-[var(--radius-lg)] bg-[#edf5ff] p-6 max-sm:p-5" aria-label="项目关键信息">
          {opportunity.coverImageUrl ? (
            <div className="aspect-[16/10] overflow-hidden rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.7)] [&_img]:block [&_img]:size-full [&_img]:object-cover">
              <RevealImage
                src={
                  getProjectCoverImageUrl(opportunity.coverImageUrl, "detail") ??
                  opportunity.coverImageUrl
                }
                alt=""
                loading="eager"
                fetchPriority="high"
              />
            </div>
          ) : null}

          {detailItems.length > 0 ? (
            <div className="grid gap-3">
              {detailItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div className="grid min-h-[70px] grid-cols-[38px_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.7)] p-3" key={item.label}>
                    <Icon className="row-span-2 size-[30px] text-primary" aria-hidden="true" strokeWidth={1.8} />
                    <span className="text-[0.8rem] font-[850] text-[rgba(var(--ink-rgb),0.52)]">{item.label}</span>
                    <strong className="text-[0.98rem] leading-[1.38] text-[#111a1d]">{item.value}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-2 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.7)] p-[18px]">
              <strong className="text-[#111a1d]">项目细节待补充</strong>
              <span className="leading-[1.62] text-[rgba(var(--ink-rgb),0.62)]">社区会在需求确认后补齐投入方式、角色边界和筛选说明。</span>
            </div>
          )}
        </aside>
      </section>

      <section className="grid grid-cols-4 gap-0 rounded-[var(--radius-md)] border border-[rgba(212,216,209,0.7)] bg-[linear-gradient(180deg,rgba(246,244,238,0.94),rgba(241,239,232,0.88))] px-[26px] py-6 shadow-[0_12px_28px_rgba(var(--ink-rgb),0.04),inset_0_1px_0_rgba(255,255,255,0.5)] max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:px-[18px] max-sm:py-1.5" aria-label="项目概览">
        {quickFacts.map((item) => {
          const Icon = item.icon;

          return (
            <article className="grid min-h-[82px] min-w-0 grid-cols-[42px_minmax(0,1fr)] items-center gap-x-3.5 gap-y-[7px] border-r border-[rgba(var(--ink-rgb),0.075)] px-5 last:border-r-0 max-lg:border-r-0 max-lg:border-b max-lg:py-[18px] max-lg:odd:border-r max-lg:[&:nth-last-child(-n+2)]:border-b-0 max-sm:border-r-0! max-sm:border-b! max-sm:px-0 max-sm:py-[18px] max-sm:last:border-b-0!" key={item.label}>
              <Icon className="row-span-2 size-9 text-primary" aria-hidden="true" strokeWidth={1.9} />
              <strong className="overflow-hidden text-[1.08rem] font-black text-ellipsis whitespace-nowrap text-[#111a1d]">{item.value}</strong>
              <span className="overflow-hidden text-[0.82rem] font-[850] text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.54)]">{item.label}</span>
            </article>
          );
        })}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,380px)] items-start gap-[22px] max-lg:grid-cols-1">
        <main className="grid min-w-0 gap-[22px]">
          <section className={contentPanelClassName}>
            <div className={sectionHeadingClassName}>
              <p className="home-kicker">Brief</p>
              <div>
                <h2>项目说明</h2>
                <p>包括背景、参与条件、角色要求、保密边界、交付方式和具体备注。</p>
              </div>
            </div>

            {descriptionMarkdown ? (
              <MarkdownContent
                content={descriptionMarkdown}
                className="text-base text-[rgba(var(--ink-rgb),0.72)]"
              />
            ) : (
              <div className={softNoteClassName}>
                这个项目的详细说明还在整理中，可以先根据标题和摘要判断是否适合继续了解。
              </div>
            )}
          </section>

          {[...opportunity.roleTags, ...opportunity.topicTags].length > 0 ? (
            <section className={contentPanelClassName}>
              <div className={sectionHeadingClassName}>
                <p className="home-kicker">Roles</p>
                <div>
                  <h2>角色与标签</h2>
                  <p>用于快速判断这个机会适合哪些成员、能力和参与方式。</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-[9px]">
                {[...opportunity.roleTags, ...opportunity.topicTags].map((tag) => (
                  <span className="inline-flex min-h-[30px] items-center rounded-[var(--radius-pill)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.72)] px-[11px] text-[0.82rem] font-extrabold text-[rgba(var(--ink-rgb),0.66)]" key={tag}>{tag}</span>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <aside className={`${contentPanelClassName} sticky top-[92px] scroll-mt-[108px] max-lg:static`} id="application-form">
          <div className="grid gap-2 [&_h2]:m-0 [&_h2]:text-[1.8rem] [&_h2]:leading-[1.12] [&_h2]:font-black [&_h2]:tracking-normal [&_h2]:text-[#111a1d] [&>p:last-child]:mt-2 [&>p:last-child]:mb-0 [&>p:last-child]:leading-[1.68] [&>p:last-child]:text-[rgba(var(--ink-rgb),0.62)]">
            <p className="home-kicker">Apply</p>
            <h2>
              {hasApplied
                ? "申请已提交"
                : hasExternalApplication && isRecruiting
                  ? opportunity.applicationCta
                : shouldPromptLogin
                  ? "登录后申请"
                : isRecruiting
                  ? opportunity.applicationCta
                  : "当前暂不开放申请"}
            </h2>
            <p>
              {hasApplied
                ? "你的申请已经进入社区后台，后续会根据你留下的信息继续联系和筛选。"
                : hasExternalApplication && isRecruiting
                  ? (opportunity.applicationNote ??
                    "这个机会使用外部表单收集申请信息，请点击按钮前往填写。")
                : shouldPromptLogin
                  ? "这个机会要求先登录社区账号，再提交申请信息。登录后会回到当前项目页面。"
                : (opportunity.applicationNote ??
                  "请补充你的角色意向、相关经验和可投入时间。具体项目筛选问题可以写在备注里。")}
            </p>
          </div>

          {hasApplied ? (
            <div className={`${applicationStatePanelClassName} bg-[#e9f9f0]`}>
              <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
              <div>
                <strong>我们已经收到这次项目申请</strong>
                <p>不用重复提交。你可以继续浏览其他项目机会，或等待社区后续联系。</p>
              </div>
              <Link href="/projects#opportunities" className="button home-ghost-button">
                查看其他机会
              </Link>
            </div>
          ) : hasExternalApplication && isRecruiting && externalApplicationUrl ? (
            <div className={`${applicationStatePanelClassName} bg-[#fff2e5]`}>
              <Sparkles aria-hidden="true" strokeWidth={1.9} />
              <div>
                <strong>通过外部预登记表提交信息</strong>
                <p>填写后由社区根据项目情况继续做赛事解读、报名辅导和资源对接。</p>
              </div>
              <a
                href={externalApplicationUrl}
                className="button home-primary-button"
                target="_blank"
                rel="noreferrer"
              >
                {opportunity.applicationCta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </a>
            </div>
          ) : shouldPromptLogin ? (
            <div className={`${applicationStatePanelClassName} bg-[#fff2e5]`}>
              <ShieldCheck aria-hidden="true" strokeWidth={1.9} />
              <div>
                <strong>这个机会需要登录后申请</strong>
                <p>登录会帮助社区把申请和账号关联起来，也方便后续查看和跟进。</p>
              </div>
              <Link href={loginHref} className="button home-primary-button">
                登录后申请
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            </div>
          ) : isRecruiting ? (
            <form action={submitProjectApplication} className="grid gap-3.5 [&_button]:mt-1 [&_button_svg]:size-[18px] [&_label]:grid [&_label]:gap-2 [&_label>span]:text-[0.84rem] [&_label>span]:font-[850] [&_label>span]:text-[rgba(var(--ink-rgb),0.64)]">
              <input type="hidden" name="project_id" value={opportunity.id} />
              <input type="hidden" name="project_slug" value={opportunity.slug} />
              <input type="hidden" name="submission_key" value={submissionKey} />

              <label>
                <span>姓名</span>
                <input className="input" name="applicant_name" placeholder="请输入姓名" required />
              </label>

              <label>
                <span>职业 / 当前身份</span>
                <input
                  className="input"
                  name="applicant_occupation"
                  list="project-application-occupation-options"
                  placeholder="例如：学生 / 公司职员 / 暂无工作"
                  required
                />
                <datalist id="project-application-occupation-options">
                  {occupationOptions.map((option) => (
                    <option value={option} key={option} />
                  ))}
                </datalist>
              </label>

              <label>
                <span>微信号（必填）</span>
                <input className="input" name="contact_wechat" placeholder="用于后续沟通和对接" required />
              </label>

              <label>
                <span>手机号（必填）</span>
                <input className="input" name="contact_phone" type="tel" placeholder="用于确认身份和紧急联系" required />
              </label>

              <label>
                <span>邮箱（选填）</span>
                <input className="input" type="email" name="contact_email" placeholder="可用于接收后续资料" />
              </label>

              <label>
                <span>申请角色 / 参与方式</span>
                <input className="input" name="role_interest" placeholder="例如：项目经理 / 后端开发 / 标注参与者" />
              </label>

              <label>
                <span>可投入时间</span>
                <input className="input" name="available_time" placeholder="例如：每周 5 小时 / 工作日晚间 / 可短期集中投入" />
              </label>

              <label>
                <span>相关经验</span>
                <textarea
                  className="input textarea"
                  name="experience_summary"
                  rows={4}
                  placeholder="写一下相关项目、行业经验、能力背景或适合这个机会的原因。"
                />
              </label>

              <label>
                <span>作品 / 案例链接</span>
                <input className="input" name="portfolio_url" placeholder="个人主页、作品、公司介绍或案例链接" />
              </label>

              <label>
                <span>备注</span>
                <textarea
                  className="input textarea"
                  name="note"
                  rows={4}
                  placeholder="项目里提到的特定条件、筛选问题或你想补充的信息，都可以写在这里。"
                />
              </label>

              <ProjectApplicationSubmitButton />
            </form>
          ) : (
            <div className={softNoteClassName}>
              这个机会当前状态为“{opportunity.statusLabel}”。如需了解类似合作，可以从合作联系入口提交需求。
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
