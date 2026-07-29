import { SiteLogoMark } from "@/components/site-logo-mark";
import { cssModuleCx } from "@/lib/utils";

import styles from "./route-loading.module.css";

const cx = cssModuleCx.bind(null, styles);
const adminSkeletonRows = Array.from({ length: 4 });
const adminSkeletonClass =
  "block animate-pulse rounded bg-[#edf0f2] motion-reduce:animate-none";

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
        "admin-region-loading mx-auto grid w-full max-w-[1600px] gap-3 font-sans text-[#1f2937]",
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-admin-route-loading
    >
      <header
        className="flex min-h-[84px] items-center justify-between gap-4 rounded-lg border border-[#e5e7eb] bg-white px-5 py-[18px] shadow-sm max-sm:min-h-[74px] max-sm:p-3.5"
        aria-hidden="true"
      >
        <div className="grid min-w-0 gap-[9px]">
          <AdminSkeleton className="h-[11px] w-[72px]" />
          <AdminSkeleton className="h-6 w-[168px] max-w-[42vw]" />
        </div>
        <AdminSkeleton className="h-[34px] w-24 bg-[#e6f4ff]" />
      </header>

      <div
        className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-sm"
        aria-hidden="true"
      >
        {adminSkeletonRows.map((_, index) => (
          <div
            className="flex min-h-[72px] items-center justify-between gap-4 border-b border-[#f0f0f0] px-[18px] py-3.5 last:border-b-0 max-sm:px-3.5"
            key={index}
          >
            <div className="grid min-w-0 gap-[9px]">
              <AdminSkeleton className="h-[15px] w-[min(280px,46vw)]" />
              <AdminSkeleton className="h-[11px] w-[72px]" />
            </div>
            <AdminSkeleton className="h-6 w-16 flex-none rounded-full bg-[#f0f7ff]" />
          </div>
        ))}
      </div>

      <span className="sr-only">正在加载后台内容</span>
    </section>
  );
}
