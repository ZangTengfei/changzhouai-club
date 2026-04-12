import type { Metadata } from "next";
import { AdminLeadDetailPageClient } from "@/components/admin-lead-detail-page-client";

export const metadata: Metadata = {
  title: "合作线索详情",
  description: "查看合作线索详情、记录跟进动作并匹配候选成员。",
};

export default async function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const routeParams = await params;
  return <AdminLeadDetailPageClient leadId={routeParams.leadId} />;
}
