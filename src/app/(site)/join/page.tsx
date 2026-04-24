import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { ToneBadge } from "@/components/tone-badge";
import { hasSupabaseEnv } from "@/lib/env";
import { joinSteps, memberTags } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/server";

import styles from "./join-page.module.css";

export const metadata: Metadata = {
  title: "加入我们",
  description: "了解如何加入常州 AI Club，参与线下活动、项目共建和长期协作。",
};

const onboardingPath = "/account?onboarding=1";

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export default async function JoinPage() {
  const enabled = hasSupabaseEnv();
  let isLoggedIn = false;

  if (enabled) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = Boolean(user);
  }

  const primaryHref = isLoggedIn
    ? onboardingPath
    : `/login?next=${encodeURIComponent(onboardingPath)}`;
  const primaryLabel = isLoggedIn ? "前往完善资料" : "使用 Google 登录后加入";

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Join"
        title="加入常州 AI Club"
        description="加入流程现在统一为“先登录，再完善资料”。这样你的社区身份、活动记录和个人资料都会沉淀在同一个账号里，后续也能持续更新。"
      >
        <div className="note-strip">
          无论你是开发者、产品人、创业者、高校同学、企业从业者，还是正在尝试一人产品与独立业务的实践者，都欢迎加入社区交流。
        </div>
      </PageHero>

      <section className="three-up">
        {joinSteps.map((step, index) => (
          <article className="step-card" key={step}>
            <span>0{index + 1}</span>
            <h3>{step}</h3>
          </article>
        ))}
      </section>

      <section className={cx("surface", styles.joinFormShell)}>
        <div className="section-heading">
          <p className="eyebrow">How It Works</p>
          <h2>现在的加入方式</h2>
          <p>登录后会直接进入资料完善页，必填信息更少，后续也不需要再重复填写第二套表单。</p>
        </div>

        {!enabled ? (
          <div className="note-strip">
            当前账号服务暂未启用，请稍后再试。
          </div>
        ) : null}

        <div className="cta-row">
          <Link href={primaryHref} className="button">
            {primaryLabel}
          </Link>
          <Link href="/members" className="button button-secondary">
            先看看社区成员
          </Link>
        </div>
      </section>

      <section className="field-grid">
        <article className="field-panel">
          <h3>登录后必填</h3>
          <ul className="field-list">
            <li>显示名</li>
            <li>微信号</li>
          </ul>
        </article>
        <article className="field-panel">
          <h3>可稍后补充</h3>
          <ul className="field-list">
            <li>所在城市</li>
            <li>身份 / 公司 / 学校</li>
            <li>每月可投入时间</li>
            <li>技能方向</li>
            <li>感兴趣的 AI 主题</li>
            <li>是否愿意参加线下活动</li>
            <li>是否愿意分享</li>
            <li>是否愿意参与项目</li>
          </ul>
        </article>
      </section>

      <section className="card">
        <h3>社区常见关注方向</h3>
        <div className="tag-cloud">
          {memberTags.map((tag) => (
            <ToneBadge key={tag} label={tag} />
          ))}
        </div>
      </section>
    </div>
  );
}
