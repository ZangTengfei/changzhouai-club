import Image from "next/image";
import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { eventRecaps } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "活动",
  description: "查看常州 AI 社区已经举办的 6 场线下活动和现场回顾。",
};

export default function EventsPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Events"
        title="社区活动"
        description="截至 2026 年 3 月 29 日，社区已经完成 6 场线下交流。这里先把活动照片和每场活动的状态沉淀下来。"
      >
        <div className="note-strip">
          这页现在主打真实回顾。后续你只要继续补活动标题、主题和分享要点，它就会越来越有内容密度。
        </div>
      </PageHero>

      <section className="event-list">
        {eventRecaps
          .slice()
          .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
          .map((item) => (
            <article className="event-feature" key={item.isoDate}>
              <div className="event-feature-media">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={item.width}
                  height={item.height}
                />
              </div>
              <div className="event-feature-copy">
                <div className="pill-row">
                  <span className="pill">{item.date}</span>
                  <span className="pill">已完成</span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <div className="detail-pills">
                  {item.highlights.map((highlight) => (
                    <span key={highlight}>{highlight}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
      </section>

      <section className="two-up">
        <article className="card">
          <h3>这一页现在最有价值的地方</h3>
          <ul className="detail-list">
            <li>访客能一眼确认社区不是空站，而是真的持续在线下活动</li>
            <li>新成员可以快速感受到社区的真实氛围和线下频率</li>
            <li>每一场活动都能逐步变成后续传播素材</li>
          </ul>
        </article>
        <article className="card">
          <h3>后续还可以继续补什么</h3>
          <ul className="detail-list">
            <li>每场活动的主题关键词</li>
            <li>现场分享人的名字或方向</li>
            <li>当场讨论过的 2-3 个话题</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
