import type { Metadata } from "next";

import { LoginPanel } from "@/components/login-panel";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { hasSupabaseEnv } from "@/lib/env";
import {
  hasWechatOAuthEnv,
  hasWechatOfficialAccountOAuthEnv,
} from "@/lib/wechat-oauth";

import styles from "./login-page.module.css";

export const metadata: Metadata = {
  title: "登录",
  description: "使用邮箱密码登录常州 AI Club 账号。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const enabled = hasSupabaseEnv();
  const wechatEnabled = hasWechatOAuthEnv();
  const officialAccountEnabled = hasWechatOfficialAccountOAuthEnv();
  const params = await searchParams;

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.intro}>
          <div className={styles.logo} aria-hidden="true">
            <SiteLogoMark className={styles.logoMark} />
          </div>
          <div className={styles.brandNote}>
            <span>Login</span>
            <i aria-hidden="true">·</i>
            <strong>社区账号</strong>
          </div>
        </div>

        <LoginPanel
          enabled={enabled}
          wechatEnabled={wechatEnabled}
          officialAccountEnabled={officialAccountEnabled}
          nextPath={params.next ?? "/account"}
          error={params.error}
        />
      </section>
    </div>
  );
}
