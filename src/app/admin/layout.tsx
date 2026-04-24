import type { ReactNode } from "react";
import Link from "next/link";
import { Home, ShieldCheck } from "lucide-react";

import { AdminNav } from "@/components/admin-nav";
import { AdminNotice, AdminPanel, AdminPanelBody } from "@/components/admin-ui";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { Button } from "@/components/ui/button";
import { getStaffContext } from "@/lib/supabase/guards";

import styles from "./admin-layout.module.css";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes
    .flatMap((className) =>
      typeof className === "string" ? className.split(/\s+/) : [],
    )
    .filter(Boolean)
    .map((className) =>
      styles[className as keyof typeof styles]
        ? `${styles[className as keyof typeof styles]} ${className}`
        : className,
    )
    .join(" ");
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, member, isStaff } = await getStaffContext();

  if (!isStaff) {
    return (
      <div className={cx("admin-access-state mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8")}>
        <AdminPanel className="w-full">
          <AdminPanelBody className="space-y-4 p-6">
            <div className="flex items-start gap-4">
              <span className={cx("admin-access-mark")}>
                <SiteLogoMark className={cx("admin-access-logo")} />
              </span>
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Admin
                </p>
                <h1 className="text-2xl font-semibold text-foreground">当前账号还没有后台权限</h1>
                <p className="text-sm text-muted-foreground">
                  你的当前成员状态是 `{member?.status ?? "pending"}`。社区后台仅对
                  `organizer` 或 `admin` 角色开放。
                </p>
              </div>
            </div>

            <AdminNotice>
              如需开通后台权限，请联系站点管理员处理。当前账号 ID：
              <code className="ml-1 rounded bg-background px-1.5 py-0.5 text-xs text-foreground">
                {user.id}
              </code>
            </AdminNotice>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/">
                  <Home className="size-4" />
                  返回首页
                </Link>
              </Button>
            </div>
          </AdminPanelBody>
        </AdminPanel>
      </div>
    );
  }

  return (
    <div className={cx("admin-app-shell")} data-admin-ui="compact">
      <aside className={cx("admin-desktop-sidebar hidden lg:block")}>
        <div className={cx("admin-sidebar-inner")}>
          <div className={cx("admin-sidebar-brand-card")}>
            <span className={cx("admin-sidebar-logo")}>
              <SiteLogoMark className={cx("admin-sidebar-logo-mark")} />
            </span>
            <div className={cx("admin-sidebar-brand-copy")}>
              <p>Changzhou AI Club</p>
              <h1>社区后台</h1>
            </div>
          </div>

          <div className={cx("admin-sidebar-panel admin-sidebar-role")}>
            <div className={cx("admin-sidebar-role-icon")}>
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p>当前角色</p>
              <strong>{member?.status ?? "pending"}</strong>
            </div>
          </div>

          <div className={cx("admin-sidebar-nav-card")}>
            <AdminNav />
          </div>

          <div className={cx("admin-sidebar-footer")}>
            <p>连接・分享・共创</p>
            <small>后台操作会同步影响前台展示内容。</small>
          </div>

          <Button asChild variant="secondary" className={cx("admin-back-home-button justify-start")}>
            <Link href="/">
              <Home className="size-4" />
              返回首页
            </Link>
          </Button>
        </div>
      </aside>

      <main className={cx("admin-main min-w-0")}>
        <header className={cx("admin-mobile-topbar lg:hidden")}>
          <Link href="/" className={cx("admin-mobile-brand")}>
            <SiteLogoMark className={cx("admin-mobile-logo")} />
            <span>
              <strong>常州 AI Club</strong>
              <small>社区后台</small>
            </span>
          </Link>
          <Button asChild variant="secondary" size="sm">
            <Link href="/">
              <Home className="size-4" />
              首页
            </Link>
          </Button>
        </header>

        <div className={cx("admin-mobile-nav lg:hidden")}>
          <AdminNav />
        </div>

        <div className={cx("admin-main-inner mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-4 px-4 py-4 lg:px-6")}>
          {children}
        </div>
      </main>
    </div>
  );
}
