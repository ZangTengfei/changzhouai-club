import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { joinSteps, projectStatus } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "项目共建",
  description: "查看常州 AI 社区当前的项目状态，以及后续项目共建会如何自然长出来。",
};

export default function ProjectsPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Projects"
        title="项目共建"
        description="截至 2026 年 3 月 29 日，社区还没有正式公开招募的共建项目。这一页会诚实展示当前状态，而不是提前包装。"
      >
        <div className="note-strip">
          目前更真实的情况是：活动里已经开始出现成员自研项目的分享，但还没进入正式的社区项目阶段。
        </div>
      </PageHero>

      <section className="card-grid">
        {projectStatus.map((item) => (
          <article className="card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
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
