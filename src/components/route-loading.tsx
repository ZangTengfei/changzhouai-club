import { SiteLogoMark } from "@/components/site-logo-mark";
import { cssModuleCx } from "@/lib/utils";

import styles from "./route-loading.module.css";

const adminRows = Array.from({ length: 6 });

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
    <div
      className={cx("site-route-loading")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={cx("route-progress-shell")}>
        <div className={cx("route-progress-bar")} />
      </div>
      <div className={cx("site-route-loading-status")}>
        <span className={cx("site-route-loading-dot")} aria-hidden="true" />
        <span>正在加载页面</span>
      </div>
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
