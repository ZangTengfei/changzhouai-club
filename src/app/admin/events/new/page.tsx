import type { Metadata } from "next";
import { AdminNewEventPageClient } from "@/components/admin-new-event-page-client";

export const metadata: Metadata = {
  title: "新建活动",
  description: "录入新的社区活动并完善基础信息。",
};

export default function NewAdminEventPage() {
  return <AdminNewEventPageClient />;
}
