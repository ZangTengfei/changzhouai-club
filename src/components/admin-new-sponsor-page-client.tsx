"use client";

import Link from "next/link";
import { Button } from "antd";

import {
  AdminPageStack,
  AdminPanel,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { AdminSponsorEditorFormClient } from "@/components/admin-sponsor-editor-form-client";

export function AdminNewSponsorPageClient() {
  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="New Sponsor"
          title="新增赞助者"
          actions={
            <Link href="/admin/sponsors">
              <Button>返回赞助者列表</Button>
            </Link>
          }
        />
      </AdminPanel>

      <AdminSponsorEditorFormClient />
    </AdminPageStack>
  );
}
