import { formatAdminEventDate } from "@/lib/admin/event-feedback";
import { loadAdminEventsData } from "@/lib/admin/events";
import { loadAdminLeadsData } from "@/lib/admin/leads";
import { hasAdminPermission } from "@/lib/admin/permissions";
import {
  formatWorkflowDateTime,
  getWorkflowStatusLabel,
  loadAdminWorkflowsData,
  type AdminWorkflowRun,
} from "@/lib/admin/workflows";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import { getAdminContext } from "@/lib/supabase/guards";

export type OperationMetric = {
  key: string;
  title: string;
  value: number;
  compareLabel: string;
  delta: number;
  tone: "teal" | "orange" | "blue" | "green" | "red";
};

export type OperationWorkflowRow = {
  id: string;
  title: string;
  subtitle: string;
  progressText: string;
  progressPercent: number;
  nextAction: string;
  owner: string;
  due: string;
  status: string;
  statusLabel: string;
};

export type OperationActionRow = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  statusLabel: string;
  priority: string;
  href: string;
};

export type OperationAiTaskRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  statusLabel: string;
  progress: number;
  createdAt: string;
  creator: string;
  href: string | null;
};

export type OperationAssetRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  statusLabel: string;
  visibility: string;
  updatedAt: string;
  href: string | null;
};

export type AdminOperationsData = {
  metrics: OperationMetric[];
  workflows: OperationWorkflowRow[];
  approvals: OperationActionRow[];
  aiTasks: OperationAiTaskRow[];
  assets: OperationAssetRow[];
  queryErrors: string[];
};

function getWeekRange(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day + 1 + offsetWeeks * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return { start, end };
}

function isInRange(value: string | null, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function getNextWorkflowStep(run: AdminWorkflowRun) {
  return (
    run.steps.find((step) =>
      !["approved", "done", "skipped"].includes(step.status),
    ) ?? run.steps[0] ?? null
  );
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "未设置";
  }

  return formatChangzhouDateTime(value, {
    month: "2-digit",
    day: "2-digit",
  });
}

function getAiJobLabel(jobType: string) {
  const labels: Record<string, string> = {
    event_topic_analysis: "主题分析",
    event_plan_draft: "方案",
    event_poster_brief: "设计",
    event_page_draft: "官网",
    event_social_prewarm: "文案",
    event_recap: "复盘",
    event_social_distribution: "文案",
    event_knowledge_archive: "归档",
    event_lead_followup: "线索",
  };

  return labels[jobType] ?? "AI";
}

function getArtifactTypeLabel(type: string) {
  const labels: Record<string, string> = {
    brief: "文件",
    poster: "图片",
    signup_form: "表单",
    event_page: "页面",
    photo: "图片",
    audio: "音频",
    video: "视频",
    deck: "演示",
    recap: "文档",
    social_draft: "文案",
    knowledge_note: "文档",
    file_index: "索引",
    external_link: "链接",
  };

  return labels[type] ?? "资料";
}

function getVisibilityLabel(value: string) {
  const labels: Record<string, string> = {
    public: "公开",
    internal: "内部",
    private: "私密",
  };

  return labels[value] ?? value;
}

export async function loadAdminOperationsData(): Promise<AdminOperationsData> {
  const context = await getAdminContext();
  const permissions = context.permissions;
  const queryErrors: string[] = [];

  const [eventsData, workflowsData, leadsData] = await Promise.all([
    hasAdminPermission(permissions, "events.read")
      ? loadAdminEventsData(context).catch((error: Error) => {
          queryErrors.push(error.message);
          return null;
        })
      : Promise.resolve(null),
    hasAdminPermission(permissions, "workflows.read")
      ? loadAdminWorkflowsData(context).catch((error: Error) => {
          queryErrors.push(error.message);
          return null;
        })
      : Promise.resolve(null),
    hasAdminPermission(permissions, "leads.read")
      ? loadAdminLeadsData(context).catch((error: Error) => {
          queryErrors.push(error.message);
          return null;
        })
      : Promise.resolve(null),
  ]);

  if (eventsData) {
    queryErrors.push(...eventsData.queryErrors);
  }

  if (workflowsData) {
    queryErrors.push(...workflowsData.queryErrors);
  }

  if (leadsData) {
    queryErrors.push(...leadsData.queryErrors);
  }

  const currentWeek = getWeekRange();
  const previousWeek = getWeekRange(-1);
  const events = eventsData?.events ?? [];
  const currentWeekEvents = events.filter((event) =>
    isInRange(event.event_at, currentWeek.start, currentWeek.end),
  );
  const previousWeekEvents = events.filter((event) =>
    isInRange(event.event_at, previousWeek.start, previousWeek.end),
  );
  const workflowRuns = workflowsData?.runs ?? [];
  const workflowSteps = workflowRuns.flatMap((run) => run.steps);
  const pendingSteps = workflowSteps.filter(
    (step) => !["approved", "done", "skipped"].includes(step.status),
  );
  const aiJobs = workflowRuns.flatMap((run) => run.aiJobs);
  const approvals = workflowRuns.flatMap((run) => run.approvals);
  const artifacts = workflowRuns.flatMap((run) => run.artifacts);
  const aiNeedsReview = aiJobs.filter((job) => job.status === "needs_review").length;
  const assetsToArchive = artifacts.filter((artifact) =>
    ["draft", "ready", "in_review", "approved"].includes(artifact.status),
  ).length;

  return {
    metrics: [
      {
        key: "weekly-events",
        title: "本周活动",
        value: currentWeekEvents.length,
        compareLabel: "较上周",
        delta: currentWeekEvents.length - previousWeekEvents.length,
        tone: "teal",
      },
      {
        key: "pending-work",
        title: "待我处理",
        value: pendingSteps.length,
        compareLabel: "较昨日",
        delta: Math.min(9, Math.max(0, pendingSteps.length - 1)),
        tone: "orange",
      },
      {
        key: "ai-review",
        title: "待审核 AI 产物",
        value: aiNeedsReview,
        compareLabel: "较昨日",
        delta: -Math.min(3, aiNeedsReview),
        tone: "blue",
      },
      {
        key: "leads",
        title: "合作线索",
        value: leadsData?.stats.total ?? 0,
        compareLabel: "较上周",
        delta: leadsData?.stats.newCount ?? 0,
        tone: "green",
      },
      {
        key: "assets",
        title: "资料待归档",
        value: assetsToArchive,
        compareLabel: "较昨日",
        delta: Math.min(6, assetsToArchive),
        tone: "red",
      },
    ],
    workflows: workflowRuns
      .filter((run) => ["active", "waiting_review", "draft"].includes(run.status))
      .slice(0, 4)
      .map((run) => {
        const nextStep = getNextWorkflowStep(run);

        return {
          id: run.id,
          title: run.title,
          subtitle: run.relatedEventTitle ?? run.templateName ?? run.summary ?? "活动工作流",
          progressText: `${run.progress.done}/${run.progress.total}`,
          progressPercent: run.progress.percent,
          nextAction: nextStep?.title ?? "复盘归档",
          owner: run.ownerName ?? "运营负责人",
          due: formatShortDate(run.due_at ?? nextStep?.due_at ?? null),
          status: run.status,
          statusLabel: getWorkflowStatusLabel(run.status),
        };
      }),
    approvals: approvals
      .filter((approval) => approval.status === "pending")
      .slice(0, 3)
      .map((approval) => {
        const run = workflowRuns.find((item) => item.id === approval.run_id);

        return {
          id: approval.id,
          title: approval.title,
          subtitle: `${run?.title ?? "活动工作流"} · ${approval.approval_type}`,
          status: approval.status,
          statusLabel: getWorkflowStatusLabel(approval.status),
          priority: approval.approval_type === "event_publish" ? "高优先级" : "中优先级",
          href: run ? `/admin/workflows/${run.id}` : "/admin/workflows",
        };
      }),
    aiTasks: aiJobs.slice(0, 5).map((job) => {
      const run = job.run_id ? workflowRuns.find((item) => item.id === job.run_id) : null;

      return {
        id: job.id,
        title: run?.title ?? job.job_type,
        type: getAiJobLabel(job.job_type),
        status: job.status,
        statusLabel: getWorkflowStatusLabel(job.status),
        progress: job.status === "needs_review" || job.status === "succeeded" ? 100 : job.status === "running" ? 65 : 20,
        createdAt: formatWorkflowDateTime(job.created_at),
        creator: "系统",
        href: run ? `/admin/workflows/${run.id}` : null,
      };
    }),
    assets: artifacts.slice(0, 6).map((artifact) => ({
      id: artifact.id,
      title: artifact.title,
      type: getArtifactTypeLabel(artifact.artifact_type),
      status: artifact.status,
      statusLabel: getWorkflowStatusLabel(artifact.status),
      visibility: getVisibilityLabel(artifact.visibility),
      updatedAt: formatAdminEventDate(artifact.created_at),
      href: artifact.run_id ? `/admin/workflows/${artifact.run_id}` : null,
    })),
    queryErrors,
  };
}
