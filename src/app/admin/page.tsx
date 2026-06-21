import type { Metadata } from "next";

import { AdminOperationsDashboard } from "@/components/admin-antd/admin-operations-dashboard";
import { loadAdminOperationsData } from "@/lib/admin/operations";

export const metadata: Metadata = {
  title: "运营总控台",
  description: "查看社区运营工作流、AI 任务、审批、资料和合作线索。",
};

export default async function AdminPage() {
  const data = await loadAdminOperationsData();

  return <AdminOperationsDashboard data={data} />;
}
