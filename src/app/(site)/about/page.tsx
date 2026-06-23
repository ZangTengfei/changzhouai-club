import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  Network,
  Palette,
  Sparkles,
} from "lucide-react";

import { DoodleSparkles } from "@/components/home-visual-assets";
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
    title: "让真实问题进入社区",
    summary: "从成员实践、企业场景和线下活动里持续发现值得验证的 AI 问题。",
  },
  {
    title: "让共建协作形成原型",
    summary: "把 OPC、开发者、产品人、场景方和内容运营组织到具体任务里。",
  },
  {
    title: "让试点经验变成资产",
    summary: "从一次交流延伸到 PoC、案例复盘、交付模板和可复用社区文档。",
  },
] as const;

export default function AboutPage() {
  return (
    <div className={styles.aboutPageStack}>
      <section className={styles.aboutHero} aria-labelledby="about-hero-title">
        <div className={styles.aboutHeroCopy}>
          <p className="home-kicker">About · 关于我们</p>
          <h1 id="about-hero-title">
            一个把真实问题、
            <span>AI 能力和本地场景连接起来的社区</span>
          </h1>
          <p>
            常州 AI Club 立足常州，面向实践与共建。我们希望把散落在不同公司、
            行业和微信群里的 AI 人组织到同一个现场，让问题被看见、原型被做出、
            试点被推进，经验被沉淀。
          </p>

          <div className={styles.aboutHeroActions}>
            <Link href="/join" className="button home-primary-button">
              申请加入
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/events" className="button home-ghost-button">
              参加活动
            </Link>
          </div>

          <div className={styles.aboutHeroProof}>
            <Sparkles aria-hidden="true" strokeWidth={1.9} />
            <span>连接・验证・共创，是社区长期坚持的三个动作。</span>
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
        </div>
      </section>

      <section className={styles.identitySection}>
        <div className={styles.aboutSectionHeading}>
          <p className="home-kicker">Identity</p>
          <div>
            <h2>Logo 背后的社区理念</h2>
            <p>这套标识的核心不是图形本身，而是一套关于连接的解释。</p>
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
            <p>不是一次性的活动群，而是能持续沉淀问题、成员、项目和方法的本地网络。</p>
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
          <h2>如果你也在常州关注 AI，欢迎把问题和能力带进来</h2>
          <p>你可以从参加活动、公开成员主页、提交真实场景或参与项目协作开始。</p>
        </div>

        <div className={styles.aboutJoinActions}>
          <Link href="/join" className="button home-primary-button">
            申请加入
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
