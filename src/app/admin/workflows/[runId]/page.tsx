import type { Metadata } from "next";

import { AdminWorkflowRunPageClient } from "@/components/admin-antd/admin-workflow-run-page-client";
import { loadAdminWorkflowRunOrThrow } from "@/lib/admin/workflows";

export const metadata: Metadata = {
  title: "工作流详情",
  description: "查看单场活动工作流、任务、AI 产物和审批状态。",
};

function getQueryMessage(searchParams: { saved?: string; error?: string }) {
  const savedMessages: Record<string, string> = {
    step: "任务状态已更新。",
    ai: "AI 节点已运行，产物等待审核。",
    approval: "审批请求已创建。",
  };
  const errorMessages: Record<string, string> = {
    missing_ai_target: "缺少 AI 任务目标。",
    ai_target_missing: "没有找到对应工作流或任务。",
    ai_job_create_failed: "AI 任务创建失败。",
    missing_deepseek_api_key: "当前运行环境没有配置 DEEPSEEK_API_KEY。",
    ai_job_failed: "AI 任务执行失败，详情已记录在任务里。",
    step_update_failed: "任务状态更新失败。",
    approval_create_failed: "审批请求创建失败。",
  };

  if (searchParams.saved) {
    return savedMessages[searchParams.saved] ?? "工作流已更新。";
  }

  if (searchParams.error) {
    return errorMessages[searchParams.error] ?? "工作流操作失败。";
  }

  return null;
}

export default async function AdminWorkflowRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ runId }, query] = await Promise.all([params, searchParams]);
  const { run, permissions, queryErrors } = await loadAdminWorkflowRunOrThrow(runId);

  return (
    <AdminWorkflowRunPageClient
      data={{ run, permissions, queryErrors }}
      message={getQueryMessage(query)}
      hasError={Boolean(query.error)}
    />
  );
}
