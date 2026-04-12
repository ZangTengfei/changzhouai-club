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
      <div className="page-stack">
        <section className="surface admin-shell">
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
    <div className="admin-app-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <p className="eyebrow">Admin</p>
          <h1>社区后台</h1>
          <p>活动、成员与合作线索统一在这里维护，采用标准管理后台工作区组织。</p>
        </div>

        <div className="admin-sidebar-panel">
          <span className="admin-card-label">当前权限</span>
          <strong>{member?.status ?? "pending"}</strong>
          <p>左侧切换模块，右侧进入表格与增删改查页面。</p>
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
        <header className="surface admin-shell admin-shell-compact">
          <div className="admin-toolbar">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>运营工作区</h2>
              <p>右侧区域用于列表、详情、表单和批量管理操作。</p>
            </div>

            <div className="admin-toolbar-side">
              <div className="admin-mini-stat">
                <strong>{member?.status ?? "pending"}</strong>
                <span>当前权限</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
