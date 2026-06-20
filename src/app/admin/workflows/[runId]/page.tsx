import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, FileText, GitBranch, Send, Sparkles } from "lucide-react";

import {
  requestWorkflowApprovalAction,
  runWorkflowAiJobAction,
  updateWorkflowStepStatusAction,
} from "@/app/admin/workflows/actions";
import {
  AdminField,
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatWorkflowDateTime,
  getWorkflowStatusLabel,
  getWorkflowStatusTone,
  loadAdminWorkflowRunOrThrow,
  type AiJobRow,
  type WorkflowStepRow,
} from "@/lib/admin/workflows";

export const metadata: Metadata = {
  title: "工作流详情",
  description: "查看单场活动工作流、任务、AI 产物和审批状态。",
};

const STEP_STATUS_OPTIONS = [
  ["todo", "待处理"],
  ["doing", "进行中"],
  ["waiting_input", "等资料"],
  ["waiting_ai", "AI 执行中"],
  ["waiting_review", "待审核"],
  ["changes_requested", "需修改"],
  ["approved", "已通过"],
  ["done", "已完成"],
  ["blocked", "阻塞"],
  ["skipped", "跳过"],
] as const;

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

function getStepAiJobType(step: WorkflowStepRow) {
  const metadata = step.metadata as Record<string, unknown>;
  return typeof metadata.ai_job_type === "string" ? metadata.ai_job_type : null;
}

function getLatestAiJobForStep(aiJobs: AiJobRow[], stepId: string) {
  return aiJobs.find((job) => job.step_id === stepId) ?? null;
}

function renderAiOutput(job: AiJobRow | null) {
  if (!job?.output_snapshot || Object.keys(job.output_snapshot).length === 0) {
    return <p className="text-sm text-muted-foreground">还没有 AI 产物。运行节点后会在这里显示摘要、检查项和多平台草稿。</p>;
  }

  const output = job.output_snapshot as {
    title?: string;
    summary?: string;
    checklist?: string[];
    drafts?: Array<{ channel?: string; title?: string; body?: string }>;
    next_actions?: string[];
  };

  return (
    <div className="grid gap-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">{output.title ?? "AI 草稿"}</h3>
        {output.summary ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{output.summary}</p> : null}
      </div>
      {output.checklist?.length ? (
        <div className="grid gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">检查项</p>
          {output.checklist.map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}
      {output.drafts?.length ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">草稿</p>
          {output.drafts.map((draft, index) => (
            <div key={`${draft.channel}-${index}`} className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <AdminStatusBadge tone="scheduled">{draft.channel ?? "草稿"}</AdminStatusBadge>
                <strong className="text-sm text-foreground">{draft.title}</strong>
              </div>
              {draft.body ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{draft.body}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
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
  const message = getQueryMessage(query);
  const currentStep =
    run.steps.find((step) => ["doing", "waiting_ai", "waiting_review"].includes(step.status)) ??
    run.steps.find((step) => step.status === "todo") ??
    run.steps[0] ??
    null;
  const currentAiJob = currentStep ? getLatestAiJobForStep(run.aiJobs, currentStep.id) : null;

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Workflow detail"
          title={
            <span className="flex flex-wrap items-center gap-2">
              {run.title}
              <AdminStatusBadge tone={getWorkflowStatusTone(run.status)}>
                {getWorkflowStatusLabel(run.status)}
              </AdminStatusBadge>
            </span>
          }
          actions={
            <Button asChild variant="secondary">
              <Link href="/admin/workflows">
                <ArrowLeft className="size-4" />
                返回工作流
              </Link>
            </Button>
          }
        />
        <AdminPanelBody className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <p className="text-sm leading-6 text-muted-foreground">
              {run.summary || run.relatedEventTitle || "这是一条社区运营流程，用于串联任务、AI 产物、审批和资料归档。"}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>模板：{run.templateName ?? "自定义流程"}</span>
              <span>负责人：{run.ownerName ?? "未设置"}</span>
              <span>到期：{formatWorkflowDateTime(run.due_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminMetric label="步骤" value={`${run.progress.done}/${run.progress.total}`} />
            <AdminMetric label="AI 任务" value={run.aiJobs.length} />
            <AdminMetric label="产物" value={run.artifacts.length} />
            <AdminMetric label="待审批" value={run.approvals.filter((item) => item.status === "pending").length} />
          </div>
        </AdminPanelBody>
      </AdminPanel>

      {message ? <AdminNotice>{message}</AdminNotice> : null}
      {queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="Lifecycle" title="活动生命周期" />
        <AdminPanelBody>
          <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
            {run.steps.slice(0, 8).map((step) => (
              <div
                key={step.id}
                className="min-h-24 rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">{step.stage ?? "stage"}</span>
                  <AdminStatusBadge tone={getWorkflowStatusTone(step.status)}>
                    {getWorkflowStatusLabel(step.status)}
                  </AdminStatusBadge>
                </div>
                <strong className="mt-3 block text-sm text-foreground">{step.title}</strong>
                <small className="mt-1 block text-muted-foreground">{formatWorkflowDateTime(step.due_at)}</small>
              </div>
            ))}
          </div>
        </AdminPanelBody>
      </AdminPanel>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AdminPanel>
          <AdminPanelHeader eyebrow="Tasks" title="任务与状态" />
          <AdminPanelBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>到期</TableHead>
                  <TableHead>AI</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.steps.map((step) => {
                  const aiJobType = getStepAiJobType(step);
                  const latestJob = getLatestAiJobForStep(run.aiJobs, step.id);

                  return (
                    <TableRow key={step.id}>
                      <TableCell>
                        <div className="font-semibold text-foreground">{step.title}</div>
                        {step.description ? (
                          <div className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">{step.description}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge tone={getWorkflowStatusTone(step.status)}>
                          {getWorkflowStatusLabel(step.status)}
                        </AdminStatusBadge>
                      </TableCell>
                      <TableCell>{formatWorkflowDateTime(step.due_at)}</TableCell>
                      <TableCell>
                        {latestJob ? (
                          <AdminStatusBadge tone={getWorkflowStatusTone(latestJob.status)}>
                            {getWorkflowStatusLabel(latestJob.status)}
                          </AdminStatusBadge>
                        ) : aiJobType ? (
                          <span className="text-sm text-muted-foreground">可运行</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">手动</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <form action={updateWorkflowStepStatusAction} className="flex gap-2">
                            <input type="hidden" name="run_id" value={run.id} />
                            <input type="hidden" name="step_id" value={step.id} />
                            <input type="hidden" name="redirect_to" value={`/admin/workflows/${run.id}`} />
                            <NativeSelect name="status" defaultValue={step.status} className="w-28">
                              {STEP_STATUS_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </NativeSelect>
                            <Button type="submit" variant="secondary" size="sm">
                              更新
                            </Button>
                          </form>
                          {permissions.canRunAi && aiJobType ? (
                            <form action={runWorkflowAiJobAction}>
                              <input type="hidden" name="run_id" value={run.id} />
                              <input type="hidden" name="step_id" value={step.id} />
                              <input type="hidden" name="job_type" value={aiJobType} />
                              <input type="hidden" name="redirect_to" value={`/admin/workflows/${run.id}`} />
                              <Button type="submit" variant="outline" size="sm">
                                <Bot className="size-4" />
                                运行 AI
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            eyebrow="AI panel"
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                AI 执行面板
              </span>
            }
          />
          <AdminPanelBody className="space-y-4">
            {currentStep ? (
              <>
                <div className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">当前节点</p>
                  <h2 className="mt-1 text-base font-semibold text-foreground">{currentStep.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {currentStep.description ?? "选择一个可运行 AI 的节点，生成待审核草稿。"}
                  </p>
                </div>
                {renderAiOutput(currentAiJob)}
                {currentAiJob?.error_message ? (
                  <AdminNotice>最近一次 AI 任务失败：{currentAiJob.error_message}</AdminNotice>
                ) : null}
                {permissions.canReview && currentStep ? (
                  <form action={requestWorkflowApprovalAction} className="grid gap-2">
                    <input type="hidden" name="run_id" value={run.id} />
                    <input type="hidden" name="step_id" value={currentStep.id} />
                    <input type="hidden" name="title" value={`${currentStep.title} 审核`} />
                    <input type="hidden" name="redirect_to" value={`/admin/workflows/${run.id}`} />
                    <Button type="submit" variant="secondary">
                      <Send className="size-4" />
                      提交审批
                    </Button>
                  </form>
                ) : null}
              </>
            ) : (
              <AdminNotice>这个工作流还没有任务。</AdminNotice>
            )}
          </AdminPanelBody>
        </AdminPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel>
          <AdminPanelHeader
            eyebrow="Artifacts"
            title={
              <span className="flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                活动资产
              </span>
            }
          />
          <AdminPanelBody>
            {run.artifacts.length === 0 ? (
              <AdminNotice>还没有产物。AI 草稿、海报、报名链接、复盘和资料索引都会记录在这里。</AdminNotice>
            ) : (
              <div className="grid gap-2">
                {run.artifacts.map((artifact) => (
                  <div key={artifact.id} className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-foreground">{artifact.title}</strong>
                      <div className="flex flex-wrap gap-2">
                        <AdminStatusBadge tone={artifact.visibility === "private" ? "cancelled" : "neutral"}>
                          {artifact.visibility}
                        </AdminStatusBadge>
                        <AdminStatusBadge tone={getWorkflowStatusTone(artifact.status)}>
                          {getWorkflowStatusLabel(artifact.status)}
                        </AdminStatusBadge>
                      </div>
                    </div>
                    {artifact.description ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{artifact.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </AdminPanelBody>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            eyebrow="Approvals"
            title={
              <span className="flex items-center gap-2">
                <GitBranch className="size-5 text-primary" />
                审批记录
              </span>
            }
          />
          <AdminPanelBody>
            {run.approvals.length === 0 ? (
              <AdminNotice>还没有审批记录。官网发布、海报终稿、社媒外发和资料同步都应走审批。</AdminNotice>
            ) : (
              <div className="grid gap-2">
                {run.approvals.map((approval) => (
                  <div key={approval.id} className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm text-foreground">{approval.title}</strong>
                      <AdminStatusBadge tone={getWorkflowStatusTone(approval.status)}>
                        {getWorkflowStatusLabel(approval.status)}
                      </AdminStatusBadge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {approval.approval_type} · {formatWorkflowDateTime(approval.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </AdminPanelBody>
        </AdminPanel>
      </div>
    </AdminPageStack>
  );
}
