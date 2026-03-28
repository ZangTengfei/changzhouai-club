import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { eventTracks } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "活动",
  description: "查看常州 AI 社区的活动方向、活动形式和近期交流安排。",
};

export default function EventsPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Events"
        title="社区活动"
        description="这里会发布即将开始的活动，也会逐步沉淀往期分享与线下交流记录。"
      >
        <div className="note-strip">
          第一版建议优先放 1-2 场确定活动，哪怕信息不多，也比空页面更有运营感。
        </div>
      </PageHero>

      <section className="card-grid">
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
      </section>

      <section className="two-up">
        <article className="card">
          <h3>建议保留的活动栏目</h3>
          <ul className="detail-list">
            <li>即将开始：未来 30 天内的活动</li>
            <li>往期回顾：照片、议题、嘉宾与资料</li>
            <li>分享招募：欢迎成员报名做主题分享</li>
          </ul>
        </article>
        <article className="card">
          <h3>活动页要解决的事</h3>
          <ul className="detail-list">
            <li>新朋友知道你们是真的在持续组织活动</li>
            <li>群成员能快速看到下一场活动入口</li>
            <li>每次活动都能变成后续传播素材</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
