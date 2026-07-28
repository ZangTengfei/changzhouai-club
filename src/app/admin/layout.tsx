import type { ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import { AdminAntdProvider } from "@/components/admin-antd-provider";
import { AdminAccessDenied, AdminShell } from "@/components/admin-shell";
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
          <AdminAccessDenied status={member?.status ?? "pending"} userId={user.id} />
        </AdminAntdProvider>
      </AntdRegistry>
    );
  }

  return (
    <AntdRegistry>
      <AdminAntdProvider>
        <AdminShell permissions={permissions}>{children}</AdminShell>
      </AdminAntdProvider>
    </AntdRegistry>
  );
}
