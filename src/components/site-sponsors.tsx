import Link from "next/link";

import { getPublicSponsors } from "@/lib/sponsors";

export async function SiteSponsors() {
  const sponsors = await getPublicSponsors();
  return (
    <section className="site-sponsors" aria-labelledby="site-sponsors-title">
      <div className="footer-sponsors">
        <div className="footer-sponsors-header">
          <p className="eyebrow">Sponsors</p>
          <h4 id="site-sponsors-title">赞助者</h4>
          <p>感谢支持常州本地 AI 社区持续连接、组织活动与推动共建。</p>
        </div>

        <div className="footer-sponsor-list">
          {sponsors.map((sponsor) => (
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
                  <p className="footer-sponsor-label">{sponsor.sponsorLabel}</p>
                  <h5>{sponsor.name}</h5>
                </div>
              </div>
              <p>{sponsor.summary}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
