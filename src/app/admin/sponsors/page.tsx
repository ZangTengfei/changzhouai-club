import type { Metadata } from "next";

import { AdminSponsorsPageClient } from "@/components/admin-sponsors-page-client";

export const metadata: Metadata = {
  title: "赞助者管理",
  description: "查看和管理社区赞助者。",
};

export default function AdminSponsorsPage() {
  return <AdminSponsorsPageClient />;
}
