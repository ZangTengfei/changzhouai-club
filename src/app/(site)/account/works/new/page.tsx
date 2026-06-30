import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CircleAlert } from "lucide-react";

import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import styles from "../../account-page.module.css";
import { AccountWorkSubmitForm } from "./account-work-submit-form";

export const metadata: Metadata = {
  title: "提交作品/案例",
  description: "向常州 AI Club 案例库提交产品、工具、开源项目、案例或 Demo。",
};

function getWorkErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "missing_work_fields") {
    return "请至少填写作品名称和一句话介绍。";
  }

  if (error === "invalid_work_url") {
    return "封面、二维码或作品链接格式无效；作品/Demo 可填写 http(s) 链接或 #小程序://名称/路径，图片和代码仓库请使用 http(s)。";
  }

  if (error === "work_save_failed") {
    return "作品保存失败，请稍后再试。";
  }

  return "作品保存失败，请稍后再试。";
}

export default async function NewAccountWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const enabled = hasSupabaseEnv();
  const params = await searchParams;

  if (!enabled) {
    return (
      <div className={styles.accountPage}>
        <section className={styles.disabledPanel}>
          <p className="home-kicker">Works · 案例提交</p>
          <h1>账号服务暂未开放</h1>
          <p>当前账号服务暂未启用，请稍后再试。</p>
          <Link href="/login" className="button home-primary-button">
            返回登录页
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
    redirect(`/login?next=${encodeURIComponent("/account/works/new")}`);
  }

  const statusMessage = getWorkErrorMessage(params.error);

  return (
    <div className={styles.accountPage}>
      <section className={styles.accountWorkSubmitSection} aria-labelledby="work-submit-title">
        <div className={styles.accountWorkSubmitHeader}>
          <div>
            <p className="home-kicker">Works · 案例提交</p>
            <h1 id="work-submit-title">提交作品/案例</h1>
            <p>
              产品、工具、开源项目、服务案例或 Demo 都可以提交。审核通过后会展示到案例库和你的成员主页。
            </p>
          </div>
          <Link href="/account#works" className="button home-ghost-button">
            <ArrowLeft aria-hidden="true" strokeWidth={2} />
            返回我的作品
          </Link>
        </div>

        {statusMessage ? (
          <div className={`${styles.statusNote} ${styles.statusNoteError}`}>
            <CircleAlert aria-hidden="true" strokeWidth={1.9} />
            <span>{statusMessage}</span>
          </div>
        ) : null}

        <AccountWorkSubmitForm userId={user.id} />
      </section>
    </div>
  );
}
