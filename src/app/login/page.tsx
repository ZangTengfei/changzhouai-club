import type { Metadata } from "next";

import { LoginPanel } from "@/components/login-panel";
import { PageHero } from "@/components/page-hero";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "登录",
  description: "使用 Google 登录常州 AI 社区，后续可继续补充成员资料和绑定微信。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const enabled = hasSupabaseEnv();
  const params = await searchParams;

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Login"
        title="登录社区账号"
        description="先把统一用户体系搭起来，后续成员资料、活动报名、分享记录和微信绑定都会从这里继续生长。"
      >
        <div className="note-strip">
          第一阶段先接 Google 登录，这是当前最稳、开发成本也最低的起点。
        </div>
      </PageHero>

      <LoginPanel
        enabled={enabled}
        nextPath={params.next ?? "/account"}
        error={params.error}
      />
    </div>
  );
}
