import { SiteLogoMark } from "@/components/site-logo-mark";
import { cssModuleCx } from "@/lib/utils";

import styles from "./route-loading.module.css";

const cx = cssModuleCx.bind(null, styles);
const adminSkeletonRows = Array.from({ length: 4 });
const adminSkeletonClass =
  "block animate-pulse rounded-admin bg-admin-skeleton motion-reduce:animate-none";

function AdminSkeleton({ className }: { className: string }) {
  return <span className={cx(adminSkeletonClass, className)} />;
}

function RouteLoadingBrand({
  title,
  caption,
}: {
  title: string;
  caption: string;
}) {
  return (
    <div className={cx("route-progress-center")}>
      <div className={cx("route-progress-brand-mark")}>
        <SiteLogoMark className={cx("route-progress-brand-icon")} />
      </div>
      <div className={cx("route-progress-brand-copy")}>
        <small>Changzhou AI Club</small>
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
    <section
      className={cx(
        "admin-region-loading mx-auto grid w-full max-w-admin gap-3 font-sans text-admin-foreground",
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-admin-route-loading
    >
      <header
        className="flex min-h-21 items-center justify-between gap-4 rounded-admin-lg border border-admin-border bg-admin-surface px-5 py-4.5 shadow-admin max-sm:min-h-[74px] max-sm:p-3.5"
        aria-hidden="true"
      >
        <div className="grid min-w-0 gap-[9px]">
          <AdminSkeleton className="h-2.75 w-18" />
          <AdminSkeleton className="h-6 w-42 max-w-[42vw]" />
        </div>
        <AdminSkeleton className="h-8.5 w-24 bg-admin-primary-soft" />
      </header>

      <div
        className="overflow-hidden rounded-admin-lg border border-admin-border bg-admin-surface shadow-admin"
        aria-hidden="true"
      >
        {adminSkeletonRows.map((_, index) => (
          <div
            className="flex min-h-18 items-center justify-between gap-4 border-b border-admin-divider px-4.5 py-3.5 last:border-b-0 max-sm:px-3.5"
            key={index}
          >
            <div className="grid min-w-0 gap-[9px]">
              <AdminSkeleton className="h-3.75 w-[min(280px,46vw)]" />
              <AdminSkeleton className="h-2.75 w-18" />
            </div>
            <AdminSkeleton className="h-6 w-16 flex-none rounded-full bg-admin-primary-subtle" />
          </div>
        ))}
      </div>

      <span className="sr-only">正在加载后台内容</span>
    </section>
  );
}
