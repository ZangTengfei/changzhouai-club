import type { Metadata } from "next";
import { AdminMemberDetailPageClient } from "@/components/admin-member-detail-page-client";

export const metadata: Metadata = {
  title: "成员详情",
  description: "查看成员资料并调整成员后台设置。",
};

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const routeParams = await params;
  return <AdminMemberDetailPageClient memberId={routeParams.memberId} />;
}
