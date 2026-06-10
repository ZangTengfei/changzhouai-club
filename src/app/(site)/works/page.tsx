import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  Tags,
} from "lucide-react";

import { ExternalCaseCard, MemberWorkCard } from "@/components/member-work-card";
import { ToneBadge } from "@/components/tone-badge";
import { getPublicWorksDirectory, workTypeLabels } from "@/lib/community-works";

import styles from "./works-page.module.css";

export const metadata: Metadata = {
  title: "案例库",
  description: "查看常州 AI Club 成员公开展示的 AI 产品、工具、OPC 揭榜挂帅项目和场景实践案例。",
};

export default async function WorksPage() {
  const directory = await getPublicWorksDirectory();

  return (
    <div className={styles.worksPageStack}>
      <section className={styles.worksHero} aria-labelledby="works-hero-title">
        <div className={styles.worksHeroCopy}>
          <p className="home-kicker">Cases · 案例库</p>
          <h1 id="works-hero-title">
            看见真实问题长出的
            <span>AI 产品、工具和项目</span>
          </h1>
          <p>
            这里聚合社区成员和合作场景中公开展示的 AI 实践，不限于社区共建项目。
            它可以是一个产品、一个开源库、一段 Demo、一次服务案例，或者正在验证中的小工具。
          </p>

          <div className={styles.worksHeroActions}>
            <Link href="#works-directory" className="button home-primary-button">
              浏览案例
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
            <Link href="/account?submit=work#works" className="button home-ghost-button">
              <Plus aria-hidden="true" strokeWidth={2} />
              提交作品/案例
            </Link>
            <Link href="/members" className="button home-ghost-button">
              找到创作者
            </Link>
            <a
              href="http://abbs.fun:25181/?tab=library"
              className="button home-ghost-button"
              target="_blank"
              rel="noreferrer"
            >
              更多案例
            </a>
          </div>
        </div>
      </section>

      <section className={styles.worksDirectorySection} id="works-directory">
        <div className={styles.worksSectionHeading}>
          <p className="home-kicker">Directory</p>
          <div>
            <h2>公开案例</h2>
            <p>公开案例可以关联成员，也可以跳转到外部展示页，方便继续查看问题背景、项目资料和阶段成果。</p>
          </div>
        </div>

        <div className={styles.worksGrid}>
          {directory.externalCards.map((card) => (
            <ExternalCaseCard card={card} key={card.id} />
          ))}

          {directory.works.map((work) => (
            <div id={`work-${work.id}`} key={work.id}>
              <MemberWorkCard work={work} />
            </div>
          ))}
        </div>

        {directory.works.length === 0 && directory.externalCards.length === 0 ? (
          <div className={styles.worksEmptyNote}>
            成员提交作品或案例并通过审核后，会继续补充到这里。
          </div>
        ) : null}
      </section>

      <section className={styles.worksTypeSection}>
        <div className={styles.worksSectionHeading}>
          <p className="home-kicker">Browse</p>
          <div>
            <h2>案例类型</h2>
            <p>用更宽的口径承接成员实践，产品、工具、场景试点、服务案例和开源项目都可以展示。</p>
          </div>
        </div>

        <div className={styles.worksTypeGrid}>
          {Object.entries(workTypeLabels).map(([type, label]) => (
            <span key={type}>{label}</span>
          ))}
        </div>
      </section>

      {directory.tags.length > 0 ? (
        <section className={styles.worksTagSection}>
          <Tags aria-hidden="true" strokeWidth={1.8} />
          <div>
            <strong>案例标签</strong>
            <div>
              {directory.tags.map((tag) => (
                <ToneBadge key={tag} label={tag} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
