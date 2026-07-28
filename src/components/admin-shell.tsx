"use client";

import type { ReactNode } from "react";
import { HomeOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Card, Result, Tag } from "antd";
import Link from "next/link";

import styles from "@/app/admin/admin-layout.module.css";
import { AdminNav } from "@/components/admin-nav";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { cssModuleCxWithGlobals } from "@/lib/utils";

const cx = cssModuleCxWithGlobals.bind(null, styles);

export function AdminAccessDenied({ status, userId }: { status: string; userId: string }) {
  return (
    <div className={cx("admin-access-state")}>
      <Card className={cx("admin-access-card")}>
        <Result
          status="403"
          title="当前账号还没有后台权限"
          subTitle={`当前成员状态：${status}。如需开通权限，请联系站点管理员。账号 ID：${userId}`}
          extra={<Link href="/"><Button type="primary" icon={<HomeOutlined />}>返回首页</Button></Link>}
        />
      </Card>
    </div>
  );
}

export function AdminShell({ permissions, children }: { permissions: string[]; children: ReactNode }) {
  return (
    <div className={cx("admin-app-shell")} data-admin-ui="antd">
      <aside className={cx("admin-desktop-sidebar")}>
        <div className={cx("admin-sidebar-inner")}>
          <Link href="/admin" className={cx("admin-sidebar-brand-card")}>
            <span className={cx("admin-sidebar-logo")}><SiteLogoMark className={cx("admin-sidebar-logo-mark")} /></span>
            <div className={cx("admin-sidebar-brand-copy")}><strong>常州 AI Club</strong><span>管理后台</span></div>
          </Link>
          <div className={cx("admin-sidebar-role")}>
            <SafetyCertificateOutlined /><span>后台权限</span><Tag color="blue">{permissions.length} 项</Tag>
          </div>
          <AdminNav permissions={permissions} />
          <div className={cx("admin-sidebar-footer")}>
            <Link href="/"><Button block icon={<HomeOutlined />}>返回网站首页</Button></Link>
          </div>
        </div>
      </aside>
      <main className={cx("admin-main")}>
        <header className={cx("admin-mobile-topbar")}>
          <Link href="/admin" className={cx("admin-mobile-brand")}>
            <SiteLogoMark className={cx("admin-mobile-logo")} />
            <span><strong>常州 AI Club</strong><small>管理后台</small></span>
          </Link>
          <Link href="/"><Button size="small" icon={<HomeOutlined />}>首页</Button></Link>
        </header>
        <div className={cx("admin-mobile-nav")}><AdminNav permissions={permissions} /></div>
        <div className={cx("admin-main-inner")}>{children}</div>
      </main>
    </div>
  );
}
