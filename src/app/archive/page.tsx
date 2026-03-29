import type { Metadata } from "next";

import { PageHero } from "@/components/page-hero";
import { getCompletedEventRecaps } from "@/lib/community-events";
import { archiveItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "往期回顾",
  description: "沉淀常州 AI 社区活动照片、分享线索和后续内容资产。",
};

export default async function ArchivePage() {
  const completedEvents = await getCompletedEventRecaps();
  const galleryItems = completedEvents.flatMap((event) =>
    event.gallery.map((image) => ({
      id: image.id,
      eventTitle: event.title,
      eventDate: event.dateLabel,
      imageUrl: image.imageUrl,
      caption: image.caption,
    })),
  );

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Archive"
        title="往期回顾"
        description={`这部分现在会自动读取 ${completedEvents.length} 场已完成活动的归档内容，沉淀照片、主题线索和每场活动的时间记录。`}
      />

      <section className="card-grid">
        {archiveItems.map((item) => (
          <article className="card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      {galleryItems.length > 0 ? (
        <section className="gallery-grid">
          {galleryItems.map((item) => (
            <article className="gallery-card" key={item.id}>
              <div className="gallery-media">
                <img src={item.imageUrl} alt={item.caption ?? item.eventTitle} loading="lazy" />
              </div>
              <div className="gallery-copy">
                <h3>{item.eventTitle}</h3>
                <p>{item.eventDate}</p>
                {item.caption && item.caption !== item.eventTitle ? <p>{item.caption}</p> : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="note-strip">
          当前数据库里还没有活动相册。导入历史活动后，这里会自动沉淀所有照片。
        </div>
      )}
    </div>
  );
}
