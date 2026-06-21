import type { ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import {
  AdminAccessDenied,
  AdminAntdProvider,
  AdminAntdShell,
} from "@/components/admin-antd";
import { getAdminContext } from "@/lib/supabase/guards";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, member, permissions, isAdmin } = await getAdminContext();

  if (!isAdmin) {
    return (
      <AntdRegistry>
        <AdminAntdProvider>
          <AdminAccessDenied userId={user.id} memberStatus={member?.status ?? null} />
        </AdminAntdProvider>
      </AntdRegistry>
    );
  }

  return (
    <AntdRegistry>
      <AdminAntdProvider>
        <AdminAntdShell
          permissions={permissions}
          userEmail={user.email ?? null}
          memberStatus={member?.status ?? null}
        >
          {children}
        </AdminAntdShell>
      </AdminAntdProvider>
    </AntdRegistry>
  );
}
