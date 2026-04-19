import type { Metadata } from "next";

import { AdminSponsorDetailPageClient } from "@/components/admin-sponsor-detail-page-client";

export const metadata: Metadata = {
  title: "赞助者详情",
  description: "编辑赞助者资料并管理图片。",
};

export default async function AdminSponsorDetailPage({
  params,
}: {
  params: Promise<{ sponsorId: string }>;
}) {
  const routeParams = await params;
  return <AdminSponsorDetailPageClient sponsorId={routeParams.sponsorId} />;
}
