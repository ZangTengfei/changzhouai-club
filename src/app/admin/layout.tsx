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
            你的当前成员状态是 `{member?.status ?? "pending"}`。活动后台只对
            `organizer` 或 `admin` 开放。
          </p>
          <div className="note-strip">
            先到账号页复制你的用户 ID，再在 Supabase 里执行：
            <code className="inline-code">
              update public.members set status = 'admin' where id = '{user.id}';
            </code>
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
            <p>先把活动管理做顺，再逐步扩到成员管理、合作线索和更完整的社区运营后台。</p>
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
            <p>后台结构先按常见管理台来排，列表优先，详情独立，方便后续持续扩展。</p>
          </div>
          <AdminNav />
        </aside>

        <div className="admin-content">{children}</div>
      </section>
    </div>
  );
}
