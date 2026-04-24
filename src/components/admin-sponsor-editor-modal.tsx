"use client";

import { useState } from "react";
import Link from "next/link";

import { AdminModal } from "@/components/admin-modal";
import { AdminSponsorEditorFormClient } from "@/components/admin-sponsor-editor-form-client";
import { AdminNotice } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { useAdminResource } from "@/components/use-admin-resource";
import type { AdminSponsor, AdminSponsorsDebugSnapshot } from "@/lib/admin/sponsors";

type AdminSponsorDetailData = {
  sponsor: AdminSponsor;
  queryErrors: string[];
  debugSnapshot: AdminSponsorsDebugSnapshot;
};

function AdminSponsorEditModalContent({
  sponsorId,
  onChanged,
  onClose,
}: {
  sponsorId: string;
  onChanged?: () => void;
  onClose: () => void;
}) {
  const detail = useAdminResource<AdminSponsorDetailData>(
    `/api/admin/sponsors/${sponsorId}`,
  );

  if (detail.isLoading) {
    return <AdminNotice>正在加载赞助者详情...</AdminNotice>;
  }

  if (detail.error) {
    return <AdminNotice>赞助者详情读取失败：{detail.error}</AdminNotice>;
  }

  if (!detail.data?.sponsor) {
    return <AdminNotice>未找到对应赞助者数据。</AdminNotice>;
  }

  return (
    <>
      <AdminSponsorEditorFormClient
        sponsor={detail.data.sponsor}
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
          <Link href={`/admin/sponsors/${detail.data.sponsor.id}`}>打开完整赞助者详情页</Link>
        </Button>
      </div>
    </>
  );
}

export function AdminSponsorEditorModal({
  sponsorId,
  triggerLabel,
  onChanged,
}: {
  sponsorId?: string;
  triggerLabel: string;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AdminModal
      title={sponsorId ? "编辑赞助者" : "新增赞助者"}
      trigger={
        <Button type="button" variant={sponsorId ? "outline" : "default"} size="sm">
          {triggerLabel}
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
    >
      {sponsorId ? (
        <AdminSponsorEditModalContent
          sponsorId={sponsorId}
          onChanged={onChanged}
          onClose={() => setOpen(false)}
        />
      ) : (
        <AdminSponsorEditorFormClient
          onCreated={() => {
            setOpen(false);
            onChanged?.();
          }}
        />
      )}
    </AdminModal>
  );
}
