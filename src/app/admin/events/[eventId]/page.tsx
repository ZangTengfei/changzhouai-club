import type { Metadata } from "next";
import { AdminEventDetailPageClient } from "@/components/admin-event-detail-page-client";

export const metadata: Metadata = {
  title: "活动详情",
  description: "编辑活动、管理相册并查看报名名单。",
};

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const routeParams = await params;
  return <AdminEventDetailPageClient eventId={routeParams.eventId} />;
}
