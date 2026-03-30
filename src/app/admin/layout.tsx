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
    <div className="page-stack">
      <section className="surface admin-shell">
        <div className="admin-toolbar">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>社区后台</h1>
            <p>统一管理社区活动、成员资料与合作线索，支持日常运营和内容维护。</p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>{member?.status ?? "pending"}</strong>
              <span>当前权限</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-layout">
        <aside className="surface admin-sidebar">
          <div className="admin-sidebar-copy">
            <p className="eyebrow">Workspace</p>
            <h2>运营导航</h2>
            <p>按活动、成员和合作线索分类管理，列表浏览与详情维护分开处理。</p>
          </div>
          <AdminNav />
        </aside>

        <div className="admin-content">{children}</div>
      </section>
    </div>
  );
}
