import type { Metadata } from "next";

import { AdminEventsPageClient } from "@/components/admin-events-page-client";

export const metadata: Metadata = {
  title: "活动管理",
  description: "查看活动列表并进入单场活动编辑页。",
};

export default function AdminEventsPage() {
  return <AdminEventsPageClient />;
}
