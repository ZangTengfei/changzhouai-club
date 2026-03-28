import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import {
  communityStats,
  cooperationAreas,
  eventTracks,
  homeHighlights,
  joinSteps,
  memberTags,
  projectList,
} from "@/lib/site-data";

export default function HomePage() {
  return (
    <div className="page-stack">
      <section className="hero surface">
        <div className="hero-copy">
          <p className="eyebrow">Changzhou AI Club</p>
          <h1>常州本地 AI 开发者社区</h1>
          <p>
            连接常州的开发者、产品人、创业者与企业需求，定期组织线下交流、主题分享与项目共建。
          </p>

          <div className="cta-row">
            <Link href="/join" className="button">
              立即加入社群
            </Link>
            <Link href="/events" className="button button-secondary">
              查看近期活动
            </Link>
          </div>

          <div className="stat-grid">
            {communityStats.map((item) => (
              <div className="metric-card" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="hero-panel">
          <p className="eyebrow">为什么现在做</p>
          <h2>让群聊之外的连接继续发生</h2>
          <p>
            第一版网站重点服务三类事情：活动导流、项目共建、合作承接。它不是一张漂亮名片，而是一套让社群持续运转的入口系统。
          </p>
          <div className="detail-pills">
            <span>线下活动</span>
            <span>项目机会</span>
            <span>本地合作</span>
          </div>
          <div className="hero-note">
            当前版本先把结构和文案搭稳，下一轮可继续接活动详情、报名表单和内容沉淀。
          </div>
        </aside>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="我们在做什么"
          title="把本地的 AI 人连接起来，把交流变成共建"
          description="社区的重点不是堆功能，而是持续组织真实的人、真实的活动和真实的需求，形成长期可复用的协作机制。"
        />
        <div className="card-grid">
          {homeHighlights.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="近期活动"
          title="先从线下见面开始，再把讨论留在社区里"
          description="第一版活动页会同时承担报名入口和内容沉淀的职责，帮助新朋友了解社区，也方便老成员持续回流。"
        />
        <div className="card-grid">
          {eventTracks.map((item) => (
            <article className="card" key={item.title}>
              <div className="pill-row">
                <span className="pill">{item.status}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <div className="detail-pills">
                {item.details.map((detail) => (
                  <span key={detail}>{detail}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="项目共建"
          title="围绕真实需求，把有兴趣的人聚到同一张桌子上"
          description="这一页不追求项目数量，而是优先展示适合社区协作、能够快速验证价值的方向。"
        />
        <div className="card-grid">
          {projectList.map((item) => (
            <article className="card" key={item.title}>
              <div className="pill-row">
                <span className="pill">{item.stage}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <ul className="detail-list">
                <li>招募角色：{item.roles}</li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="成员地图"
          title="社区成员来自不同角色，但会在同一类问题上协作"
          description="第一版先做能力标签和参与方向展示，不急着做公开名录，让成员能力先被看见。"
        />
        <div className="tag-cloud">
          {memberTags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="加入方式"
          title="从加入社群到参与活动，再到项目协作"
          description="把转化路径做短，让新成员一眼就知道自己接下来能做什么。"
        />
        <div className="three-up">
          {joinSteps.map((step, index) => (
            <article className="step-card" key={step}>
              <span>0{index + 1}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <SectionHeading
          eyebrow="合作联系"
          title="欢迎企业、机构、园区与高校一起合作"
          description="如果你有分享、培训、PoC、项目协作或人才连接需求，这个网站也会成为合作入口。"
        />
        <div className="two-up">
          <article className="card">
            <h3>可合作方向</h3>
            <div className="tag-cloud">
              {cooperationAreas.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
          <article className="card">
            <h3>建议的首要动作</h3>
            <p>
              如果你现在就要开始使用这套站点，建议优先补上二维码、活动真实时间和合作联系人，这样首页就已经具备对外传播能力。
            </p>
            <div className="cta-row">
              <Link href="/cooperate" className="button">
                查看合作页
              </Link>
              <Link href="/about" className="button button-secondary">
                了解社区定位
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
