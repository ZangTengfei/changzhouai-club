"use client";

import Link from "next/link";

import {
  AdminPageStack,
  AdminPanel,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { AdminSponsorEditorFormClient } from "@/components/admin-sponsor-editor-form-client";
import { Button } from "@/components/ui/button";

export function AdminNewSponsorPageClient() {
  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="New Sponsor"
          title="新增赞助者"
          actions={
            <Button asChild variant="secondary">
              <Link href="/admin/sponsors">返回赞助者列表</Link>
            </Button>
          }
        />
      </AdminPanel>

      <AdminSponsorEditorFormClient />
    </AdminPageStack>
  );
}
