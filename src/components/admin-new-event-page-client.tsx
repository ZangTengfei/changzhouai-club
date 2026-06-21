"use client";

import Link from "next/link";
import { Button } from "antd";

import {
  AdminPageStack,
  AdminPanel,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { AdminEventEditorFormClient } from "@/components/admin-event-editor-form-client";

export function AdminNewEventPageClient() {
  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="New Event"
          title="新建活动"
          actions={
            <Link href="/admin/events">
              <Button>返回活动列表</Button>
            </Link>
          }
        />
      </AdminPanel>

      <AdminEventEditorFormClient />
    </AdminPageStack>
  );
}
