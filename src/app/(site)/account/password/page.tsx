import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { PasswordUpdateForm } from "@/components/password-update-form";
import { Button } from "@/components/ui/button";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "设置密码",
  description: "为常州 AI Club 社区账号设置新的邮箱登录密码。",
};

export default async function AccountPasswordPage() {
  const enabled = hasSupabaseEnv();

  if (!enabled) {
    return (
      <div className="grid min-h-[calc(100vh-156px)] content-center justify-items-center pt-3.5 pb-8.5 max-sm:min-h-0 max-sm:pt-0 max-sm:pb-6">
        <section className="grid w-[min(100%,560px)] gap-4 rounded-lg border border-border bg-[radial-gradient(circle_at_92%_8%,rgba(var(--accent-warm-rgb),0.12),transparent_24%),rgba(var(--surface-rgb),0.9)] p-6 shadow-md max-sm:p-5 [&_h1]:m-0 [&_h1]:text-[1.55rem] [&_h1]:font-black [&_h1]:leading-[1.18] [&_p:not(.home-kicker)]:m-0 [&_p:not(.home-kicker)]:text-[0.94rem] [&_p:not(.home-kicker)]:leading-[1.72] [&_p:not(.home-kicker)]:text-muted-foreground">
          <p className="home-kicker">Password</p>
          <h1>账号服务暂未开放</h1>
          <p>当前账号服务暂未启用，请稍后再试。</p>
          <Button asChild variant="siteSecondary" size="siteDefault">
            <Link href="/login">
              返回登录页
              <ArrowLeft aria-hidden="true" strokeWidth={1.9} />
            </Link>
          </Button>
        </section>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/password");
  }

  return (
    <div className="grid min-h-[calc(100vh-156px)] content-center justify-items-center pt-3.5 pb-8.5 max-sm:min-h-0 max-sm:pt-0 max-sm:pb-6">
      <section className="grid w-[min(100%,560px)] gap-4 rounded-lg border border-border bg-[radial-gradient(circle_at_92%_8%,rgba(var(--accent-warm-rgb),0.12),transparent_24%),rgba(var(--surface-rgb),0.9)] p-6 shadow-md max-sm:p-5 [&_.auth-button]:min-h-11 [&_.auth-button]:border-primary-border [&_.auth-button]:bg-primary-strong [&_.input]:min-h-11.5 [&_.input]:rounded-md [&_.input]:bg-site-surface-soft [&_h1]:m-0 [&_h1]:text-[1.55rem] [&_h1]:font-black [&_h1]:leading-[1.18] [&_p:not(.home-kicker)]:m-0 [&_p:not(.home-kicker)]:text-[0.94rem] [&_p:not(.home-kicker)]:leading-[1.72] [&_p:not(.home-kicker)]:text-muted-foreground" aria-labelledby="password-title">
        <div className="grid size-10.5 place-items-center rounded-sm bg-primary-soft text-primary [&_svg]:size-5.5" aria-hidden="true">
          <ShieldCheck strokeWidth={1.9} />
        </div>
        <p className="home-kicker">Password</p>
        <h1 id="password-title">设置新的邮箱密码</h1>
        <p>
          使用找回密码邮件进入此页后，设置一个新的邮箱密码。之后你可以直接用邮箱和密码登录社区账号。
        </p>

        <PasswordUpdateForm enabled={enabled} />

        <Link href="/account" className="inline-flex w-fit items-center gap-2 text-[0.9rem] font-extrabold text-primary hover:text-primary-strong hover:underline hover:underline-offset-4 focus-visible:text-primary-strong focus-visible:underline focus-visible:underline-offset-4 [&_svg]:size-4.25">
          <ArrowLeft aria-hidden="true" strokeWidth={1.9} />
          返回账号中心
        </Link>
      </section>
    </div>
  );
}
