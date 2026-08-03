import type { Metadata } from "next";

import { AdminSpacesPageClient } from "@/components/admin-spaces-page-client";

export const metadata: Metadata = {
  title: "空间工位",
  description: "审核固定工位申请并管理当前常驻工位归属。",
};

export default function AdminSpacesPage() {
  return <AdminSpacesPageClient />;
}
