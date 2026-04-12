import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin-nav";
import { getStaffContext } from "@/lib/supabase/guards";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, member, isStaff } = await getStaffContext();

  if (!isStaff) {
    return (
      <div className="page-stack admin-access-state">
        <section className="surface admin-shell admin-access-card">
          <p className="eyebrow">Admin</p>
          <h1>当前账号还没有后台权限</h1>
          <p>
            你的当前成员状态是 `{member?.status ?? "pending"}`。社区后台仅对
            `organizer` 或 `admin` 角色开放。
          </p>
          <div className="note-strip">
            如需开通后台权限，请联系站点管理员处理。当前账号 ID：
            <code className="inline-code">{user.id}</code>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-app-shell" data-admin-ui="compact">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <p className="eyebrow">Operations</p>
          <h1>社区后台</h1>
        </div>

        <div className="admin-sidebar-panel">
          <span className="admin-card-label">当前角色</span>
          <strong>{member?.status ?? "pending"}</strong>
        </div>

        <div className="admin-sidebar-nav">
          <div className="admin-sidebar-copy">
            <p className="eyebrow">Workspace</p>
            <h2>管理菜单</h2>
          </div>

          <AdminNav />
        </div>
      </aside>

      <main className="admin-workspace">
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
