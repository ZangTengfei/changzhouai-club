import { notFound } from "next/navigation";

import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import { canAdmin, requireAdminPermission } from "@/lib/supabase/guards";

export type WorkflowTemplateRow = {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  kind: string;
  is_active: boolean;
  sort_order: number;
};

export type WorkflowTemplateStepRow = {
  id: string;
  template_id: string;
  step_key: string;
  title: string;
  description: string | null;
  stage: string | null;
  default_due_offset_days: number | null;
  ai_job_type: string | null;
  requires_review: boolean;
  sort_order: number;
};

export type WorkflowRunRow = {
  id: string;
  template_id: string | null;
  title: string;
  summary: string | null;
  kind: string;
  status: string;
  priority: string;
  owner_id: string | null;
  related_event_id: string | null;
  related_project_id: string | null;
  related_lead_id: string | null;
  starts_at: string | null;
  due_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkflowStepRow = {
  id: string;
  run_id: string;
  template_step_id: string | null;
  step_key: string;
  title: string;
  description: string | null;
  stage: string | null;
  status: string;
  assignee_id: string | null;
  reviewer_id: string | null;
  due_at: string | null;
  completed_at: string | null;
  sort_order: number;
  input_snapshot: Record<string, unknown>;
  output_snapshot: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type WorkflowArtifactRow = {
  id: string;
  run_id: string;
  step_id: string | null;
  artifact_type: string;
  title: string;
  description: string | null;
  local_path: string | null;
  storage_url: string | null;
  external_url: string | null;
  visibility: string;
  ai_usable: boolean;
  status: string;
  created_at: string;
};

export type AiJobRow = {
  id: string;
  run_id: string | null;
  step_id: string | null;
  job_type: string;
  engine: string;
  model: string | null;
  status: string;
  prompt: string | null;
  output_snapshot: Record<string, unknown>;
  error_message: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type WorkflowApprovalRow = {
  id: string;
  run_id: string;
  step_id: string | null;
  artifact_id: string | null;
  ai_job_id: string | null;
  approval_type: string;
  title: string;
  status: string;
  requested_by: string | null;
  reviewed_by: string | null;
  review_note: string | null;
  due_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type AdminWorkflowEventOption = {
  id: string;
  title: string;
  event_at: string | null;
  status: string;
};

export type AdminWorkflowRun = WorkflowRunRow & {
  ownerName: string | null;
  relatedEventTitle: string | null;
  templateName: string | null;
  steps: WorkflowStepRow[];
  artifacts: WorkflowArtifactRow[];
  aiJobs: AiJobRow[];
  approvals: WorkflowApprovalRow[];
  progress: {
    total: number;
    done: number;
    review: number;
    blocked: number;
    percent: number;
  };
};

export type AdminWorkflowsData = {
  templates: WorkflowTemplateRow[];
  templateSteps: WorkflowTemplateStepRow[];
  runs: AdminWorkflowRun[];
  eventOptions: AdminWorkflowEventOption[];
  stats: {
    total: number;
    active: number;
    waitingReview: number;
    aiNeedsReview: number;
    pendingApprovals: number;
  };
  permissions: {
    canWrite: boolean;
    canRunAi: boolean;
    canReview: boolean;
  };
  queryErrors: string[];
};

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

function calculateProgress(steps: WorkflowStepRow[]) {
  const total = steps.length;
  const done = steps.filter((step) => ["approved", "done", "skipped"].includes(step.status)).length;
  const review = steps.filter((step) =>
    ["waiting_review", "changes_requested"].includes(step.status),
  ).length;
  const blocked = steps.filter((step) => step.status === "blocked").length;

  return {
    total,
    done,
    review,
    blocked,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  };
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

export async function loadAdminWorkflowsData(): Promise<AdminWorkflowsData> {
  const adminContext = await requireAdminPermission("workflows.read");
  const { supabase } = adminContext;
  const canWrite = canAdmin(adminContext, "workflows.write");
  const canRunAi = canAdmin(adminContext, "ai_jobs.run");
  const canReview = canAdmin(adminContext, "workflows.review");

  const [
    { data: templatesData, error: templatesError },
    { data: templateStepsData, error: templateStepsError },
    { data: runsData, error: runsError },
    { data: stepsData, error: stepsError },
    { data: artifactsData, error: artifactsError },
    { data: aiJobsData, error: aiJobsError },
    { data: approvalsData, error: approvalsError },
    { data: eventsData, error: eventsError },
    { data: profilesData, error: profilesError },
  ] = await Promise.all([
    supabase
      .from("workflow_templates")
      .select("id, template_key, name, description, kind, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("workflow_template_steps")
      .select(
        "id, template_id, step_key, title, description, stage, default_due_offset_days, ai_job_type, requires_review, sort_order",
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("workflow_runs")
      .select(
        "id, template_id, title, summary, kind, status, priority, owner_id, related_event_id, related_project_id, related_lead_id, starts_at, due_at, completed_at, metadata, created_by, created_at, updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("workflow_steps")
      .select(
        "id, run_id, template_step_id, step_key, title, description, stage, status, assignee_id, reviewer_id, due_at, completed_at, sort_order, input_snapshot, output_snapshot, metadata",
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("workflow_artifacts")
      .select(
        "id, run_id, step_id, artifact_type, title, description, local_path, storage_url, external_url, visibility, ai_usable, status, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_jobs")
      .select(
        "id, run_id, step_id, job_type, engine, model, status, prompt, output_snapshot, error_message, created_by, reviewed_by, created_at, updated_at, completed_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("workflow_approvals")
      .select(
        "id, run_id, step_id, artifact_id, ai_job_id, approval_type, title, status, requested_by, reviewed_by, review_note, due_at, reviewed_at, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, event_at, status")
      .order("event_at", { ascending: false, nullsFirst: false })
      .limit(40),
    supabase.from("profiles").select("id, display_name, email"),
  ]);

  const templates = (templatesData ?? []) as WorkflowTemplateRow[];
  const templateSteps = (templateStepsData ?? []) as WorkflowTemplateStepRow[];
  const runs = (runsData ?? []) as WorkflowRunRow[];
  const steps = (stepsData ?? []) as WorkflowStepRow[];
  const artifacts = (artifactsData ?? []) as WorkflowArtifactRow[];
  const aiJobs = (aiJobsData ?? []) as AiJobRow[];
  const approvals = (approvalsData ?? []) as WorkflowApprovalRow[];
  const eventOptions = (eventsData ?? []) as AdminWorkflowEventOption[];
  const profiles = ((profilesData ?? []) as Array<{
    id: string;
    display_name: string | null;
    email: string | null;
  }>).map((profile) => ({
    id: profile.id,
    name: profile.display_name?.trim() || profile.email || "未填写显示名",
  }));
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const eventById = new Map(eventOptions.map((event) => [event.id, event]));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const stepsByRunId = new Map<string, WorkflowStepRow[]>();
  const artifactsByRunId = new Map<string, WorkflowArtifactRow[]>();
  const aiJobsByRunId = new Map<string, AiJobRow[]>();
  const approvalsByRunId = new Map<string, WorkflowApprovalRow[]>();

  steps.forEach((step) => {
    const runSteps = stepsByRunId.get(step.run_id) ?? [];
    runSteps.push(step);
    stepsByRunId.set(step.run_id, runSteps);
  });

  artifacts.forEach((artifact) => {
    const runArtifacts = artifactsByRunId.get(artifact.run_id) ?? [];
    runArtifacts.push(artifact);
    artifactsByRunId.set(artifact.run_id, runArtifacts);
  });

  aiJobs.forEach((job) => {
    if (!job.run_id) {
      return;
    }

    const runJobs = aiJobsByRunId.get(job.run_id) ?? [];
    runJobs.push(job);
    aiJobsByRunId.set(job.run_id, runJobs);
  });

  approvals.forEach((approval) => {
    const runApprovals = approvalsByRunId.get(approval.run_id) ?? [];
    runApprovals.push(approval);
    approvalsByRunId.set(approval.run_id, runApprovals);
  });

  const workflowRuns = runs.map((run) => {
    const runSteps = stepsByRunId.get(run.id) ?? [];

    return {
      ...run,
      ownerName: run.owner_id ? profileById.get(run.owner_id)?.name ?? null : null,
      relatedEventTitle: run.related_event_id
        ? eventById.get(run.related_event_id)?.title ?? null
        : null,
      templateName: run.template_id ? templateById.get(run.template_id)?.name ?? null : null,
      steps: runSteps,
      artifacts: artifactsByRunId.get(run.id) ?? [],
      aiJobs: aiJobsByRunId.get(run.id) ?? [],
      approvals: approvalsByRunId.get(run.id) ?? [],
      progress: calculateProgress(runSteps),
    };
  });

  return {
    templates,
    templateSteps,
    runs: workflowRuns,
    eventOptions,
    stats: {
      total: workflowRuns.length,
      active: workflowRuns.filter((run) => run.status === "active").length,
      waitingReview: workflowRuns.filter((run) => run.status === "waiting_review").length,
      aiNeedsReview: aiJobs.filter((job) => job.status === "needs_review").length,
      pendingApprovals: approvals.filter((approval) => approval.status === "pending").length,
    },
    permissions: {
      canWrite,
      canRunAi,
      canReview,
    },
    queryErrors: [
      templatesError?.message,
      templateStepsError?.message,
      runsError?.message,
      stepsError?.message,
      artifactsError?.message,
      aiJobsError?.message,
      approvalsError?.message,
      eventsError?.message,
      profilesError?.message,
    ].filter(Boolean) as string[],
  };
}

export async function loadAdminWorkflowRunOrThrow(runId: string) {
  const data = await loadAdminWorkflowsData();
  const run = data.runs.find((item) => item.id === runId);

  if (!run) {
    notFound();
  }

  return {
    ...data,
    run,
  };
}
