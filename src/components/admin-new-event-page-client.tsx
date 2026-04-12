"use client";

import Link from "next/link";

import {
  AdminPageStack,
  AdminPanel,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { AdminEventEditorFormClient } from "@/components/admin-event-editor-form-client";
import { Button } from "@/components/ui/button";

export function AdminNewEventPageClient() {
  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="New Event"
          title="新建活动"
          actions={
            <Button asChild variant="secondary">
              <Link href="/admin/events">返回活动列表</Link>
            </Button>
          }
        />
      </AdminPanel>

      <AdminEventEditorFormClient />
    </AdminPageStack>
  );
}
