import type { Metadata } from "next";

import { AdminMembersPageClient } from "@/components/admin-members-page-client";

export const metadata: Metadata = {
  title: "成员管理",
  description: "查看成员与加入申请列表，并进入详情页处理资料。",
};

export default function AdminMembersPage() {
  return <AdminMembersPageClient />;
}
