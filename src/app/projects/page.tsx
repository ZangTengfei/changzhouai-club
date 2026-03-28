import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { joinSteps, projectList } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "项目共建",
  description: "围绕真实需求发起协作项目，让社区成员在实践中连接起来。",
};

export default function ProjectsPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Projects"
        title="项目共建"
        description="围绕真实需求发起协作项目，让社区成员在实践中连接起来，而不只停留在讨论层面。"
      >
        <div className="note-strip">
          第一版不用追求项目很多，优先展示 2-3 个方向清晰、角色明确的项目即可。
        </div>
      </PageHero>

      <section className="card-grid">
        {projectList.map((item) => (
          <article className="card" key={item.title}>
            <div className="pill-row">
              <span className="pill">{item.stage}</span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
            <ul className="detail-list">
              <li>当前需要：{item.roles}</li>
            </ul>
          </article>
        ))}
      </section>

      <section className="three-up">
        {joinSteps.map((step, index) => (
          <article className="step-card" key={step}>
            <span>0{index + 1}</span>
            <h3>{step}</h3>
          </article>
        ))}
      </section>
    </div>
  );
}
