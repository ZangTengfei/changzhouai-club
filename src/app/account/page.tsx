import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "账号",
  description: "查看当前登录账号、成员资料状态和后续微信绑定预留。",
};

export default async function AccountPage() {
  const enabled = hasSupabaseEnv();

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

  const [{ data: profile }, { data: member }] = await Promise.all([
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
  ]);

  const identities = identityData?.identities ?? [];

  return (
    <div className="page-stack">
      <section className="surface account-shell">
        <p className="eyebrow">Account</p>
        <h1>社区账号中心</h1>
        <p>
          这里已经预留了账号和成员资料的位置。后面我们会继续把活动报名、参加记录、分享意愿和微信绑定都收进来。
        </p>
        <div className="cta-row">
          <SignOutButton enabled />
        </div>
      </section>

      <section className="two-up">
        <article className="field-panel">
          <h3>基础账号</h3>
          <ul className="field-list">
            <li>用户 ID：{user.id}</li>
            <li>邮箱：{user.email ?? "未提供"}</li>
            <li>当前登录方式：{identities.map((item) => item.provider).join(", ") || "Google"}</li>
          </ul>
        </article>

        <article className="field-panel">
          <h3>成员资料预览</h3>
          <ul className="field-list">
            <li>显示名：{profile?.display_name ?? "待完善"}</li>
            <li>城市：{profile?.city ?? "待完善"}</li>
            <li>个人简介：{profile?.bio ?? "待完善"}</li>
            <li>技能标签：{profile?.skills?.join(" / ") ?? "待完善"}</li>
          </ul>
        </article>
      </section>

      <section className="three-up">
        <article className="step-card">
          <span>01</span>
          <h3>补充成员资料</h3>
          <p>
            后面可以把昵称、城市、技能标签、分享方向和参与意愿都放到这个账号体系里。
          </p>
        </article>
        <article className="step-card">
          <span>02</span>
          <h3>记录社区参与</h3>
          <p>
            活动报名、到场记录、分享主题和合作参与，都可以逐步和当前用户账号关联起来。
          </p>
        </article>
        <article className="step-card">
          <span>03</span>
          <h3>预留微信绑定</h3>
          <p>
            当前成员状态：{member?.status ?? "pending"}。后续建议在这里增加微信扫码绑定入口，把微信身份挂到同一个用户上。
          </p>
        </article>
      </section>
    </div>
  );
}
