import type { Metadata } from "next";

import { AdminLeadsPageClient } from "@/components/admin-leads-page-client";

export const metadata: Metadata = {
  title: "合作线索",
  description: "查看和管理合作需求线索。",
};

export default function AdminLeadsPage() {
  return <AdminLeadsPageClient />;
}
