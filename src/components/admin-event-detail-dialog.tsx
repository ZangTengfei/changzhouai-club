"use client";

import * as Dialog from "@radix-ui/react-dialog";

import { AdminEventDetailPageClient } from "@/components/admin-event-detail-page-client";

export function AdminEventDetailDialog({
  eventId,
  open,
  onOpenChange,
  onEventMutated,
}: {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventMutated?: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="admin-dialog-overlay" />
        <Dialog.Content className="admin-dialog-content" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">活动详情</Dialog.Title>

          <div className="admin-dialog-header">
            <div className="admin-dialog-copy">
              <span className="admin-card-label">Modal Workspace</span>
              <strong>活动详情</strong>
              <p>在弹窗内直接维护活动信息、相册和报名名单，不打断列表浏览。</p>
            </div>

            <Dialog.Close asChild>
              <button type="button" className="button button-secondary admin-dialog-close">
                关闭
              </button>
            </Dialog.Close>
          </div>

          <div className="admin-dialog-body">
            {eventId ? (
              <AdminEventDetailPageClient
                eventId={eventId}
                mode="modal"
                onCloseRequest={() => onOpenChange(false)}
                onEventMutated={onEventMutated}
              />
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
