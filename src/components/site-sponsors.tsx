import Link from "next/link";

import { getPublicSponsors } from "@/lib/sponsors";

export async function SiteSponsors() {
  const sponsors = await getPublicSponsors();
  const featuredSponsors = sponsors.filter((sponsor) => sponsor.tier === "core");
  const compactSponsors = sponsors.filter((sponsor) => sponsor.tier !== "core");

  return (
    <section className="site-sponsors" aria-labelledby="site-sponsors-title">
      <div className="footer-sponsors">
        <div className="footer-sponsors-header">
          <p className="eyebrow">Sponsors</p>
          <h4 id="site-sponsors-title">赞助者</h4>
          <p>感谢支持常州本地 AI 社区持续连接、组织活动与推动共建。</p>
        </div>

        {featuredSponsors.length > 0 ? (
          <div className="footer-sponsor-featured-list">
            {featuredSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/sponsors/${sponsor.slug}`}
                className="footer-sponsor-card"
              >
                <div className="footer-sponsor-brand">
                  {sponsor.logoUrl ? (
                    <div className="footer-sponsor-logo-mark" aria-label={`${sponsor.name} Logo`}>
                      <img src={sponsor.logoUrl} alt={`${sponsor.name} Logo`} loading="lazy" />
                    </div>
                  ) : null}
                  <div>
                    <p className="footer-sponsor-label">{sponsor.tierLabel}</p>
                    <h5>{sponsor.name}</h5>
                  </div>
                </div>
                <p>{sponsor.summary}</p>
              </Link>
            ))}
          </div>
        ) : null}

        {compactSponsors.length > 0 ? (
          <div className="footer-sponsor-logo-wall" aria-label="更多赞助者">
            {compactSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/sponsors/${sponsor.slug}`}
                className="footer-sponsor-logo-tile"
                aria-label={`${sponsor.name}，${sponsor.tierLabel}`}
                title={`${sponsor.name} · ${sponsor.tierLabel}`}
              >
                {sponsor.logoUrl ? (
                  <img src={sponsor.logoUrl} alt={`${sponsor.name} Logo`} loading="lazy" />
                ) : (
                  <span>{sponsor.name}</span>
                )}
                {sponsor.tier === "partner" ? <strong>{sponsor.name}</strong> : null}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
