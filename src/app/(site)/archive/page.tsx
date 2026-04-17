import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { getCompletedEventRecaps } from "@/lib/community-events";
import { archiveItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "往期回顾",
  description: "回顾常州 AI 社区的活动照片、分享主题与现场记录。",
};

export default async function ArchivePage() {
  const completedEvents = await getCompletedEventRecaps();
  const galleryItems = completedEvents.flatMap((event) =>
    event.gallery.map((image) => ({
      id: image.id,
      eventSlug: event.slug,
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
        description={`这里汇集了 ${completedEvents.length} 场已归档活动的照片、主题线索与时间记录，方便了解社区的交流内容与活动节奏。`}
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
                <h3>
                  <Link href={`/events/${item.eventSlug}`}>{item.eventTitle}</Link>
                </h3>
                <p>{item.eventDate}</p>
                {item.caption && item.caption !== item.eventTitle ? <p>{item.caption}</p> : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="note-strip">
          活动相册整理完成后，会在这里持续展示社区的现场照片与回顾内容。
        </div>
      )}
    </div>
  );
}
