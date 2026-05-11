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

import { submitProjectApplication } from "@/app/(site)/projects/actions";
import { getVisibleProjectOpportunityBySlug } from "@/lib/community-projects";
import { createClient } from "@/lib/supabase/server";

import { ProjectApplicationSubmitButton } from "./project-application-submit-button";
import { ProjectApplicationToast } from "./project-application-toast";
import styles from "./project-detail-page.module.css";

type ProjectDetailSearchParams = {
  applied?: string;
  error?: string;
};

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing_required_fields") {
    return "请至少填写称呼。";
  }

  if (error === "missing_contact_channel") {
    return "请至少填写微信、手机号或邮箱中的一种联系方式。";
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

function getParagraphs(value: string | null) {
  return (value ?? "")
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = await getVisibleProjectOpportunityBySlug(slug);

  if (!opportunity) {
    return {
      title: "项目机会",
      description: "查看常州 AI Club 的项目共建机会。",
    };
  }

  return {
    title: opportunity.title,
    description: opportunity.summary,
  };
}

async function getSignedInUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
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
  const descriptionParagraphs = getParagraphs(opportunity.description);
  const isRecruiting = opportunity.status === "recruiting";
  const requiresLogin = opportunity.applicationRequiresLogin;
  const canApplyNow = isRecruiting && !hasApplied && (!requiresLogin || Boolean(signedInUserId));
  const shouldPromptLogin = isRecruiting && !hasApplied && requiresLogin && !signedInUserId;
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
    <div className={styles.projectDetailPage}>
      <ProjectApplicationToast
        applied={justSubmitted}
        errorMessage={errorMessage}
      />

      <Link href="/projects#opportunities" className={styles.backLink}>
        <ArrowLeft aria-hidden="true" strokeWidth={1.9} />
        返回项目共建
      </Link>

      <section className={styles.projectHero} aria-labelledby="project-detail-title">
        <div className={styles.projectHeroCopy}>
          <div className={styles.projectMetaRow}>
            <span>{opportunity.typeLabel}</span>
            <span>{opportunity.statusLabel}</span>
            <span>{opportunity.visibilityLabel}</span>
            <span>{requiresLogin ? "登录后申请" : "可直接申请"}</span>
          </div>

          <div className={styles.projectHeroHeading}>
            <p className="home-kicker">Project Opportunity · 共建机会</p>
            <h1 id="project-detail-title">{opportunity.title}</h1>
            <p>{opportunity.summary}</p>
          </div>

          <div className={styles.projectHeroActions}>
            {canApplyNow ? (
              <Link href="#application-form" className="button home-primary-button">
                {opportunity.applicationCta}
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
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

        <aside className={styles.projectHeroBoard} aria-label="项目关键信息">
          {detailItems.length > 0 ? (
            <div className={styles.projectDetailList}>
              {detailItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label}>
                    <Icon aria-hidden="true" strokeWidth={1.8} />
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.projectBoardNote}>
              <strong>项目细节待补充</strong>
              <span>社区会在需求确认后补齐投入方式、角色边界和筛选说明。</span>
            </div>
          )}
        </aside>
      </section>

      <section className={styles.projectQuickFacts} aria-label="项目概览">
        {quickFacts.map((item) => {
          const Icon = item.icon;

          return (
            <article className={styles.projectQuickFact} key={item.label}>
              <Icon aria-hidden="true" strokeWidth={1.9} />
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          );
        })}
      </section>

      <div className={styles.projectBodyLayout}>
        <main className={styles.projectMainFlow}>
          <section className={styles.projectContentPanel}>
            <div className={styles.projectSectionHeading}>
              <p className="home-kicker">Brief</p>
              <div>
                <h2>项目说明</h2>
                <p>包括背景、参与条件、角色要求、保密边界和具体备注。</p>
              </div>
            </div>

            {descriptionParagraphs.length > 0 ? (
              <div className={styles.projectRichtext}>
                {descriptionParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className={styles.projectSoftNote}>
                这个项目的详细说明还在整理中，可以先根据标题和摘要判断是否适合继续了解。
              </div>
            )}
          </section>

          {[...opportunity.roleTags, ...opportunity.topicTags].length > 0 ? (
            <section className={styles.projectContentPanel}>
              <div className={styles.projectSectionHeading}>
                <p className="home-kicker">Roles</p>
                <div>
                  <h2>角色与标签</h2>
                  <p>用于快速判断这个机会适合哪些成员、能力和兴趣方向。</p>
                </div>
              </div>

              <div className={styles.projectTagCloud}>
                {[...opportunity.roleTags, ...opportunity.topicTags].map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <aside className={styles.applicationPanel} id="application-form">
          <div className={styles.applicationPanelHeading}>
            <p className="home-kicker">Apply</p>
            <h2>
              {hasApplied
                ? "申请已提交"
                : shouldPromptLogin
                  ? "登录后申请"
                : isRecruiting
                  ? opportunity.applicationCta
                  : "当前暂不开放申请"}
            </h2>
            <p>
              {hasApplied
                ? "你的申请已经进入社区后台，后续会根据你留下的信息继续联系和筛选。"
                : shouldPromptLogin
                  ? "这个机会要求先登录社区账号，再提交申请信息。登录后会回到当前项目页面。"
                : (opportunity.applicationNote ??
                  "请补充你的角色意向、相关经验和可投入时间。具体项目筛选问题可以写在备注里。")}
            </p>
          </div>

          {hasApplied ? (
            <div className={styles.applicationSuccessPanel}>
              <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
              <div>
                <strong>我们已经收到这次共建申请</strong>
                <p>不用重复提交。你可以继续浏览其他共建机会，或等待社区后续联系。</p>
              </div>
              <Link href="/projects#opportunities" className="button home-ghost-button">
                查看其他机会
              </Link>
            </div>
          ) : shouldPromptLogin ? (
            <div className={styles.applicationLoginPanel}>
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
            <form action={submitProjectApplication} className={styles.applicationForm}>
              <input type="hidden" name="project_id" value={opportunity.id} />
              <input type="hidden" name="project_slug" value={opportunity.slug} />
              <input type="hidden" name="submission_key" value={submissionKey} />

              <label>
                <span>称呼</span>
                <input className="input" name="applicant_name" placeholder="怎么称呼你" required />
              </label>

              <label>
                <span>微信号</span>
                <input className="input" name="contact_wechat" placeholder="微信、手机号、邮箱至少填一项" />
              </label>

              <label>
                <span>手机号</span>
                <input className="input" name="contact_phone" placeholder="微信、手机号、邮箱至少填一项" />
              </label>

              <label>
                <span>邮箱</span>
                <input className="input" type="email" name="contact_email" placeholder="微信、手机号、邮箱至少填一项" />
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
            <div className={styles.projectSoftNote}>
              这个机会当前状态为“{opportunity.statusLabel}”。如需了解类似合作，可以从合作联系入口提交需求。
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
