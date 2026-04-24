import { SiteLogoMark } from "@/components/site-logo-mark";

import styles from "./route-loading.module.css";

const siteCards = Array.from({ length: 3 });
const adminRows = Array.from({ length: 6 });
const siteLoadingSteps = ["资料", "活动", "共建"];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes
    .flatMap((className) =>
      typeof className === "string" ? className.split(/\s+/) : [],
    )
    .filter(Boolean)
    .map((className) => styles[className as keyof typeof styles] ?? className)
    .join(" ");
}

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

export function AdminRouteLoading() {
  return (
    <div className="flex flex-col gap-4" aria-live="polite" aria-busy="true">
      <div className={cx("route-progress-shell")}>
        <div className={cx("route-progress-bar route-progress-bar-admin")} />
      </div>

      <section className="rounded-[var(--radius)] border border-border/70 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-28" />
          </div>
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-12 w-24 rounded-xl" />
            <SkeletonBlock className="h-12 w-24 rounded-xl" />
            <SkeletonBlock className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border/70 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="border-b border-border/70 px-4 py-4">
          <SkeletonBlock className="h-5 w-24" />
        </div>
        <div className="grid gap-3 px-4 py-4">
          <SkeletonBlock className="h-9 w-full rounded-xl" />
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-8 w-24 rounded-full" />
            <SkeletonBlock className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius)] border border-border/70 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_96px] gap-3 border-b border-border/70 px-4 py-3">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-4 w-16" />
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-12" />
        </div>
        <div className="divide-y divide-border/60">
          {adminRows.map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_96px] gap-3 px-4 py-4"
            >
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-3.5 w-56" />
              </div>
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3.5 w-20" />
              </div>
              <SkeletonBlock className="h-6 w-16 rounded-full" />
              <div className="space-y-2">
                <SkeletonBlock className="h-3.5 w-24" />
                <SkeletonBlock className="h-3.5 w-20" />
              </div>
              <SkeletonBlock className="h-8 w-14 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
