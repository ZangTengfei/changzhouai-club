import Link from "next/link";

import { getPublicSponsors } from "@/lib/sponsors";

export async function SiteSponsors() {
  const sponsors = await getPublicSponsors();
  const featuredSponsors = sponsors.filter((sponsor) => sponsor.tier === "core");
  const compactSponsors = sponsors.filter((sponsor) => sponsor.tier !== "core");

  return (
    <section className="site-sponsors" aria-labelledby="site-sponsors-title">
      <div className="home-sponsor-showcase">
        <div className="home-card-heading home-showcase-heading">
          <div>
            <h2 id="site-sponsors-title">赞助者</h2>
            <p>感谢支持常州本地 AI 社区持续连接、组织活动与推动共建。</p>
          </div>
        </div>

        {featuredSponsors.length > 0 ? (
          <div className="home-sponsor-featured-grid">
            {featuredSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/sponsors/${sponsor.slug}`}
                className="home-sponsor-featured-card"
              >
                <div className="home-sponsor-card-head">
                  <div>
                    <p className="home-sponsor-label">{sponsor.tierLabel}</p>
                    <h3>{sponsor.name}</h3>
                  </div>
                  {sponsor.logoUrl ? (
                    <div className="home-sponsor-logo-mark" aria-label={`${sponsor.name} Logo`}>
                      <img src={sponsor.logoUrl} alt={`${sponsor.name} Logo`} loading="lazy" />
                    </div>
                  ) : <span className="home-sponsor-logo-fallback">{sponsor.name}</span>}
                </div>
                <p className="home-sponsor-summary">{sponsor.summary}</p>
              </Link>
            ))}
          </div>
        ) : null}

        {compactSponsors.length > 0 ? (
          <div className="home-sponsor-compact-grid" aria-label="更多赞助者">
            {compactSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/sponsors/${sponsor.slug}`}
                className="home-sponsor-compact-card"
                aria-label={`${sponsor.name}，${sponsor.tierLabel}`}
                title={`${sponsor.name} · ${sponsor.tierLabel}`}
              >
                <div className="home-sponsor-compact-logo">
                  {sponsor.logoUrl ? (
                    <img src={sponsor.logoUrl} alt={`${sponsor.name} Logo`} loading="lazy" />
                  ) : (
                    <span>{sponsor.name}</span>
                  )}
                </div>
                <div className="home-sponsor-compact-copy">
                  <strong>{sponsor.name}</strong>
                  <small>{sponsor.tierLabel}</small>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
