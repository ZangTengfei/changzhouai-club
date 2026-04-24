import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";

import { cancelRegistration } from "@/app/(site)/account/actions";
import { AccountProfileForm } from "@/components/account-profile-form";
import { MemberAvatar } from "@/components/member-avatar";
import { SignOutButton } from "@/components/sign-out-button";
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

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

  return "资料保存失败，请稍后再试。";
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string; onboarding?: string }>;
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
    const nextPath = params.onboarding ? "/account?onboarding=1" : "/account";
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const [{ data: profile }, { data: member }, { data: registrations }] =
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
  const activeRegistrationCount =
    registrations?.filter((item) => item.status !== "cancelled").length ?? 0;
  const statusMessage = getStatusMessage(params.error);
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
            {profileComplete ? (
              <Link href="#registrations" className="button home-primary-button">
                查看报名记录
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            ) : (
              <Link href="#profile" className="button home-primary-button">
                完善资料
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            )}
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

      <div id="profile">
        <AccountProfileForm
          className={styles.accountProfileForm}
          userId={user.id}
          profile={profile}
          member={member}
          publicProfilePath={publicProfilePath}
        />
      </div>

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
