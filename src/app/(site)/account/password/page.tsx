import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { PasswordUpdateForm } from "@/components/password-update-form";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import styles from "./account-password-page.module.css";

export const metadata: Metadata = {
  title: "设置密码",
  description: "为常州 AI Club 社区账号设置新的邮箱登录密码。",
};

export default async function AccountPasswordPage() {
  const enabled = hasSupabaseEnv();

  if (!enabled) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <p className="home-kicker">Password</p>
          <h1>账号服务暂未开放</h1>
          <p>当前账号服务暂未启用，请稍后再试。</p>
          <Link href="/login" className="button button-secondary">
            返回登录页
            <ArrowLeft aria-hidden="true" strokeWidth={1.9} />
          </Link>
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
    <div className={styles.page}>
      <section className={styles.card} aria-labelledby="password-title">
        <div className={styles.icon} aria-hidden="true">
          <ShieldCheck strokeWidth={1.9} />
        </div>
        <p className="home-kicker">Password</p>
        <h1 id="password-title">设置新的邮箱密码</h1>
        <p>
          使用找回密码邮件进入此页后，设置一个新的邮箱密码。之后你可以直接用邮箱和密码登录社区账号。
        </p>

        <PasswordUpdateForm enabled={enabled} />

        <Link href="/account" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" strokeWidth={1.9} />
          返回账号中心
        </Link>
      </section>
    </div>
  );
}
