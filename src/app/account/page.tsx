import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountProfileForm } from "@/components/account-profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { cancelRegistration } from "@/app/account/actions";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "账号",
  description: "查看当前登录账号、成员资料状态和活动报名记录。",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const enabled = hasSupabaseEnv();
  const params = await searchParams;

  if (!enabled) {
    return (
      <div className="page-stack">
        <section className="surface account-shell">
          <p className="eyebrow">Account</p>
          <h1>账号页已准备好</h1>
          <p>
            当前还没有配置 Supabase 环境变量，所以登录和账号系统暂时不会真正工作。先把
            `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
            配好后，这一页就会自动接管登录后的用户信息。
          </p>
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
    redirect("/login?next=/account");
  }

  const [{ data: profile }, { data: member }, { data: registrations }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, city, bio, skills")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("members")
        .select("status, willing_to_share, willing_to_join_projects")
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

  return (
    <div className="page-stack">
      <section className="surface account-shell">
        <p className="eyebrow">Account</p>
        <h1>社区账号中心</h1>
        <p>
          这里现在已经可以保存成员资料，并逐步沉淀你的活动报名记录。后面活动参与、分享记录和微信绑定也会继续接到这里。
        </p>
        <div className="cta-row">
          <SignOutButton enabled />
        </div>
      </section>

      {params.updated ? (
        <div className="note-strip">
          {params.updated === "profile"
            ? "成员资料已保存。"
            : "活动报名状态已更新。"}
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

        <article className="field-panel">
          <h3>当前成员状态</h3>
          <ul className="field-list">
            <li>成员状态：{member?.status ?? "pending"}</li>
            <li>愿意分享：{member?.willing_to_share ? "是" : "否"}</li>
            <li>
              愿意参与后续共建：
              {member?.willing_to_join_projects ? "是" : "否"}
            </li>
          </ul>
        </article>
      </section>

      <AccountProfileForm profile={profile} member={member} />

      <section className="surface account-shell">
        <div className="section-heading">
          <p className="eyebrow">Registrations</p>
          <h2>我报名过的活动</h2>
          <p>
            这里会显示你的活动报名记录。后面如果接上签到和分享记录，也会从这里继续往下走。
          </p>
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

              return (
                <article className="registration-card" key={registration.id}>
                  <div>
                    <h3>{event?.title ?? "未找到活动"}</h3>
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
            你还没有报名任何活动。后面只要数据库里新增了 `scheduled`
            状态的活动，登录后就可以直接在活动页完成报名。
          </div>
        )}
      </section>
    </div>
  );
}
