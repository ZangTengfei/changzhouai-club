import Image from "next/image";
import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { archiveItems, eventRecaps } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "往期回顾",
  description: "沉淀常州 AI 社区活动照片、分享线索和后续内容资产。",
};

export default function ArchivePage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Archive"
        title="往期回顾"
        description="这部分会优先沉淀活动照片、分享主题线索和每一场活动的时间记录，帮助社区逐步形成可复用内容资产。"
      />

      <section className="card-grid">
        {archiveItems.map((item) => (
          <article className="card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="gallery-grid">
        {eventRecaps.map((item) => (
          <article className="gallery-card" key={item.isoDate}>
            <div className="gallery-media">
              <Image
                src={item.image}
                alt={item.title}
                width={item.width}
                height={item.height}
              />
            </div>
            <div className="gallery-copy">
              <h3>{item.title}</h3>
              <p>{item.date}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
