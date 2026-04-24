"use client";

import { useState } from "react";
import Link from "next/link";

import { AdminEventEditorFormClient } from "@/components/admin-event-editor-form-client";
import { AdminModal } from "@/components/admin-modal";
import { AdminNotice } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminEvent } from "@/lib/admin/events";

type AdminEventDetailData = {
  event: AdminEvent;
  queryErrors: string[];
};

function AdminEventEditModalContent({
  eventId,
  onChanged,
  onClose,
}: {
  eventId: string;
  onChanged?: () => void;
  onClose: () => void;
}) {
  const detail = useAdminResource<AdminEventDetailData>(`/api/admin/events/${eventId}`);

  if (detail.isLoading) {
    return <AdminNotice>正在加载活动详情...</AdminNotice>;
  }

  if (detail.error) {
    return <AdminNotice>活动详情读取失败：{detail.error}</AdminNotice>;
  }

  if (!detail.data?.event) {
    return <AdminNotice>未找到对应活动数据。</AdminNotice>;
  }

  return (
    <>
      <AdminEventEditorFormClient
        event={detail.data.event}
        onSaved={() => {
          detail.reload();
          onChanged?.();
        }}
        onDeleted={() => {
          onClose();
          onChanged?.();
        }}
      />
      <div className="mt-2">
        <Button asChild type="button" variant="ghost" size="sm">
          <Link href={`/admin/events/${detail.data.event.id}`}>打开完整活动详情页</Link>
        </Button>
      </div>
    </>
  );
}

export function AdminEventEditorModal({
  eventId,
  triggerLabel,
  onChanged,
}: {
  eventId?: string;
  triggerLabel: string;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AdminModal
      title={eventId ? "编辑活动" : "新建活动"}
      trigger={
        <Button type="button" variant={eventId ? "outline" : "default"} size="sm">
          {triggerLabel}
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
    >
      {eventId ? (
        <AdminEventEditModalContent
          eventId={eventId}
          onChanged={onChanged}
          onClose={() => setOpen(false)}
        />
      ) : (
        <AdminEventEditorFormClient
          onCreated={() => {
            setOpen(false);
            onChanged?.();
          }}
        />
      )}
    </AdminModal>
  );
}
