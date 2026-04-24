import type { Metadata } from "next";

import { LoginPanel } from "@/components/login-panel";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "登录",
  description: "使用邮箱或 Google 登录常州 AI Club 账号。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const enabled = hasSupabaseEnv();
  const params = await searchParams;

  return (
    <div className="login-page login-page-focused">
      <section className="login-focus-shell">
        <div className="login-focus-intro">
          <div className="login-focus-logo" aria-hidden="true">
            <SiteLogoMark className="login-focus-logo-mark" />
          </div>
          <p className="home-kicker">Login · 社区账号</p>
          <h1>登录社区账号</h1>
          <p>
            使用同一个账号管理成员资料、活动报名和共建记录，让每一次参与都沉淀在你的社区身份里。
          </p>
        </div>

        <LoginPanel
          enabled={enabled}
          nextPath={params.next ?? "/account"}
          error={params.error}
        />
      </section>
    </div>
  );
}
