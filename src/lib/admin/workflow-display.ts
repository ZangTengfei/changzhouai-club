import { formatChangzhouDateTime } from "@/lib/changzhou-time";

function safeDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  return formatChangzhouDateTime(value, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatWorkflowDateTime(value: string | null) {
  return safeDateTime(value) ?? "未设置";
}

export function getWorkflowStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "草稿",
    active: "进行中",
    waiting_review: "待审核",
    completed: "已完成",
    paused: "已暂停",
    cancelled: "已取消",
    todo: "待处理",
    doing: "进行中",
    waiting_input: "等资料",
    waiting_ai: "AI 执行中",
    changes_requested: "需修改",
    approved: "已通过",
    done: "已完成",
    blocked: "阻塞",
    skipped: "已跳过",
    queued: "排队中",
    running: "运行中",
    succeeded: "已成功",
    failed: "失败",
    needs_review: "待审核",
    in_review: "审核中",
    ready: "已就绪",
    published: "已发布",
    archived: "已归档",
    pending: "待审批",
    rejected: "已驳回",
  };

  return labels[status] ?? status;
}

export function getWorkflowStatusTone(status: string) {
  if (["completed", "done", "approved", "succeeded"].includes(status)) {
    return "completed" as const;
  }

  if (["active", "doing", "running"].includes(status)) {
    return "scheduled" as const;
  }

  if (["waiting_review", "needs_review", "in_review", "pending", "changes_requested"].includes(status)) {
    return "pending" as const;
  }

  if (["blocked", "failed", "rejected", "cancelled"].includes(status)) {
    return "cancelled" as const;
  }

  return "neutral" as const;
}
