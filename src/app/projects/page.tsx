import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { joinSteps, opcTracks, projectStatus } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "项目共建",
  description: "了解常州 AI 社区的项目方向、共建状态与参与方式。",
};

export default function ProjectsPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Projects"
        title="项目共建"
        description="这里展示社区当前的项目状态、共建方向与参与路径。现阶段以活动交流、需求连接和成员协作为主，也持续关注 OPC、独立开发和高杠杆个体的实践机会。"
      >
        <div className="note-strip">
          社区成员已经在活动中分享自研项目、工具与实践案例。正式共建项目会在目标、负责人和参与角色明确后开放协作。
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

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">OPC Builder Track</p>
          <h2>社区正在关注的 OPC 方向</h2>
          <p>如果你在做一人产品、微型 SaaS、AI 自动化服务，或希望把个人能力变成稳定业务，这一块会尤其适合你。</p>
        </div>

        <div className="three-up">
          {opcTracks.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
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
