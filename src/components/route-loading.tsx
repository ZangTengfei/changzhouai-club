import { Spin } from "antd";

import { SiteLogoMark } from "@/components/site-logo-mark";
import { cssModuleCx } from "@/lib/utils";

import styles from "./route-loading.module.css";

const cx = cssModuleCx.bind(null, styles);

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
      className={cx("admin-region-loading")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spin size="large" />
      <span>正在加载后台内容</span>
    </section>
  );
}
