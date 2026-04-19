import type { ReactNode } from "react";
import Link from "next/link";
import { Home, ShieldCheck } from "lucide-react";

import { AdminNav } from "@/components/admin-nav";
import { AdminNotice, AdminPanel, AdminPanelBody } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { getStaffContext } from "@/lib/supabase/guards";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, member, isStaff } = await getStaffContext();

  if (!isStaff) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <AdminPanel className="w-full">
          <AdminPanelBody className="space-y-4 p-6">
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
    <div className="admin-app-shell" data-admin-ui="compact">
      <aside className="hidden min-h-screen border-r border-border/70 bg-card/80 backdrop-blur lg:block">
        <div className="sticky top-0 flex h-screen w-[272px] flex-col gap-4 p-4">
          <div className="rounded-[var(--radius)] border border-border/70 bg-background/90 px-4 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div className="grid gap-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Admin
                </p>
                <h1 className="text-lg font-semibold text-foreground">社区后台</h1>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius)] border border-border/70 bg-card px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              当前角色
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">{member?.status ?? "pending"}</p>
          </div>

          <div className="rounded-[var(--radius)] border border-border/70 bg-card px-3 py-3 shadow-sm">
            <AdminNav />
          </div>

          <Button asChild variant="secondary" className="justify-start">
            <Link href="/">
              <Home className="size-4" />
              返回首页
            </Link>
          </Button>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-4 px-4 py-4 lg:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
