import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { listAdminWeDailyReports } from "@/lib/admin/wedaily-admin";
import { requireAdminPermission } from "@/lib/supabase/guards";
import { parseWeDailyMarkdown } from "@/lib/wedaily";

import { AdminWeDailyShareCardsClient } from "./admin-wedaily-share-cards-client";

export const metadata: Metadata = {
  title: "制作群聊日报精华贴图",
};

export default async function AdminWeDailyShareCardsPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  await requireAdminPermission("updates.publish");
  const { reportId } = await params;
  const normalizedReportId = Number.parseInt(reportId, 10);

  if (!Number.isFinite(normalizedReportId)) notFound();

  const reports = await listAdminWeDailyReports({ limit: 200 });
  const report = reports.find((item) => item.id === normalizedReportId);

  if (!report) notFound();

  const parsed = parseWeDailyMarkdown(
    report.markdown,
    `${report.date}「${report.chat}」群聊手记`,
  );

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Daily Share Cards"
          title="制作群聊日报精华贴图"
          actions={(
            <Button asChild variant="secondary">
              <Link href={`/admin/reports?reportId=${report.id}`}>
                <ArrowLeft />
                返回日报编辑
              </Link>
            </Button>
          )}
        />
        <AdminPanelBody className="space-y-4">
          <AdminNotice>
            第一版使用固定 HTML 模板生成多张 1080 × 1440 PNG。只选择适合公开的内容，
            不会自动带入成员姓名、参与者列表或群聊原话。
          </AdminNotice>
          <AdminWeDailyShareCardsClient report={report} parsed={parsed} />
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
