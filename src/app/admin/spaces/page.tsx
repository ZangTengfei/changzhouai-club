import type { Metadata } from "next";

import { AdminSpacesPageClient } from "@/components/admin-spaces-page-client";

export const metadata: Metadata = {
  title: "空间工位",
  description: "审核工位固定申请，并管理流动工位转为常驻归属的状态。",
};

export default function AdminSpacesPage() {
  return <AdminSpacesPageClient />;
}
