import type { Metadata } from "next";

import { AdminWorkflowsPageClient } from "@/components/admin-antd/admin-workflows-page-client";
import { loadAdminWorkflowsData } from "@/lib/admin/workflows";

export const metadata: Metadata = {
  title: "工作流中枢",
  description: "管理社区运营工作流、AI 任务和活动执行闭环。",
};

function getQueryMessage(searchParams: { saved?: string; error?: string }) {
  if (searchParams.saved === "workflow") {
    return "活动工作流已创建。";
  }

  const errorMessages: Record<string, string> = {
    template_missing: "没有找到可用的活动工作流模板。",
    missing_title: "请填写工作流标题，或选择一个活动自动带入标题。",
    run_create_failed: "创建工作流失败，请稍后再试。",
  };

  return searchParams.error ? errorMessages[searchParams.error] ?? "工作流操作失败。" : null;
}

export default async function AdminWorkflowsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const data = await loadAdminWorkflowsData();
  const message = getQueryMessage(params);

  return <AdminWorkflowsPageClient data={data} message={message} hasError={Boolean(params.error)} />;
}
