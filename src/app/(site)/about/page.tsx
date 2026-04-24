import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  Network,
  Palette,
  Sparkles,
} from "lucide-react";

import { DoodleSparkles, HandDrawnArrow } from "@/components/home-visual-assets";
import { SiteLogoMark } from "@/components/site-logo-mark";

import styles from "./about-page.module.css";

export const metadata: Metadata = {
  title: "关于我们",
  description: "了解常州 AI Club 的定位、初心和长期运营方向。",
};

const designThoughts = [
  {
    title: "连接、节点、社区",
    summary: "Logo 用圆点和连线表达本地 AI 人之间不断产生的新连接。",
    icon: Network,
  },
  {
    title: "C + Z 的城市暗号",
    summary: "图形的负空间隐含 Changzhou 的 C 与 Z，也代表常州这座城市。",
    icon: CircleDot,
  },
  {
    title: "绿色到橙色的能量",
    summary: "绿色代表生长与行动，橙色代表灵感、开放和持续共创。",
    icon: Palette,
  },
] as const;

const longTermDirections = [
  {
    title: "持续线下相遇",
    summary: "让常州本地的开发者、产品人、创业者和 AI 爱好者稳定碰面。",
  },
  {
    title: "沉淀真实分享",
    summary: "把工具、项目、业务场景和一线经验沉淀成可复用的社区资产。",
  },
  {
    title: "推动项目共建",
    summary: "从一次交流延伸到 PoC、试点、成员协作和对外合作。",
  },
] as const;

export default function AboutPage() {
  return (
    <div className={styles.aboutPageStack}>
      <section className={styles.aboutHero} aria-labelledby="about-hero-title">
        <div className={styles.aboutHeroCopy}>
          <p className="home-kicker">About · 关于我们</p>
          <h1 id="about-hero-title">
            一个把人、
            <span>项目和需求重新连接起来的本地 AI 社区</span>
          </h1>
          <p>
            常州 AI Club 立足常州，面向实践与共建。我们希望把散落在不同公司、
            行业和微信群里的 AI 人重新组织起来，让分享发生、项目成形、合作落地。
          </p>

          <div className={styles.aboutHeroActions}>
            <Link href="/join" className="button home-primary-button">
              加入社区
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/events" className="button home-ghost-button">
              参加活动
            </Link>
          </div>

          <div className={styles.aboutHeroProof}>
            <Sparkles aria-hidden="true" strokeWidth={1.9} />
            <span>连接・分享・共创，是社区长期坚持的三个动作。</span>
          </div>
        </div>

        <div className={styles.brandConceptPanel} aria-label="Logo 设计理念">
          <div className={styles.brandLogoStage}>
            <div className={styles.brandLogoMark}>
              <SiteLogoMark className={styles.brandLogoImage} />
            </div>
            <strong>常州 AI Club</strong>
            <span>CHANGZHOU AI CLUB</span>
          </div>

          <div className={styles.brandFormula}>
            <span>连接</span>
            <i aria-hidden="true" />
            <span>C + Z</span>
            <i aria-hidden="true" />
            <span>社区</span>
          </div>

          <div className={styles.aboutStickyNote}>
            <span>Logo 设计</span>
            <strong>节点连接形成 CZ，也形成社区关系网</strong>
          </div>
          <DoodleSparkles className={styles.aboutHeroDoodle} />
          <HandDrawnArrow className={styles.aboutHeroArrow} />
        </div>
      </section>

      <section className={styles.identitySection}>
        <div className={styles.aboutSectionHeading}>
          <p className="home-kicker">Identity</p>
          <div>
            <h2>Logo 背后的社区理念</h2>
            <p>你给的设计理念图里最重要的不是一个图形，而是一套关于连接的解释。</p>
          </div>
        </div>

        <div className={styles.identityGrid}>
          {designThoughts.map((item, index) => {
            const Icon = item.icon;

            return (
              <article className={styles.identityCard} key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon aria-hidden="true" strokeWidth={1.8} />
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.longTermSection}>
        <div className={styles.aboutSectionHeading}>
          <p className="home-kicker">Direction</p>
          <div>
            <h2>我们希望长期形成什么</h2>
            <p>不是一次性的活动群，而是能持续沉淀内容、成员和合作机会的本地网络。</p>
          </div>
        </div>

        <div className={styles.longTermGrid}>
          {longTermDirections.map((item, index) => (
            <article className={styles.longTermCard} key={item.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.aboutJoinPanel}>
        <div>
          <p className="home-kicker">Next</p>
          <h2>如果你也在常州关注 AI，欢迎加入这张连接网络</h2>
          <p>你可以从参加活动、公开成员主页、发起合作或参与项目共建开始。</p>
        </div>

        <div className={styles.aboutJoinActions}>
          <Link href="/join" className="button home-primary-button">
            加入社区
            <ArrowRight aria-hidden="true" strokeWidth={2} />
          </Link>
          <Link href="/cooperate" className="button home-ghost-button">
            合作联系
          </Link>
        </div>
      </section>
    </div>
  );
}
