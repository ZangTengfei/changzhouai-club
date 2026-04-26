import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  Eye,
  EyeOff,
  PencilLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";

import {
  cancelRegistration,
  deleteAccountMemberWork,
  saveAccountMemberWork,
} from "@/app/(site)/account/actions";
import { AccountActionModal } from "@/components/account-action-modal";
import { AccountProfileForm } from "@/components/account-profile-form";
import { MemberAvatar } from "@/components/member-avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import {
  workReviewStatusLabels,
  workStatusLabels,
  workTypeLabels,
  type PublicWorkReviewStatus,
  type PublicWorkStatus,
  type PublicWorkType,
} from "@/lib/community-works";
import { hasSupabaseEnv } from "@/lib/env";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import { createClient } from "@/lib/supabase/server";

import styles from "./account-page.module.css";

export const metadata: Metadata = {
  title: "账号",
  description: "查看当前登录账号、成员资料状态和活动报名记录。",
};

function formatProviderList(providers: string[]) {
  return providers.length > 0 ? providers.join(", ") : "邮箱登录";
}

function formatEventDate(value: string | null | undefined) {
  if (!value) {
    return "时间待定";
  }

  return formatChangzhouDateTime(value, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing_required_fields") {
    return "请先填写显示名和微信号这两个必填项。";
  }

  if (error === "invalid_avatar_url") {
    return "头像地址格式无效，请填写以 http 或 https 开头的公开图片地址。";
  }

  if (error === "invalid_public_slug") {
    return "个人主页链接无效，请使用 3-32 位小写英文、数字或短横线，且不要使用保留词。";
  }

  if (error === "public_slug_taken") {
    return "这个个人主页链接已经被占用，请换一个。";
  }

  if (error === "missing_work_fields") {
    return "请至少填写作品名称和一句话介绍。";
  }

  if (error === "invalid_work_url") {
    return "作品链接格式无效，请填写以 http 或 https 开头的公开链接。";
  }

  if (error === "work_save_failed") {
    return "作品保存失败，请稍后再试。";
  }

  return "资料保存失败，请稍后再试。";
}

type AccountMemberWork = {
  id: string;
  title: string;
  summary: string;
  description: string | null;
  work_type: PublicWorkType;
  status: PublicWorkStatus;
  review_status: PublicWorkReviewStatus;
  role_label: string | null;
  cover_image_url: string | null;
  website_url: string | null;
  repo_url: string | null;
  demo_url: string | null;
  tags: string[] | null;
  is_public: boolean;
  is_featured: boolean;
  updated_at: string;
};

function getReviewTone(status: PublicWorkReviewStatus, isPublic: boolean) {
  if (isPublic) {
    return styles.workReviewApproved;
  }

  if (status === "rejected") {
    return styles.workReviewRejected;
  }

  if (status === "changes_requested") {
    return styles.workReviewChanges;
  }

  return styles.workReviewPending;
}

const profileModalErrorCodes = new Set([
  "missing_required_fields",
  "invalid_avatar_url",
  "invalid_public_slug",
  "public_slug_taken",
  "save_failed",
]);

const workModalErrorCodes = new Set([
  "missing_work_fields",
  "invalid_work_url",
  "work_save_failed",
]);

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    error?: string;
    onboarding?: string;
    submit?: string;
  }>;
}) {
  const enabled = hasSupabaseEnv();
  const params = await searchParams;

  if (!enabled) {
    return (
      <div className={styles.accountPage}>
        <section className={styles.disabledPanel}>
          <p className="home-kicker">Account · 账号</p>
          <h1>账号服务暂未开放</h1>
          <p>当前账号服务暂未启用，请稍后再试。</p>
          <Link href="/login" className="button home-primary-button">
            返回登录页
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
        </section>
      </div>
    );
  }

  const supabase = await createClient();
  const [{ data: userData }, { data: identityData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getUserIdentities(),
  ]);

  const user = userData.user;

  if (!user) {
    const nextPath = params.onboarding
      ? "/account?onboarding=1"
      : params.submit === "work"
        ? "/account?submit=work#works"
        : "/account";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const [{ data: profile }, { data: member }, { data: registrations }, { data: works }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, public_slug, avatar_url, wechat, city, role_label, organization, monthly_time, bio, skills, interests",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("members")
        .select(
          "status, willing_to_attend, willing_to_share, willing_to_join_projects, is_publicly_visible, is_featured_on_home",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("event_registrations")
        .select(
          "id, status, note, created_at, events(title, event_at, city, venue, slug, status)",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("member_works")
        .select(
          "id, title, summary, description, work_type, status, review_status, role_label, cover_image_url, website_url, repo_url, demo_url, tags, is_public, is_featured, updated_at",
        )
        .eq("member_id", user.id)
        .order("updated_at", { ascending: false }),
    ]);

  const identities = identityData?.identities ?? [];
  const providers = identities.map((item) => item.provider);
  const displayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "社区成员";
  const profileComplete = Boolean(
    profile?.display_name?.trim() && profile?.wechat?.trim(),
  );
  const publicProfilePath = member?.is_publicly_visible
    ? getMemberPublicSlugPath({
        id: user.id,
        publicSlug: profile?.public_slug ?? null,
      })
    : null;
  const registrationCount = registrations?.length ?? 0;
  const memberWorks = ((works ?? []) as AccountMemberWork[]).map((work) => ({
    ...work,
    tags: work.tags ?? [],
  }));
  const activeRegistrationCount =
    registrations?.filter((item) => item.status !== "cancelled").length ?? 0;
  const statusMessage = getStatusMessage(params.error);
  const shouldOpenProfileModal =
    Boolean(params.onboarding) || profileModalErrorCodes.has(params.error ?? "");
  const shouldOpenWorkModal =
    params.submit === "work" || workModalErrorCodes.has(params.error ?? "");
  const accountSummaryItems = [
    {
      label: "资料状态",
      value: profileComplete ? "已完成" : "待完善",
      detail: profileComplete ? "可以继续补充公开资料" : "显示名和微信号为必填",
      icon: BadgeCheck,
    },
    {
      label: "公开主页",
      value: publicProfilePath ? "已开启" : "未公开",
      detail: publicProfilePath ?? "成员公开展示后可访问",
      icon: member?.is_publicly_visible ? Eye : EyeOff,
    },
    {
      label: "报名记录",
      value: `${activeRegistrationCount} / ${registrationCount}`,
      detail: "进行中 / 全部记录",
      icon: Ticket,
    },
    {
      label: "登录方式",
      value: formatProviderList(providers),
      detail: user.email ?? "未提供邮箱",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className={styles.accountPage}>
      <section className={styles.accountSummary} aria-labelledby="account-title">
        <div className={styles.accountAvatarCard}>
          <MemberAvatar
            name={displayName}
            avatarUrl={profile?.avatar_url ?? null}
          />
          <div>
            <strong>{displayName}</strong>
            <span>{profile?.role_label ?? "常州 AI Club 成员"}</span>
          </div>
        </div>

        <div className={styles.accountSummaryCopy}>
          <p className="home-kicker">Account · 账号中心</p>
          <h1 id="account-title">管理社区身份</h1>
          <p>维护成员资料、查看活动报名记录，并更新你在社区中的公开信息。</p>

          <div className={styles.accountSummaryActions}>
            <AccountActionModal
              title={profileComplete ? "编辑个人资料" : "完善加入资料"}
              description={
                profileComplete
                  ? "更新头像、公开主页链接、城市、技能标签和协作偏好。"
                  : "先填写显示名和微信号，其他公开资料可以稍后继续补充。"
              }
              defaultOpen={shouldOpenProfileModal}
              trigger={
                <button type="button" className="button home-primary-button">
                  {profileComplete ? "编辑资料" : "完善资料"}
                  <PencilLine aria-hidden="true" strokeWidth={2} />
                </button>
              }
            >
              <AccountProfileForm
                className={styles.accountProfileForm}
                userId={user.id}
                profile={profile}
                member={member}
              />
            </AccountActionModal>
            {profileComplete ? (
              <Link href="#registrations" className="button home-ghost-button">
                查看报名记录
              </Link>
            ) : null}
            <Link href="/events" className="button home-ghost-button">
              查看活动
            </Link>
            {publicProfilePath ? (
              <Link href={publicProfilePath} className="button home-ghost-button">
                查看公开主页
              </Link>
            ) : null}
            <SignOutButton enabled />
          </div>
        </div>

        <div className={styles.accountMetaGrid} aria-label="账号概览">
          {accountSummaryItems.map((item) => {
            const Icon = item.icon;

            return (
              <article className={styles.accountMetaItem} key={item.label}>
                <Icon aria-hidden="true" strokeWidth={1.9} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </article>
            );
          })}
        </div>
      </section>

      {params.onboarding || !profileComplete ? (
        <div className={styles.statusNote}>
          <Sparkles aria-hidden="true" strokeWidth={1.9} />
          <span>
            先补完显示名和微信号这两个必填项，就可以完成加入；其他资料都可以稍后继续完善。
          </span>
        </div>
      ) : null}

      {params.updated ? (
        <div className={styles.statusNote}>
          <BadgeCheck aria-hidden="true" strokeWidth={1.9} />
          <span>
            {params.updated === "profile"
              ? "成员资料已保存。"
              : params.updated === "work"
                ? "作品已提交，等待管理员审核。"
                : params.updated === "work_deleted"
                  ? "作品已删除。"
                  : "活动报名状态已更新。"}
          </span>
        </div>
      ) : null}

      {statusMessage ? (
        <div className={`${styles.statusNote} ${styles.statusNoteError}`}>
          <CircleAlert aria-hidden="true" strokeWidth={1.9} />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      <section className={styles.accountWorksSection} id="works">
        <div className={styles.accountSectionHeading}>
          <p className="home-kicker">Works</p>
          <div className={styles.accountSectionHeadingMain}>
            <div>
              <h2>我的作品</h2>
              <p>
                可以提交你做过的产品、工具、开源项目、案例或 Demo。提交后先进入待审核状态，
                管理员通过后会展示到作品墙和你的成员主页。
              </p>
            </div>
            <AccountActionModal
              title="提交作品"
              description="补充作品名称、链接、标签和你的参与角色，提交后会进入管理员审核。"
              defaultOpen={shouldOpenWorkModal}
              trigger={
                <button
                  type="button"
                  className={`button home-primary-button ${styles.accountSectionAction}`}
                >
                  <Plus aria-hidden="true" strokeWidth={2} />
                  提交作品
                </button>
              }
            >
              <form
                action={saveAccountMemberWork}
                className={`${styles.accountWorkForm} ${styles.accountWorkDialogForm}`}
              >
                <label>
                  <span>作品名称</span>
                  <input className="input" name="title" required />
                </label>

                <label>
                  <span>作品类型</span>
                  <select className="input" name="work_type" defaultValue="product">
                    {Object.entries(workTypeLabels).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>当前状态</span>
                  <select className="input" name="status" defaultValue="building">
                    {Object.entries(workStatusLabels).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>我在其中的角色</span>
                  <input
                    className="input"
                    name="role_label"
                    placeholder="例如：发起人 / 开发者 / 产品负责人"
                  />
                </label>

                <label className={styles.accountWorkWideField}>
                  <span>一句话介绍</span>
                  <textarea className="input textarea" name="summary" rows={2} required />
                </label>

                <label className={styles.accountWorkWideField}>
                  <span>详细说明</span>
                  <textarea className="input textarea" name="description" rows={4} />
                </label>

                <label>
                  <span>封面图链接</span>
                  <input className="input" name="cover_image_url" placeholder="https://..." />
                </label>

                <label>
                  <span>官网 / 产品链接</span>
                  <input className="input" name="website_url" placeholder="https://..." />
                </label>

                <label>
                  <span>Demo 链接</span>
                  <input className="input" name="demo_url" placeholder="https://..." />
                </label>

                <label>
                  <span>代码仓库</span>
                  <input className="input" name="repo_url" placeholder="https://..." />
                </label>

                <label className={styles.accountWorkWideField}>
                  <span>标签</span>
                  <input
                    className="input"
                    name="tags"
                    placeholder="例如：AI 工具、OPC、自动化"
                  />
                </label>

                <div className={styles.accountWorkFormFooter}>
                  <button type="submit" className="button home-primary-button">
                    提交审核
                  </button>
                  <span>提交后会暂时隐藏，审核通过后才会公开展示。</span>
                </div>
              </form>
            </AccountActionModal>
          </div>
        </div>

        {memberWorks.length > 0 ? (
          <div className={styles.accountWorkList}>
            {memberWorks.map((work) => (
              <article className={styles.accountWorkCard} key={work.id}>
                <div className={styles.accountWorkCardHead}>
                  <div>
                    <span
                      className={`${styles.workReviewBadge} ${getReviewTone(
                        work.review_status,
                        work.is_public,
                      )}`}
                    >
                      {work.is_public
                        ? "已公开"
                        : workReviewStatusLabels[work.review_status]}
                    </span>
                    <h3>{work.title}</h3>
                    <p>
                      {workTypeLabels[work.work_type]} · {workStatusLabels[work.status]}
                      {work.role_label ? ` · ${work.role_label}` : ""}
                    </p>
                  </div>
                  {work.cover_image_url ? (
                    <img src={work.cover_image_url} alt="" loading="lazy" />
                  ) : (
                    <Boxes aria-hidden="true" strokeWidth={1.8} />
                  )}
                </div>

                <p>{work.summary}</p>
                {(work.tags ?? []).length > 0 ? (
                  <div className={styles.accountWorkTags}>
                    {(work.tags ?? []).map((tag) => (
                      <span key={`${work.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                ) : null}

                <details className={styles.accountWorkInlineEditor}>
                  <summary>修改后重新提交审核</summary>
                  <form action={saveAccountMemberWork} className={styles.accountWorkForm}>
                    <input type="hidden" name="work_id" value={work.id} />

                    <label>
                      <span>作品名称</span>
                      <input className="input" name="title" defaultValue={work.title} required />
                    </label>
                    <label>
                      <span>作品类型</span>
                      <select className="input" name="work_type" defaultValue={work.work_type}>
                        {Object.entries(workTypeLabels).map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>当前状态</span>
                      <select className="input" name="status" defaultValue={work.status}>
                        {Object.entries(workStatusLabels).map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>我在其中的角色</span>
                      <input
                        className="input"
                        name="role_label"
                        defaultValue={work.role_label ?? ""}
                      />
                    </label>
                    <label className={styles.accountWorkWideField}>
                      <span>一句话介绍</span>
                      <textarea
                        className="input textarea"
                        name="summary"
                        defaultValue={work.summary}
                        rows={2}
                        required
                      />
                    </label>
                    <label className={styles.accountWorkWideField}>
                      <span>详细说明</span>
                      <textarea
                        className="input textarea"
                        name="description"
                        defaultValue={work.description ?? ""}
                        rows={4}
                      />
                    </label>
                    <label>
                      <span>封面图链接</span>
                      <input
                        className="input"
                        name="cover_image_url"
                        defaultValue={work.cover_image_url ?? ""}
                      />
                    </label>
                    <label>
                      <span>官网 / 产品链接</span>
                      <input
                        className="input"
                        name="website_url"
                        defaultValue={work.website_url ?? ""}
                      />
                    </label>
                    <label>
                      <span>Demo 链接</span>
                      <input className="input" name="demo_url" defaultValue={work.demo_url ?? ""} />
                    </label>
                    <label>
                      <span>代码仓库</span>
                      <input className="input" name="repo_url" defaultValue={work.repo_url ?? ""} />
                    </label>
                    <label className={styles.accountWorkWideField}>
                      <span>标签</span>
                      <input
                        className="input"
                        name="tags"
                        defaultValue={(work.tags ?? []).join("，")}
                      />
                    </label>
                    <div className={styles.accountWorkFormFooter}>
                      <button type="submit" className="button home-primary-button">
                        重新提交
                      </button>
                    </div>
                  </form>
                </details>

                {!work.is_public ? (
                  <form action={deleteAccountMemberWork}>
                    <input type="hidden" name="work_id" value={work.id} />
                    <button type="submit" className="button home-ghost-button">
                      删除这个作品
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyRegistrationPanel}>
            <Boxes aria-hidden="true" strokeWidth={1.8} />
            <div>
              <strong>你还没有提交作品</strong>
              <p>可以先把自己的产品、工具、开源项目或案例补充进来，审核后进入作品墙。</p>
            </div>
            <Link href="/works" className="button home-ghost-button">
              查看作品墙
            </Link>
          </div>
        )}
      </section>

      <section className={styles.registrationSection} id="registrations">
        <div className={styles.accountSectionHeading}>
          <p className="home-kicker">Registrations</p>
          <div>
            <h2>我报名过的活动</h2>
            <p>这里汇总你的活动报名记录，方便随时查看参与状态与活动信息。</p>
          </div>
        </div>

        {registrations && registrations.length > 0 ? (
          <div className={styles.registrationList}>
            {registrations.map((registration) => {
              const rawEvent = registration.events as
                | {
                    title: string | null;
                    event_at: string | null;
                    city: string | null;
                    venue: string | null;
                    slug: string | null;
                    status: string | null;
                  }
                | {
                    title: string | null;
                    event_at: string | null;
                    city: string | null;
                    venue: string | null;
                    slug: string | null;
                    status: string | null;
                  }[]
                | null;

              const event = Array.isArray(rawEvent) ? rawEvent[0] : rawEvent;
              const eventHref = event?.slug ? `/events/${event.slug}` : null;

              return (
                <article className={styles.registrationCard} key={registration.id}>
                  <div className={styles.registrationCardIcon}>
                    <CalendarDays aria-hidden="true" strokeWidth={1.9} />
                  </div>
                  <div>
                    <span>{registration.status}</span>
                    <h3>
                      {eventHref ? (
                        <Link href={eventHref}>{event?.title ?? "未找到活动"}</Link>
                      ) : (
                        (event?.title ?? "未找到活动")
                      )}
                    </h3>
                    <p>{formatEventDate(event?.event_at)}</p>
                    <p>
                      {event?.city ?? "常州"}
                      {event?.venue ? ` · ${event.venue}` : ""}
                    </p>
                    {registration.note ? <p>报名备注：{registration.note}</p> : null}
                  </div>

                  {registration.status !== "cancelled" ? (
                    <form action={cancelRegistration}>
                      <input
                        type="hidden"
                        name="registration_id"
                        value={registration.id}
                      />
                      <button type="submit" className="button home-ghost-button">
                        取消报名
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyRegistrationPanel}>
            <ClipboardList aria-hidden="true" strokeWidth={1.8} />
            <div>
              <strong>你还没有报名任何活动</strong>
              <p>可以前往活动页查看正在开放报名的社区活动。</p>
            </div>
            <Link href="/events" className="button home-primary-button">
              查看活动
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
