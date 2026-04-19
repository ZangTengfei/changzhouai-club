"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { AdminSponsorEditorFormClient } from "@/components/admin-sponsor-editor-form-client";
import { AdminSponsorImagesManagerClient } from "@/components/admin-sponsor-images-manager-client";
import { AdminToastSignals } from "@/components/admin-toast-signals";
import { Button } from "@/components/ui/button";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminSponsor, AdminSponsorsDebugSnapshot } from "@/lib/admin/sponsors";

type AdminSponsorDetailData = {
  sponsor: AdminSponsor;
  queryErrors: string[];
  debugSnapshot: AdminSponsorsDebugSnapshot;
};

export function AdminSponsorDetailPageClient({ sponsorId }: { sponsorId: string }) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminSponsorDetailData>(
    `/api/admin/sponsors/${sponsorId}`,
  );
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const sponsor = data?.sponsor;

  return (
    <AdminPageStack>
      <AdminToastSignals
        success={getAdminSavedMessage(saved)}
        error={queryError ? getAdminErrorMessage(queryError) : null}
      />

      {sponsor ? (
        <AdminPanel>
          <AdminPanelHeader
            eyebrow="Sponsor Detail"
            title={sponsor.name}
            actions={
              <>
                <AdminMetric label="图片" value={sponsor.images.length} />
                <Button asChild>
                  <Link href={`/sponsors/${sponsor.slug}`} target="_blank" rel="noreferrer">
                    查看公开页
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/admin/sponsors">返回赞助者列表</Link>
                </Button>
              </>
            }
          />
          <AdminPanelBody className="flex flex-wrap gap-2">
            <AdminStatusBadge tone={sponsor.is_active ? "completed" : "neutral"}>
              {sponsor.is_active ? "公开展示" : "已隐藏"}
            </AdminStatusBadge>
            <AdminStatusBadge tone="neutral">排序 {sponsor.display_order}</AdminStatusBadge>
            <AdminStatusBadge tone="neutral">图片 {sponsor.images.length}</AdminStatusBadge>
          </AdminPanelBody>
        </AdminPanel>
      ) : null}

      {error ? <AdminNotice>后台数据读取出现问题：{error}</AdminNotice> : null}
      {data && data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}
      {isLoading ? <AdminNotice>正在加载赞助者详情...</AdminNotice> : null}

      {sponsor ? (
        <>
          <AdminSponsorEditorFormClient sponsor={sponsor} onSaved={reload} />

          <AdminSponsorImagesManagerClient
            sponsorId={sponsor.id}
            sponsorSlug={sponsor.slug}
            sponsorName={sponsor.name}
            images={sponsor.images}
            onChanged={reload}
          />
        </>
      ) : null}
    </AdminPageStack>
  );
}
