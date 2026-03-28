import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { archiveItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "往期回顾",
  description: "沉淀常州 AI 社区的活动回顾、分享记录与项目里程碑。",
};

export default function ArchivePage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Archive"
        title="往期回顾"
        description="这部分会逐步沉淀活动照片、分享主题、资料链接和项目里程碑，帮助社区形成可复用内容资产。"
      />

      <section className="card-grid">
        {archiveItems.map((item) => (
          <article className="card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
