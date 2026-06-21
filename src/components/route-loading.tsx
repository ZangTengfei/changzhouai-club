import { SiteLogoMark } from "@/components/site-logo-mark";
import { cssModuleCx } from "@/lib/utils";

import styles from "./route-loading.module.css";

const siteCards = Array.from({ length: 3 });
const siteLoadingSteps = ["资料", "活动", "共建"];

const cx = cssModuleCx.bind(null, styles);

function SkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return <div className={cx("route-skeleton-shimmer rounded-2xl", className)} />;
}

function RouteLoadingBrand({
  mode = "site",
  title,
  caption,
}: {
  mode?: "site" | "admin";
  title: string;
  caption: string;
}) {
  return (
    <div
      className={cx(
        "route-progress-center",
        mode === "admin" && "route-progress-center-admin",
      )}
    >
      <div className={cx("route-progress-brand-mark")}>
        <SiteLogoMark className={cx("route-progress-brand-icon")} />
      </div>
      <div className={cx("route-progress-brand-copy")}>
        <small>{mode === "admin" ? "Admin Loading" : "Changzhou AI Club"}</small>
        <strong>{title}</strong>
        <span>{caption}</span>
      </div>
      <div className={cx("route-progress-brand-pulse")} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function GlobalRouteLoading() {
  return (
    <div aria-live="polite" aria-busy="true" className="min-h-screen">
      <div className={cx("route-progress-shell")}>
        <div className={cx("route-progress-bar")} />
      </div>
      <RouteLoadingBrand title="页面切换中" caption="正在准备新的页面内容" />
      <span className="sr-only">页面切换中</span>
    </div>
  );
}

export function SiteRouteLoading() {
  return (
    <div className={cx("site-route-loading")} aria-live="polite" aria-busy="true">
      <div className={cx("route-progress-shell")}>
        <div className={cx("route-progress-bar")} />
      </div>

      <section className={cx("site-route-loading-hero")}>
        <div className={cx("site-route-loading-copy")}>
          <p className="home-kicker">Loading · 页面切换</p>
          <h1>
            正在整理
            <span>新的社区内容</span>
          </h1>
          <p>稍等一下，正在准备页面数据、图片和交互状态。</p>

          <div className={cx("site-route-loading-proof")}>
            <span className={cx("site-route-loading-dot")} aria-hidden="true" />
            <strong>连接・分享・共创</strong>
            <small>让页面切换也保持常州 AI Club 的节奏</small>
          </div>
        </div>

        <div className={cx("site-route-loading-brand")}>
          <div className={cx("site-route-loading-mark")}>
            <SiteLogoMark className={cx("site-route-loading-logo")} />
          </div>
          <strong>常州 AI Club</strong>
          <span>CHANGZHOU AI CLUB</span>

          <div className={cx("site-route-loading-steps")} aria-hidden="true">
            {siteLoadingSteps.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={cx("site-route-loading-grid")} aria-hidden="true">
        {siteCards.map((_, index) => (
          <article key={index} className={cx("site-route-loading-card")}>
            <SkeletonBlock className="site-route-loading-card-media" />
            <SkeletonBlock className="site-route-loading-card-title" />
            <SkeletonBlock className="site-route-loading-card-line" />
            <SkeletonBlock className="site-route-loading-card-line site-route-loading-card-line-short" />
          </article>
        ))}
      </section>
    </div>
  );
}
