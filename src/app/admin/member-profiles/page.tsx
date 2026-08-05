import type { Metadata } from "next";

import { AdminMemberProfilesPageClient } from "@/components/admin-member-profiles-page-client";

export const metadata: Metadata = {
  title: "成员画像",
  description: "查看活动资料整理出的私有成员画像并关联社区账号。",
};

export default function AdminMemberProfilesPage() {
  return <AdminMemberProfilesPageClient />;
}
