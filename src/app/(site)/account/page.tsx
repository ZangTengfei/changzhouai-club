import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountProfileForm } from "@/components/account-profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { cancelRegistration } from "@/app/(site)/account/actions";
import { hasSupabaseEnv } from "@/lib/env";
import { getMemberPublicSlugPath } from "@/lib/member-public-slug";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "账号",
  description: "查看当前登录账号、成员资料状态和活动报名记录。",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string; onboarding?: string }>;
}) {
  const enabled = hasSupabaseEnv();
  const params = await searchParams;

  if (!enabled) {
    return (
      <div className="page-stack">
        <section className="surface account-shell">
          <p className="eyebrow">Account</p>
          <h1>账号服务暂未开放</h1>
          <p>当前账号服务暂未启用，请稍后再试。</p>
          <div className="cta-row">
            <Link href="/login" className="button">
              返回登录页
            </Link>
          </div>
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
  const profileComplete = Boolean(
    profile?.display_name?.trim() && profile?.wechat?.trim(),
  );
  const publicProfilePath = member?.is_publicly_visible
    ? getMemberPublicSlugPath({
        id: user.id,
        publicSlug: profile?.public_slug ?? null,
      })
    : null;

  return (
    <div className="page-stack">
      <section className="surface account-shell">
        <p className="eyebrow">Account</p>
        <h1>社区账号中心</h1>
        <p>
          在这里维护成员资料、查看活动报名记录，并持续沉淀你在社区中的参与信息。
        </p>
        <div className="cta-row">
          <SignOutButton enabled />
        </div>
      </section>

      {params.onboarding || !profileComplete ? (
        <div className="note-strip">
          先补完显示名和微信号这两个必填项，就可以完成加入；其他资料都可以稍后继续完善。
        </div>
      ) : null}

      {params.updated ? (
        <div className="note-strip">
          {params.updated === "profile"
            ? "成员资料已保存。"
            : "活动报名状态已更新。"}
        </div>
      ) : null}

      {params.error ? (
        <div className="note-strip">
          {params.error === "missing_required_fields"
            ? "请先填写显示名和微信号这两个必填项。"
            : params.error === "invalid_avatar_url"
              ? "头像地址格式无效，请填写以 http 或 https 开头的公开图片地址。"
              : params.error === "invalid_public_slug"
                ? "个人主页链接无效，请使用 3-32 位小写英文、数字或短横线，且不要使用保留词。"
                : params.error === "public_slug_taken"
                  ? "这个个人主页链接已经被占用，请换一个。"
              : "资料保存失败，请稍后再试。"}
        </div>
      ) : null}

      <section className="two-up">
        <article className="field-panel">
          <h3>基础账号</h3>
          <ul className="field-list">
            <li>用户 ID：{user.id}</li>
            <li>邮箱：{user.email ?? "未提供"}</li>
            <li>
              当前登录方式：
              {identities.map((item) => item.provider).join(", ") || "Google"}
            </li>
          </ul>
        </article>
      </section>

      <AccountProfileForm
        userId={user.id}
        profile={profile}
        member={member}
        publicProfilePath={publicProfilePath}
      />

      <section className="surface account-shell">
        <div className="section-heading">
          <p className="eyebrow">Registrations</p>
          <h2>我报名过的活动</h2>
          <p>这里汇总你的活动报名记录，方便随时查看参与状态与活动信息。</p>
        </div>

        {registrations && registrations.length > 0 ? (
          <div className="registration-list">
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
                <article className="registration-card" key={registration.id}>
                  <div>
                    <h3>
                      {eventHref ? (
                        <Link href={eventHref}>{event?.title ?? "未找到活动"}</Link>
                      ) : (
                        (event?.title ?? "未找到活动")
                      )}
                    </h3>
                    <p>
                      报名状态：{registration.status}
                      {event?.event_at
                        ? ` · 活动时间：${new Date(event.event_at).toLocaleString("zh-CN")}`
                        : ""}
                    </p>
                    <p>
                      地点：{event?.city ?? "常州"}
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
                      <button type="submit" className="button button-secondary">
                        取消报名
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="note-strip">
            你还没有报名任何活动，可以前往活动页查看正在开放报名的社区活动。
          </div>
        )}
      </section>
    </div>
  );
}
