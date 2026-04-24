import type { Metadata } from "next";

import { LoginPanel } from "@/components/login-panel";
import { PageHero } from "@/components/page-hero";
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
    <div className="page-stack">
      <PageHero
        eyebrow="Login"
        title="登录社区账号"
        description="登录社区账号后，可完善个人资料、查看活动记录，并参与更多社区互动。"
      >
        <div className="note-strip">
          通过社区账号统一管理个人资料、活动记录与协作信息。
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
