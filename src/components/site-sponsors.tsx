import Link from "next/link";

import { getPublicSponsors } from "@/lib/sponsors";
import { cssModuleCx } from "@/lib/utils";
import styles from "./site-sponsors.module.css";

const cx = cssModuleCx.bind(null, styles);

export async function SiteSponsors() {
  const sponsors = await getPublicSponsors();
  const featuredSponsors = sponsors.filter((sponsor) => sponsor.tier === "core");
  const compactSponsors = sponsors.filter((sponsor) => sponsor.tier !== "core");

  return (
    <section className={cx("site-sponsors")} aria-labelledby="site-sponsors-title">
      <div className={cx("home-sponsor-showcase")}>
        <div className="home-card-heading home-showcase-heading">
          <div>
            <h2 id="site-sponsors-title">赞助者</h2>
            <p>感谢支持常州本地 AI 社区持续连接、组织活动与推动共建。</p>
          </div>
        </div>

        {featuredSponsors.length > 0 ? (
          <div className={cx("home-sponsor-featured-grid")}>
            {featuredSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/sponsors/${sponsor.slug}`}
                className={cx("home-sponsor-featured-card")}
              >
                <div className={cx("home-sponsor-card-head")}>
                  <div>
                    <p className={cx("home-sponsor-label")}>{sponsor.tierLabel}</p>
                    <h3>{sponsor.name}</h3>
                  </div>
                  {sponsor.logoUrl ? (
                    <div className={cx("home-sponsor-logo-mark")} aria-label={`${sponsor.name} Logo`}>
                      <img src={sponsor.logoUrl} alt={`${sponsor.name} Logo`} loading="lazy" />
                    </div>
                  ) : <span className={cx("home-sponsor-logo-fallback")}>{sponsor.name}</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {compactSponsors.length > 0 ? (
          <div className={cx("home-sponsor-compact-grid")} aria-label="更多赞助者">
            {compactSponsors.map((sponsor) => (
              <Link
                key={sponsor.id}
                href={`/sponsors/${sponsor.slug}`}
                className={cx("home-sponsor-compact-card")}
                aria-label={`${sponsor.name}，${sponsor.tierLabel}`}
                title={`${sponsor.name} · ${sponsor.tierLabel}`}
              >
                <div className={cx("home-sponsor-compact-logo")}>
                  {sponsor.logoUrl ? (
                    <img src={sponsor.logoUrl} alt={`${sponsor.name} Logo`} loading="lazy" />
                  ) : (
                    <span>{sponsor.name}</span>
                  )}
                </div>
                <div className={cx("home-sponsor-compact-copy")}>
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
