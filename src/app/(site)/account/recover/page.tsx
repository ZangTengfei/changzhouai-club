import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { WechatAccountRecoveryForm } from "@/components/wechat-account-recovery-form";
import { isWechatAuthUser } from "@/lib/account-recovery";
import { resolveCommunityUserId } from "@/lib/community-user";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import {
  accountPageClassName,
  accountWorkSubmitHeaderClassName,
  accountWorkSubmitSectionClassName,
} from "../account-tailwind";

export const metadata: Metadata = {
  title: "找回旧账号",
  description: "通过已验证邮箱找回并合并原 Google 账号资料。",
};

export default async function RecoverAccountPage() {
  if (!hasSupabaseEnv()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/recover");
  }

  const canonicalUserId = await resolveCommunityUserId(supabase, user.id);
  if (!isWechatAuthUser(user) || canonicalUserId !== user.id) {
    redirect("/account");
  }

  return (
    <div className={accountPageClassName}>
      <section className={accountWorkSubmitSectionClassName}>
        <div className={accountWorkSubmitHeaderClassName}>
          <div>
            <p className="home-kicker">Account recovery · 账号找回</p>
            <h1>找回原 Google 账号</h1>
            <p>
              验证原账号邮箱后，我们会先展示两边资料，再由你确认合并。原账号会成为主账号，微信作为新的登录方式。
            </p>
          </div>
          <Link href="/account" className="button home-ghost-button">
            <ArrowLeft aria-hidden="true" strokeWidth={2} />
            返回账号中心
          </Link>
        </div>

        <div className="note-strip">
          <ShieldCheck aria-hidden="true" strokeWidth={1.9} />
          <span>只有完成邮箱验证后才能查看或合并旧账号资料。</span>
        </div>

        <WechatAccountRecoveryForm />
      </section>
    </div>
  );
}
