import type { Metadata } from "next";

import { LoginPanel } from "@/components/login-panel";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { hasSupabaseEnv } from "@/lib/env";
import {
  hasWechatOAuthEnv,
  hasWechatOfficialAccountOAuthEnv,
} from "@/lib/wechat-oauth";

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
    <div className="grid min-h-[calc(100vh-156px)] content-center pt-3.5 pb-8.5 max-sm:min-h-0 max-sm:pt-0 max-sm:pb-6">
      <section className="mx-auto grid w-[min(100%,980px)] justify-items-center gap-5.5 max-sm:gap-5">
        <div className="grid max-w-170 justify-items-center gap-3 text-center">
          <div className="grid size-19.5 place-items-center rounded-lg border border-site-border-subtle bg-site-surface-soft shadow-md max-sm:size-16.5 max-sm:rounded-md" aria-hidden="true">
            <SiteLogoMark className="size-13.5 object-contain max-sm:size-11.5" />
          </div>
          <div className="inline-flex w-fit items-baseline justify-center gap-1.75 text-primary-strong">
            <span className="text-[1.05rem] font-black leading-[1.2] max-sm:text-[0.98rem]">Login</span>
            <i className="font-black not-italic text-primary-strong/70" aria-hidden="true">·</i>
            <strong className="text-[1.05rem] font-black leading-[1.2] max-sm:text-[0.98rem]">社区账号</strong>
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
