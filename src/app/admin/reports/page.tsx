import type { Metadata } from "next";

import {
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/components/admin-ui";
import {
  getAdminWeDailyConfig,
  listAdminWeDailyReports,
  type AdminWeDailyReport,
} from "@/lib/admin/wedaily-admin";
import { requireAdminPermission } from "@/lib/supabase/guards";

import { AdminWeDailyReportsClient } from "./admin-wedaily-reports-client";

export const metadata: Metadata = {
  title: "群聊日报管理",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ reportId?: string }>;
}) {
  await requireAdminPermission("updates.publish");
  const params = await searchParams;

  const isConfigured = Boolean(getAdminWeDailyConfig());
  let reports: AdminWeDailyReport[] = [];
  let error: string | null = null;

  if (isConfigured) {
    try {
      reports = await listAdminWeDailyReports({ limit: 30 });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "日报接口暂时不可用";
    }
  } else {
    error = "缺少 WEDAILY_ADMIN_TOKEN，无法编辑远端群聊日报。";
  }

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Group Daily"
          title="群聊日报管理"
        />
        <AdminPanelBody className="space-y-4">
          <AdminNotice>
            这里编辑的是 WeDaily 远端日报 Markdown。保存后会刷新前台资讯页缓存；
            导出图片会调用 WeDaily 的长图渲染接口，保持和日报源站一致。
          </AdminNotice>
          <AdminWeDailyReportsClient
            initialError={error}
            initialReports={reports}
            initialSelectedReportId={Number.parseInt(params.reportId ?? "", 10) || null}
          />
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
