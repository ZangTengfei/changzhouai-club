import type { Metadata } from "next";

import { AdminSpacesPageClient } from "@/components/admin-spaces-page-client";

export const metadata: Metadata = {
  title: "空间管理",
  description: "管理社区实景图片、工位状态、空间预约、常驻工位和门禁申请。",
};

export default function AdminSpacesPage() {
  return <AdminSpacesPageClient />;
}
