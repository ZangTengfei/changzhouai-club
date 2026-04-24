import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  IdCard,
  MessageCircle,
} from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { hasSupabaseEnv } from "@/lib/env";
import { joinSteps } from "@/lib/site-data";
import { createClient } from "@/lib/supabase/server";

import styles from "./join-page.module.css";

export const metadata: Metadata = {
  title: "加入我们",
  description: "了解如何加入常州 AI Club，参与线下活动、项目共建和长期协作。",
};

const onboardingPath = "/account?onboarding=1";

const requiredFields = [
  {
    title: "显示名",
    summary: "会出现在社区账号、报名记录和成员资料里。",
    icon: IdCard,
  },
  {
    title: "微信号",
    summary: "用于活动通知、入群邀请和后续沟通确认。",
    icon: MessageCircle,
  },
] as const;

const optionalFields = [
  "所在城市",
  "身份 / 公司 / 学校",
  "每月可投入时间",
  "技能方向",
  "感兴趣的 AI 主题",
  "是否愿意参加线下活动",
  "是否愿意分享",
  "是否愿意参与项目",
] as const;

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
  const primaryLabel = isLoggedIn ? "前往完善资料" : "登录或注册后加入";

  return (
    <div className={styles.joinPageStack}>
      <section className={styles.joinHero} aria-labelledby="join-hero-title">
        <div className={styles.joinHeroCopy}>
          <p className="home-kicker">Join · 加入社区</p>
          <h1 id="join-hero-title">
            先建立身份，
            <span>再走进真实连接</span>
          </h1>
          <p>
            加入流程已经统一为“先登录，再完善资料”。你的社区身份、活动记录和个人资料
            会沉淀在同一个账号里，后续也能持续更新。
          </p>

          <div className={styles.joinHeroActions}>
            <Link href={primaryHref} className="button home-primary-button">
              {primaryLabel}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/members" className="button home-ghost-button">
              先看看社区成员
            </Link>
          </div>

          <div className={styles.joinHeroProof}>
            <CheckCircle2 aria-hidden="true" strokeWidth={1.9} />
            <span>
              开发者、产品人、创业者、高校同学、企业从业者，以及正在尝试独立业务的实践者，
              都可以从这里加入。
            </span>
          </div>
        </div>

        <div className={styles.joinBoard} aria-label="加入流程板">
          <div className={styles.joinBoardHeader}>
            <span>Member Pass</span>
            <strong>把你的社区身份接入同一个账号</strong>
          </div>

          <div className={styles.joinPassCard}>
            <div>
              <span>Changzhou AI Club</span>
              <strong>Community Member</strong>
            </div>
            <BadgeCheck aria-hidden="true" strokeWidth={1.8} />
          </div>

          <div className={styles.joinBoardSteps}>
            {joinSteps.map((step, index) => (
              <article className={styles.joinBoardStep} key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>

          <div className={styles.joinBoardIllustration} aria-hidden="true">
            <Image
              src="/join-card.png"
              alt=""
              width={1000}
              height={1000}
              priority
            />
          </div>

          <div className={styles.joinStickyNote}>
            <span>加入原则</span>
            <strong>少填一次表，多沉淀一次真实身份</strong>
          </div>
          <DoodleSparkles className={styles.joinHeroDoodle} />
          <HandDrawnArrow className={styles.joinHeroArrow} />
        </div>
      </section>

      {!enabled ? (
        <div className={`${styles.statusNote} ${styles.statusNoteMuted}`}>
          <Clock3 aria-hidden="true" strokeWidth={1.9} />
          <span>当前账号服务暂未启用，请稍后再试。</span>
        </div>
      ) : null}

      <section className={styles.joinProfileSection}>
        <div className={styles.joinSectionHeading}>
          <p className="home-kicker">Profile</p>
          <div>
            <h2>资料先轻后完整</h2>
            <p>先完成进入社区必需的信息，其他资料可以随着活动、分享和项目逐步补上。</p>
          </div>
        </div>

        <div className={styles.profileGrid}>
          <article className={styles.requiredPanel}>
            <div>
              <p className="home-kicker">Required</p>
              <h3>登录后必填</h3>
            </div>

            <div className={styles.requiredList}>
              {requiredFields.map((item) => {
                const Icon = item.icon;

                return (
                  <div className={styles.requiredItem} key={item.title}>
                    <Icon aria-hidden="true" strokeWidth={1.8} />
                    <strong>{item.title}</strong>
                    <span>{item.summary}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className={styles.optionalPanel}>
            <div>
              <p className="home-kicker">Later</p>
              <h3>可稍后补充</h3>
            </div>

            <div className={styles.optionalList}>
              {optionalFields.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className={styles.joinCtaPanel}>
        <div>
          <p className="home-kicker">Next</p>
          <h2>准备好加入常州 AI Club 了吗？</h2>
          <p>从登录和完善资料开始，之后就可以持续报名活动、展示主页、参与分享和共建。</p>
        </div>

        <div className={styles.joinCtaActions}>
          <Link href={primaryHref} className="button home-primary-button">
            {primaryLabel}
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
          <Link href="/events" className="button home-ghost-button">
            查看近期活动
          </Link>
        </div>
      </section>
    </div>
  );
}
