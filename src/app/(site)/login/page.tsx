import type { Metadata } from "next";
import { BadgeCheck, CalendarDays, ShieldCheck } from "lucide-react";

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
    <div className="login-page">
      <section className="login-hero">
        <div className="login-hero-copy">
          <p className="home-kicker">Login · 社区账号</p>
          <h1>
            回到你的
            <span>常州 AI Club</span>
          </h1>
          <p>
            使用同一个账号管理成员资料、活动报名和共建记录，让每一次参与都沉淀在你的社区身份里。
          </p>

          <div className="login-proof-grid">
            <span>
              <BadgeCheck aria-hidden="true" strokeWidth={1.9} />
              资料持续更新
            </span>
            <span>
              <CalendarDays aria-hidden="true" strokeWidth={1.9} />
              活动记录归档
            </span>
            <span>
              <ShieldCheck aria-hidden="true" strokeWidth={1.9} />
              后台权限识别
            </span>
          </div>
        </div>

        <div className="login-brand-card" aria-hidden="true">
          <div className="login-brand-mark">
            <SiteLogoMark className="login-brand-logo" />
          </div>
          <strong>常州 AI Club</strong>
          <span>连接・分享・共创</span>
          <div className="login-brand-nodes">
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <LoginPanel
        enabled={enabled}
        nextPath={params.next ?? "/account"}
        error={params.error}
      />
    </div>
  );
}
