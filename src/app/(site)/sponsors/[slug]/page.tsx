import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicSponsorBySlug } from "@/lib/sponsors";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sponsor = await getPublicSponsorBySlug(slug);

  if (!sponsor) {
    return {
      title: "赞助者详情",
      description: "查看常州 AI Club 赞助者信息。",
    };
  }

  return {
    title: `${sponsor.name} · 赞助者`,
    description: sponsor.summary,
  };
}

export default async function SponsorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sponsor = await getPublicSponsorBySlug(slug);

  if (!sponsor) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="surface sponsor-detail-hero">
        <div className="sponsor-detail-copy">
          <div className="pill-row">
            <span className="pill">{sponsor.tierLabel}</span>
            <span className="pill">{sponsor.sponsorLabel}</span>
            <span className="pill">赞助者</span>
            <span className="pill">{sponsor.images.length} 张图片</span>
          </div>

          <div>
            <p className="eyebrow">Sponsor</p>
            <h1>{sponsor.name}</h1>
          </div>

          <p className="sponsor-detail-summary">{sponsor.summary}</p>

          <div className="cta-row">
            <Link href="/" className="button button-secondary">
              返回首页
            </Link>
            {sponsor.websiteUrl ? (
              <Link
                href={sponsor.websiteUrl}
                className="button"
                target="_blank"
                rel="noreferrer"
              >
                访问官网
              </Link>
            ) : null}
          </div>
        </div>

        <div className="sponsor-logo-panel">
          {sponsor.logoUrl ? (
            <img
              src={sponsor.logoUrl}
              alt={`${sponsor.name} Logo`}
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div className="sponsor-logo-fallback">Logo 待补充</div>
          )}
        </div>
      </section>

      <section className="two-up">
        <article className="card sponsor-detail-panel">
          <div className="section-heading">
            <p className="eyebrow">Profile</p>
            <h2>赞助者信息</h2>
          </div>

          {sponsor.descriptionParagraphs.length > 0 ? (
            <div className="sponsor-detail-richtext">
              {sponsor.descriptionParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <div className="note-strip">
              暂未补充更详细的赞助者介绍，后续可在后台继续维护。
            </div>
          )}
        </article>

        <article className="card sponsor-detail-panel">
          <div className="section-heading">
            <p className="eyebrow">Support</p>
            <h2>共建关系</h2>
          </div>

          <ul className="detail-list">
            <li>展示名称：{sponsor.name}</li>
            <li>赞助等级：{sponsor.tierLabel}</li>
            <li>赞助标签：{sponsor.sponsorLabel}</li>
            <li>展示排序：{sponsor.displayOrder}</li>
            <li>赞助者链接：/sponsors/{sponsor.slug}</li>
          </ul>
        </article>
      </section>

      {sponsor.images.length > 0 ? (
        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Gallery</p>
            <h2>赞助者图片</h2>
            <p>展示赞助者相关图片、空间、活动支持或共建现场。</p>
          </div>

          <div className="gallery-grid">
            {sponsor.images.map((image) => (
              <article className="gallery-card" key={image.id}>
                <div className="gallery-media">
                  <img src={image.imageUrl} alt={image.caption ?? sponsor.name} loading="lazy" />
                </div>
                <div className="gallery-copy">
                  <h3>{sponsor.name}</h3>
                  {image.caption ? <p>{image.caption}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
