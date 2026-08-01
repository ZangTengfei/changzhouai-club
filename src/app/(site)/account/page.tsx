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
  KeyRound,
  PencilLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";

import { RevealImage } from "@/components/reveal-image";
import { getWorkCoverImageUrl } from "@/lib/public-image-url";

import {
  cancelRegistration,
  deleteAccountMemberWork,
  saveAccountMemberWork,
} from "@/app/(site)/account/actions";
import { AccountActionModal } from "@/components/account-action-modal";
import { AccountProfileForm } from "@/components/account-profile-form";
import { AccountWorkDraftCleaner } from "@/components/account-work-draft-cleaner";
import { ImageUploadField } from "@/components/image-upload-field";
import { MemberAvatar } from "@/components/member-avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { WechatAuthButton } from "@/components/wechat-auth-button";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import { resolveCommunityUserId } from "@/lib/community-user";
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
import { cn } from "@/lib/utils";
import { getWechatProviderName, hasWechatOAuthEnv } from "@/lib/wechat-oauth";

import {
  accountPageClassName,
  accountPanelClassName,
  accountWorkFieldGroupClassName,
  accountWorkFieldLabelClassName,
  accountWorkFormClassName,
  accountWorkFormFooterClassName,
  accountWorkWideFieldClassName,
  disabledPanelClassName,
  statusNoteClassName,
  statusNoteErrorClassName,
} from "./account-tailwind";

const accountSectionHeadingClassName =
  "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 max-[820px]:grid-cols-1 max-[820px]:gap-3 [&_h2]:m-0 [&_h2]:text-[2rem] [&_h2]:leading-[1.1] [&_h2]:font-black [&_h2]:tracking-normal [&_h2]:text-[#111a1d] [&_div>p]:mt-2 [&_div>p]:mb-0 [&_div>p]:text-[0.98rem] [&_div>p]:leading-[1.65] [&_div>p]:font-[650] [&_div>p]:text-[rgba(var(--ink-rgb),0.64)]";
const reviewBadgeClassName =
  "inline-flex min-h-7 items-center rounded-[var(--radius-pill)] border border-transparent px-2.5 text-[0.78rem] font-black";
const emptyPanelClassName =
  "grid grid-cols-[54px_minmax(0,1fr)_auto] items-center gap-4 rounded-[var(--radius-md)] border border-dashed border-[rgba(var(--accent-rgb),0.22)] bg-[rgba(255,252,247,0.68)] p-[22px] max-lg:grid-cols-1 max-sm:[&_.button]:w-full [&>svg]:size-[42px] [&>svg]:text-primary [&_strong]:m-0 [&_strong]:text-[1.18rem] [&_strong]:text-[#111a1d] [&_p]:mt-1.5 [&_p]:mb-0 [&_p]:text-[rgba(var(--ink-rgb),0.62)] [&_.button_svg]:size-[17px]";
const reviewToneClassNames = {
  pending: "border-[rgba(238,127,24,0.18)] bg-[rgba(238,127,24,0.1)] text-[#b45f14]",
  approved: "border-[rgba(var(--accent-rgb),0.18)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent-strong)]",
  changes_requested: "border-[rgba(42,123,211,0.18)] bg-[rgba(42,123,211,0.1)] text-[#236bb8]",
  rejected: "border-[rgba(197,91,79,0.2)] bg-[rgba(197,91,79,0.1)] text-[var(--destructive)]",
} as const;

type IdentityData = Record<string, unknown>;

export const metadata: Metadata = {
  title: "账号",
  description: "查看当前登录账号、成员资料状态和活动报名记录。",
};

function formatProviderList(providers: string[]) {
  if (providers.length === 0) {
    return "邮箱登录";
  }

  return providers
    .map((provider) => {
      if (provider === getWechatProviderName()) {
        return "微信";
      }

      if (provider === "email" || provider === "password") {
        return "邮箱登录";
      }

      return provider;
    })
    .join(", ");
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

function getStringValue(data: IdentityData | null | undefined, keys: string[]) {
  if (!data) {
    return null;
  }

  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function getWechatProfile(
  wechatIdentityData: IdentityData | null | undefined,
  userMetadata: IdentityData | null | undefined,
) {
  const displayName =
    getStringValue(wechatIdentityData, ["nickname", "name", "full_name", "user_name"]) ??
    getStringValue(userMetadata, ["nickname", "name", "full_name", "user_name"]);
  const avatarUrl =
    getStringValue(wechatIdentityData, ["avatar_url", "picture"]) ??
    getStringValue(userMetadata, ["avatar_url", "picture"]);

  if (!displayName && !avatarUrl) {
    return null;
  }

  return {
    displayName: displayName ?? "微信账号",
    avatarUrl,
  };
}

function getStatusMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing_required_fields") {
    return "请先填写显示名这个必填项。";
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
    return "封面、二维码或作品链接格式无效；作品/Demo 可填写 http(s) 链接或 #小程序://名称/路径，图片和代码仓库请使用 http(s)。";
  }

  if (error === "work_save_failed") {
    return "作品保存失败，请稍后再试。";
  }

  if (error === "missing_update_fields") {
    return "请至少填写动态正文。";
  }

  if (error === "invalid_update_url") {
    return "动态里的链接格式无效，请填写以 http 或 https 开头的公开链接。";
  }

  if (error === "update_save_failed") {
    return "社区动态保存失败，请稍后再试。";
  }

  if (error === "account_recovery_invalid") {
    return "账号找回链接无效或已经过期，请重新发起找回。";
  }

  if (error === "account_recovery_failed") {
    return "账号资料合并失败，原账号资料没有被删除，请稍后重试。";
  }

  if (error === "registration_locked_after_checkin") {
    return "已经完成签到，不能再取消报名；报名与到场记录会继续保留。";
  }

  if (error === "registration_closed") {
    return "活动已经结束，不能再取消报名。";
  }

  if (error === "registration_cancel_failed") {
    return "取消报名失败，请刷新后重试。";
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
  qr_code_image_url: string | null;
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
    return reviewToneClassNames.approved;
  }

  if (status === "rejected") {
    return reviewToneClassNames.rejected;
  }

  if (status === "changes_requested") {
    return reviewToneClassNames.changes_requested;
  }

  return reviewToneClassNames.pending;
}

function WorkImageField({
  userId,
  name,
  label,
  defaultValue = "",
  uploadLabel,
  clearLabel,
  panelTitle,
  panelDescription,
  filledStatusText,
  emptyStatusText,
}: {
  userId: string;
  name: string;
  label: string;
  defaultValue?: string;
  uploadLabel: string;
  clearLabel: string;
  panelTitle: string;
  panelDescription: string;
  filledStatusText: string;
  emptyStatusText: string;
}) {
  return (
    <div className={`${accountWorkWideFieldClassName} ${accountWorkFieldGroupClassName}`}>
      <span className={accountWorkFieldLabelClassName}>{label}</span>
      <ImageUploadField
        name={name}
        defaultValue={defaultValue}
        uploadTarget={{
          kind: "member-work-asset",
          userId,
        }}
        mode="upload-or-url"
        appearance="site"
        placeholder="可上传图片，也可填写 https://..."
        uploadLabel={uploadLabel}
        clearLabel={clearLabel}
        panelTitle={panelTitle}
        panelDescription={panelDescription}
        filledStatusText={filledStatusText}
        emptyStatusText={emptyStatusText}
      />
    </div>
  );
}

const profileModalErrorCodes = new Set([
  "missing_required_fields",
  "invalid_avatar_url",
  "invalid_public_slug",
  "public_slug_taken",
  "save_failed",
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
      <div className={accountPageClassName}>
        <section className={disabledPanelClassName}>
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
  const { data: userData } = await supabase.auth.getUser();

  const user = userData.user;

  if (!user) {
    const nextPath = params.onboarding
      ? "/account?onboarding=1"
      : params.submit === "work"
        ? "/account/works/new"
        : "/account";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (params.submit === "work") {
    redirect("/account/works/new");
  }

  const communityUserId = await resolveCommunityUserId(supabase, user.id);

  const [
    { data: identityData },
    { data: communityWechatIdentities },
    { data: profile },
    { data: member },
    { data: registrations },
    { data: attendances },
    { data: works },
  ] = await Promise.all([
      supabase.auth.getUserIdentities(),
      supabase
        .from("user_identities")
        .select("identity_data")
        .eq("user_id", communityUserId)
        .eq("provider", "wechat"),
      supabase
        .from("profiles")
        .select(
          "email, display_name, public_slug, avatar_url, wechat, city, role_label, organization, monthly_time, bio, skills, interests",
        )
        .eq("id", communityUserId)
        .maybeSingle(),
      supabase
        .from("members")
        .select(
          "status, willing_to_attend, willing_to_share, willing_to_join_projects, is_publicly_visible, is_featured_on_home",
        )
        .eq("id", communityUserId)
        .maybeSingle(),
      supabase
        .from("event_registrations")
        .select(
          "id, status, note, created_at, events(id, title, event_at, city, venue, slug, status)",
        )
        .eq("user_id", communityUserId)
        .order("created_at", { ascending: false }),
      supabase
        .from("event_attendance")
        .select("event_id")
        .eq("user_id", communityUserId)
        .not("checked_in_at", "is", null),
      supabase
        .from("member_works")
        .select(
          "id, title, summary, description, work_type, status, review_status, role_label, cover_image_url, qr_code_image_url, website_url, repo_url, demo_url, tags, is_public, is_featured, updated_at",
        )
        .eq("member_id", communityUserId)
        .order("updated_at", { ascending: false }),
    ]);

  const identities = identityData?.identities ?? [];
  const providers = Array.from(
    new Set([
      ...identities.map((item) => item.provider),
      ...(communityWechatIdentities?.length ? [getWechatProviderName()] : []),
      ...(profile?.email && !identities.some((item) => item.provider === "google")
        ? ["email"]
        : []),
    ]),
  );
  const wechatIdentity = identities.find(
    (item) => item.provider === getWechatProviderName(),
  );
  const wechatEnabled = hasWechatOAuthEnv();
  const wechatLinked = Boolean(
    providers.includes(getWechatProviderName()) || communityWechatIdentities?.length,
  );
  const canRecoverOldAccount =
    communityUserId === user.id &&
    identities.some((identity) => identity.provider === getWechatProviderName());
  const wechatProfile = wechatLinked
    ? getWechatProfile(
        wechatIdentity?.identity_data as IdentityData | null | undefined,
        user.user_metadata as IdentityData | null | undefined,
      )
    : null;
  const displayName =
    profile?.display_name?.trim() || user.email?.split("@")[0] || "社区成员";
  const profileComplete = Boolean(profile?.display_name?.trim());
  const publicProfilePath = member?.is_publicly_visible
    ? getMemberPublicSlugPath({
        id: communityUserId,
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
  const checkedInEventIds = new Set(
    attendances?.map((attendance) => attendance.event_id) ?? [],
  );
  const statusMessage = getStatusMessage(params.error);
  const shouldOpenProfileModal =
    Boolean(params.onboarding) || profileModalErrorCodes.has(params.error ?? "");
  const accountSummaryItems = [
    {
      label: "资料状态",
      value: profileComplete ? "已完成" : "待完善",
      detail: profileComplete ? "可以继续补充公开资料" : "显示名为必填",
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
      detail: profile?.email ?? user.email ?? "未提供邮箱",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className={accountPageClassName}>
      <AccountWorkDraftCleaner enabled={params.updated === "work"} />

      <section className={`${accountPanelClassName} gap-[22px] items-stretch`} aria-labelledby="account-title">
        <div className="grid grid-cols-[minmax(230px,0.32fr)_minmax(0,1fr)] items-center gap-6 max-lg:grid-cols-1">
          <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] items-center gap-3.5 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.07)] bg-white/50 px-4 py-3.5 max-sm:grid-cols-1 [&_.member-avatar]:size-16 [&_.member-avatar]:rounded-[var(--radius-md)] [&_.member-avatar]:shadow-[var(--shadow-md)] max-sm:[&_.member-avatar]:size-[58px] [&_.member-avatar-fallback]:text-[1.2rem]">
            <MemberAvatar
              name={displayName}
              avatarUrl={profile?.avatar_url ?? null}
            />
            <div className="grid min-w-0 gap-1.5">
              <strong className="block overflow-hidden text-[1.08rem] leading-[1.12] font-black text-ellipsis whitespace-nowrap text-[#111b1f]">{displayName}</strong>
              <span className="block overflow-hidden text-[0.84rem] font-[750] text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.62)]">{profile?.role_label ?? "常州 AI Club 成员"}</span>
            </div>
          </div>

          <div className="grid min-w-0 gap-3">
            <p className="home-kicker">Account · 账号中心</p>
            <h1 className="m-0 text-[clamp(2rem,3.1vw,2.72rem)] leading-[1.08] font-black tracking-normal text-[#111b1f]" id="account-title">管理社区身份</h1>
            <p className="m-0 max-w-[44rem] leading-[1.72] font-[650] text-[rgba(var(--ink-rgb),0.68)]">维护成员资料、查看活动报名记录，并更新你在社区中的公开信息。</p>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(180px,auto)_minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.07)] bg-[rgba(255,252,247,0.46)] p-3.5 max-[820px]:grid-cols-1 max-sm:gap-2.5 max-sm:p-3 [&_.button]:min-h-[42px] [&_.button]:rounded-[var(--radius-sm)] [&_.button]:px-4 [&_.button]:text-[0.9rem] [&_.button]:shadow-none [&_.auth-button]:min-h-[42px] [&_.auth-button]:rounded-[var(--radius-sm)] [&_.auth-button]:px-4 [&_.auth-button]:text-[0.9rem] [&_.auth-button]:shadow-none [&_svg]:size-[17px]" aria-label="账号操作">
          <div className="flex min-w-0 flex-wrap items-center gap-2 max-sm:grid max-sm:grid-cols-1">
            <AccountActionModal
              title={profileComplete ? "编辑个人资料" : "完善加入资料"}
              description={
                profileComplete
                  ? "更新头像、公开主页链接、城市、技能标签和协作偏好。"
                  : "先填写显示名，其他公开资料可以稍后继续补充。"
              }
              defaultOpen={shouldOpenProfileModal}
              trigger={
                <button
                  type="button"
                  className="button home-primary-button min-w-[168px] justify-center max-sm:w-full"
                >
                  <PencilLine aria-hidden="true" strokeWidth={2} />
                  {profileComplete ? "编辑资料" : "完善资料"}
                </button>
              }
            >
              <AccountProfileForm
                className="grid min-w-0 gap-5 border-0! bg-transparent! p-0! shadow-none! [&_.section-heading]:max-w-none [&_.section-heading_h2]:text-[2rem] [&_.section-heading_h2]:leading-[1.1] [&_.section-heading_h2]:font-black [&_.section-heading_h2]:tracking-normal [&_.section-heading_h2]:text-[#111a1d] [&_.note-strip]:rounded-[var(--radius-md)] [&_.note-strip]:border [&_.note-strip]:border-dashed [&_.note-strip]:border-[rgba(var(--accent-rgb),0.2)] [&_.note-strip]:bg-[rgba(var(--accent-rgb),0.07)] [&_.note-strip]:font-[750] [&_.note-strip]:text-[rgba(var(--ink-rgb),0.68)] [&_.form-grid]:gap-4 max-sm:[&_.form-grid]:grid-cols-1 [&_.form-field]:min-w-0 [&_.form-field]:gap-2 [&_.form-field]:rounded-[var(--radius-md)] [&_.form-field]:border [&_.form-field]:border-[rgba(var(--ink-rgb),0.06)] [&_.form-field]:bg-[rgba(255,252,247,0.62)] [&_.form-field]:p-4 [&_.form-field-wide]:col-span-full max-sm:[&_.form-field-wide]:col-auto [&_.form-label-row]:font-[850] [&_.form-label-row]:text-[#132321] [&_.field-meta-tag]:rounded-[var(--radius-pill)] [&_.field-meta-tag]:text-[0.74rem] [&_.input]:rounded-[var(--radius-sm)] [&_.input]:border-[rgba(var(--ink-rgb),0.12)] [&_.input]:bg-white/70 [&_.textarea]:min-h-[130px] [&_.textarea]:rounded-[var(--radius-sm)] [&_.textarea]:border-[rgba(var(--ink-rgb),0.12)] [&_.textarea]:bg-white/70 [&_.checkbox-list]:grid [&_.checkbox-list]:grid-cols-3 [&_.checkbox-list]:gap-3 max-lg:[&_.checkbox-list]:grid-cols-1 [&_.checkbox-row]:items-start [&_.checkbox-row]:rounded-[var(--radius-md)] [&_.checkbox-row]:border [&_.checkbox-row]:border-[rgba(var(--ink-rgb),0.06)] [&_.checkbox-row]:bg-[rgba(255,252,247,0.62)] [&_.checkbox-row]:p-4 [&_.cta-row]:justify-start max-sm:[&_.cta-row]:w-full max-sm:[&_.cta-row_.button]:w-full"
                userId={communityUserId}
                profile={profile}
                member={member}
              />
            </AccountActionModal>
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 max-sm:grid max-sm:grid-cols-1">
            {profileComplete ? (
              <Link
                href="#registrations"
                className="button home-ghost-button border-[rgba(var(--ink-rgb),0.11)] bg-white/65 text-[rgba(var(--ink-rgb),0.76)] max-sm:w-full"
              >
                <Ticket aria-hidden="true" strokeWidth={2} />
                报名记录
              </Link>
            ) : null}
            <Link
              href="/events"
              className="button home-ghost-button border-[rgba(var(--ink-rgb),0.11)] bg-white/65 text-[rgba(var(--ink-rgb),0.76)] max-sm:w-full"
            >
              <CalendarDays aria-hidden="true" strokeWidth={2} />
              活动
            </Link>
            {publicProfilePath ? (
              <Link
                href={publicProfilePath}
                className="button home-ghost-button border-[rgba(var(--ink-rgb),0.11)] bg-white/65 text-[rgba(var(--ink-rgb),0.76)] max-sm:w-full"
              >
                <Eye aria-hidden="true" strokeWidth={2} />
                公开主页
              </Link>
            ) : null}
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 max-[820px]:justify-start max-sm:grid max-sm:grid-cols-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2 max-sm:grid max-sm:grid-cols-1">
              <WechatAuthButton
                enabled={wechatEnabled}
                mode="link"
                linked={wechatLinked}
                nextPath="/account?updated=wechat_identity"
                className="button button-secondary auth-button border-[rgba(var(--ink-rgb),0.08)] bg-white/40 text-[rgba(var(--ink-rgb),0.62)] hover:bg-white/70 hover:text-[var(--ink)] focus-visible:bg-white/70 focus-visible:text-[var(--ink)] max-sm:w-full"
              />
              {wechatProfile ? (
                <div className="grid min-h-[42px] max-w-[190px] grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-[var(--radius-sm)] border border-[rgba(var(--ink-rgb),0.07)] bg-white/50 py-1.5 pr-2.5 pl-1.5 text-[0.86rem] font-extrabold text-[rgba(var(--ink-rgb),0.72)] max-sm:w-full max-sm:max-w-none [&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap">
                  <MemberAvatar
                    name={wechatProfile.displayName}
                    avatarUrl={wechatProfile.avatarUrl}
                    size="sm"
                  />
                  <span>{wechatProfile.displayName}</span>
                </div>
              ) : null}
            </div>
            <Link
              href="/account/password"
              className="button button-secondary border-[rgba(var(--ink-rgb),0.08)] bg-white/40 text-[rgba(var(--ink-rgb),0.62)] hover:bg-white/70 hover:text-[var(--ink)] focus-visible:bg-white/70 focus-visible:text-[var(--ink)] max-sm:w-full"
            >
              <KeyRound aria-hidden="true" strokeWidth={2} />
              设置密码
            </Link>
            {canRecoverOldAccount ? (
              <Link
                href="/account/recover"
                className="button button-secondary border-[rgba(var(--ink-rgb),0.08)] bg-white/40 text-[rgba(var(--ink-rgb),0.62)] hover:bg-white/70 hover:text-[var(--ink)] focus-visible:bg-white/70 focus-visible:text-[var(--ink)] max-sm:w-full"
              >
                <ShieldCheck aria-hidden="true" strokeWidth={2} />
                找回旧账号
              </Link>
            ) : null}
            <SignOutButton enabled />
          </div>
        </div>

        <div className="col-span-full grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1" aria-label="账号概览">
          {accountSummaryItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <article className="grid min-h-[82px] min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.07)] bg-[rgba(255,252,247,0.62)] p-3.5" key={item.label}>
                <Icon className={cn("row-span-3 size-[26px]", ["text-primary", "text-[#ee7f18]", "text-[#2a7bd3]", "text-[#7d63f1]"][index])} aria-hidden="true" strokeWidth={1.9} />
                <span className="overflow-hidden text-[0.78rem] leading-[1.24] font-[850] text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.54)]">{item.label}</span>
                <strong className={cn("overflow-hidden text-[1.08rem] leading-[1.24] font-black text-ellipsis whitespace-nowrap", ["text-primary", "text-[#ee7f18]", "text-[#2a7bd3]", "text-[#7d63f1]"][index])}>{item.value}</strong>
                <small className="overflow-hidden text-[0.78rem] leading-[1.24] font-bold text-ellipsis whitespace-nowrap text-[rgba(var(--ink-rgb),0.58)]">{item.detail}</small>
              </article>
            );
          })}
        </div>
      </section>

      {params.onboarding || !profileComplete ? (
        <div className={statusNoteClassName}>
          <Sparkles aria-hidden="true" strokeWidth={1.9} />
          <span>
            先填写显示名就可以完成加入；微信号和其他资料都可以稍后继续完善。
          </span>
        </div>
      ) : null}

      {params.updated ? (
        <div className={statusNoteClassName}>
          <BadgeCheck aria-hidden="true" strokeWidth={1.9} />
          <span>
            {params.updated === "profile"
              ? "成员资料已保存。"
              : params.updated === "password"
                ? "邮箱登录密码已更新。"
              : params.updated === "wechat_identity"
                ? "微信已绑定。"
              : params.updated === "account_merged"
                ? "旧账号已找回，微信登录和原账号资料已合并。"
              : params.updated === "work"
                ? "作品已提交，等待管理员审核。"
                : params.updated === "work_deleted"
                  ? "作品已删除。"
                  : params.updated === "community_update"
                    ? "社区动态已提交，等待管理员审核。"
                    : params.updated === "community_update_deleted"
                      ? "社区动态已删除。"
                      : "活动报名状态已更新。"}
          </span>
        </div>
      ) : null}

      {statusMessage ? (
        <div className={cn(statusNoteClassName, statusNoteErrorClassName)}>
          <CircleAlert aria-hidden="true" strokeWidth={1.9} />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      <section className={`${accountPanelClassName} gap-[18px]`} id="works">
        <div className={accountSectionHeadingClassName}>
          <p className="home-kicker">Works</p>
          <div className="flex min-w-0 items-start justify-between gap-4 max-[820px]:grid max-[820px]:gap-3.5">
            <div>
              <h2>我的作品</h2>
              <p>
                可以提交你做过的产品、工具、开源项目、案例或 Demo。提交后先进入待审核状态，
                管理员通过后会展示到案例库和你的成员主页。
              </p>
            </div>
            <Link
              href="/account/works/new"
              className="button home-primary-button min-h-11 flex-none max-[820px]:w-fit max-sm:w-full"
            >
              <Plus aria-hidden="true" strokeWidth={2} />
              提交作品/案例
            </Link>
          </div>
        </div>

        {memberWorks.length > 0 ? (
          <div className="grid gap-3.5">
            {memberWorks.map((work) => (
              <article className="grid gap-3.5 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.72)] p-[18px] max-sm:[&_.button]:w-full [&>p]:m-0 [&>p]:leading-[1.58] [&>p]:text-[rgba(var(--ink-rgb),0.62)]" key={work.id}>
                <div className="grid grid-cols-[minmax(0,1fr)_86px] items-start gap-4 max-sm:grid-cols-1 [&_h3]:mt-2.5 [&_h3]:mb-0 [&_h3]:text-[1.22rem] [&_h3]:leading-[1.18] [&_p]:m-0 [&_p]:leading-[1.58] [&_p]:text-[rgba(var(--ink-rgb),0.62)] [&>img]:size-[86px] [&>img]:rounded-[var(--radius-md)] [&>img]:border [&>img]:border-[rgba(var(--ink-rgb),0.08)] [&>img]:bg-[rgba(var(--accent-rgb),0.08)] [&>img]:object-cover [&>svg]:size-[86px] [&>svg]:rounded-[var(--radius-md)] [&>svg]:border [&>svg]:border-[rgba(var(--ink-rgb),0.08)] [&>svg]:bg-[rgba(var(--accent-rgb),0.08)] [&>svg]:p-6 [&>svg]:text-primary">
                  <div>
                    <span
                      className={`${reviewBadgeClassName} ${getReviewTone(
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
                    <RevealImage
                      src={getWorkCoverImageUrl(work.cover_image_url) ?? work.cover_image_url}
                      alt=""
                    />
                  ) : (
                    <Boxes aria-hidden="true" strokeWidth={1.8} />
                  )}
                </div>

                <p>{work.summary}</p>
                {(work.tags ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {(work.tags ?? []).map((tag) => (
                      <span className="inline-flex min-h-[26px] items-center rounded-[var(--radius-pill)] border border-[rgba(var(--accent-rgb),0.12)] bg-[rgba(var(--accent-rgb),0.07)] px-[9px] text-[0.76rem] font-[850] text-[rgba(var(--ink-rgb),0.66)]" key={`${work.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                ) : null}

                <details className="pt-0.5 [&>summary]:cursor-pointer [&>summary]:py-2.5 [&>summary]:font-black [&>summary]:text-[var(--accent-strong)]">
                  <summary>修改后重新提交审核</summary>
                  <form action={saveAccountMemberWork} className={`${accountWorkFormClassName} pt-3`}>
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
                    <label className={accountWorkWideFieldClassName}>
                      <span>一句话介绍</span>
                      <textarea
                        className="input textarea"
                        name="summary"
                        defaultValue={work.summary}
                        rows={2}
                        required
                      />
                    </label>
                    <label className={accountWorkWideFieldClassName}>
                      <span>详细说明</span>
                      <textarea
                        className="input textarea"
                        name="description"
                        defaultValue={work.description ?? ""}
                        rows={4}
                      />
                    </label>
                    <WorkImageField
                      userId={communityUserId}
                      name="cover_image_url"
                      label="封面 / 产品图片"
                      defaultValue={work.cover_image_url ?? ""}
                      uploadLabel="上传图片"
                      clearLabel="清空图片"
                      panelTitle="上传案例封面或产品截图"
                      panelDescription="用于案例库卡片展示。建议上传产品界面、项目截图或品牌视觉图。"
                      filledStatusText="已设置图片"
                      emptyStatusText="当前未设置图片"
                    />
                    <WorkImageField
                      userId={communityUserId}
                      name="qr_code_image_url"
                      label="小程序码 / 二维码"
                      defaultValue={work.qr_code_image_url ?? ""}
                      uploadLabel="上传二维码"
                      clearLabel="清空二维码"
                      panelTitle="上传小程序码或二维码"
                      panelDescription="用于公开案例卡片的扫码入口，点击后会展示完整图片。"
                      filledStatusText="已设置二维码"
                      emptyStatusText="当前未设置二维码"
                    />
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
                    <label className={accountWorkWideFieldClassName}>
                      <span>标签</span>
                      <input
                        className="input"
                        name="tags"
                        defaultValue={(work.tags ?? []).join("，")}
                      />
                    </label>
                    <div className={accountWorkFormFooterClassName}>
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
          <div className={emptyPanelClassName}>
            <Boxes aria-hidden="true" strokeWidth={1.8} />
            <div>
              <strong>你还没有提交作品</strong>
              <p>可以先把自己的产品、工具、开源项目或案例补充进来，审核后进入案例库。</p>
            </div>
            <Link href="/account/works/new" className="button home-primary-button">
              <Plus aria-hidden="true" strokeWidth={2} />
              提交作品/案例
            </Link>
          </div>
        )}
      </section>

      <section className={accountPanelClassName} id="registrations">
        <div className={accountSectionHeadingClassName}>
          <p className="home-kicker">Registrations</p>
          <div>
            <h2>我报名过的活动</h2>
            <p>这里汇总你的活动报名记录，方便随时查看参与状态与活动信息。</p>
          </div>
        </div>

        {registrations && registrations.length > 0 ? (
          <div className="grid gap-3.5">
            {registrations.map((registration) => {
              const rawEvent = registration.events as
                | {
                    id: string;
                    title: string | null;
                    event_at: string | null;
                    city: string | null;
                    venue: string | null;
                    slug: string | null;
                    status: string | null;
                  }
                | {
                    id: string;
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
                <article className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 rounded-[var(--radius-md)] border border-[rgba(var(--ink-rgb),0.08)] bg-[rgba(255,252,247,0.72)] p-[18px] shadow-[var(--shadow-sm)] max-[820px]:grid-cols-[48px_minmax(0,1fr)] max-[820px]:[&_form]:col-span-full max-[820px]:[&_form_.button]:w-full" key={registration.id}>
                  <div className="grid size-12 place-items-center rounded-[var(--radius-md)] bg-[rgba(var(--accent-rgb),0.1)]">
                    <CalendarDays className="size-[26px] text-primary" aria-hidden="true" strokeWidth={1.9} />
                  </div>
                  <div>
                    <span className="inline-flex min-h-[30px] items-center rounded-[var(--radius-pill)] bg-[rgba(var(--accent-rgb),0.1)] px-2.5 text-[0.78rem] font-black text-[var(--accent-strong)]">{registration.status}</span>
                    <h3 className="mt-2 mb-0 text-[1.18rem] leading-[1.22] text-[#111a1d] [&_a]:text-inherit [&_a]:no-underline hover:[&_a]:text-primary">
                      {eventHref ? (
                        <Link href={eventHref}>{event?.title ?? "未找到活动"}</Link>
                      ) : (
                        (event?.title ?? "未找到活动")
                      )}
                    </h3>
                    <p className="mt-[7px] mb-0 text-[0.92rem] leading-[1.55] text-[rgba(var(--ink-rgb),0.62)]">{formatEventDate(event?.event_at)}</p>
                    <p className="mt-[7px] mb-0 text-[0.92rem] leading-[1.55] text-[rgba(var(--ink-rgb),0.62)]">
                      {event?.city ?? "常州"}
                      {event?.venue ? ` · ${event.venue}` : ""}
                    </p>
                    {registration.note ? <p className="mt-[7px] mb-0 text-[0.92rem] leading-[1.55] text-[rgba(var(--ink-rgb),0.62)]">报名备注：{registration.note}</p> : null}
                  </div>

                  {registration.status !== "cancelled" &&
                  event?.status === "scheduled" &&
                  !checkedInEventIds.has(event?.id ?? "") ? (
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
                  ) : registration.status !== "cancelled" &&
                    checkedInEventIds.has(event?.id ?? "") ? (
                    <span className="text-sm font-bold text-muted-foreground">
                      已签到，记录已锁定
                    </span>
                  ) : registration.status !== "cancelled" &&
                    event?.status !== "scheduled" ? (
                    <span className="text-sm font-bold text-muted-foreground">
                      活动已结束，记录已锁定
                    </span>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className={emptyPanelClassName}>
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
