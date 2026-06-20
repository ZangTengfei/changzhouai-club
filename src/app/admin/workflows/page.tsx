import type { Metadata } from "next";
import Link from "next/link";
import { Bot, GitBranch, Plus, Sparkles } from "lucide-react";

import { createWorkflowRunAction } from "@/app/admin/workflows/actions";
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
import { Input } from "@/components/ui/input";
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
  loadAdminWorkflowsData,
} from "@/lib/admin/workflows";

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

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Operations OS"
          title="工作流中枢"
          actions={
            <>
              <AdminMetric label="工作流" value={data.stats.total} />
              <AdminMetric label="进行中" value={data.stats.active} />
              <AdminMetric label="待审批" value={data.stats.pendingApprovals} />
              <AdminMetric label="AI 待审" value={data.stats.aiNeedsReview} />
            </>
          }
        />
        <AdminPanelBody className="grid gap-3 md:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-2">
            <p className="text-sm leading-6 text-muted-foreground">
              把活动、资料、AI 任务、审批和后续合作线索串成可分工的运营流程。
            </p>
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge tone="scheduled">业务流程中枢</AdminStatusBadge>
              <AdminStatusBadge tone="pending">AI 产物待审</AdminStatusBadge>
              <AdminStatusBadge tone="completed">资料可归档</AdminStatusBadge>
            </div>
          </div>
          <div className="grid gap-2 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Sparkles className="size-4 text-primary" />
              <strong>第一版聚焦新活动全流程</strong>
            </div>
            <p>先跑通主题分析、筹备、官网发布、复盘、社媒分发和资料归档。</p>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      {message ? <AdminNotice>{message}</AdminNotice> : null}
      {data.queryErrors.length > 0 ? (
        <AdminNotice>后台数据读取出现问题：{data.queryErrors.join(" | ")}</AdminNotice>
      ) : null}

      {data.permissions.canWrite ? (
        <AdminPanel>
          <AdminPanelHeader eyebrow="New workflow" title="创建活动工作流" />
          <AdminPanelBody>
            <form action={createWorkflowRunAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_0.7fr_auto]">
              <AdminField label="工作流标题">
                <Input name="title" placeholder="例如：AIGC 视频创作沙龙" />
              </AdminField>
              <AdminField label="关联活动">
                <NativeSelect name="related_event_id" defaultValue="">
                  <option value="">不关联现有活动</option>
                  {data.eventOptions.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} · {formatWorkflowDateTime(event.event_at)}
                    </option>
                  ))}
                </NativeSelect>
              </AdminField>
              <AdminField label="优先级">
                <NativeSelect name="priority" defaultValue="normal">
                  <option value="normal">普通</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                  <option value="low">低</option>
                </NativeSelect>
              </AdminField>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Plus className="size-4" />
                  创建流程
                </Button>
              </div>
              <input type="hidden" name="template_id" value={data.templates[0]?.id ?? ""} />
              <div className="lg:col-span-4">
                <AdminField label="简要说明">
                  <Input
                    name="summary"
                    placeholder="可选：这场活动希望解决什么问题、面向哪些人、需要沉淀什么资产"
                  />
                </AdminField>
              </div>
            </form>
          </AdminPanelBody>
        </AdminPanel>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Workflow runs"
          title="运营工作流"
          actions={
            <Button asChild variant="secondary">
              <Link href="/admin/events">
                <GitBranch className="size-4" />
                活动管理
              </Link>
            </Button>
          }
        />
        <AdminPanelBody>
          {data.runs.length === 0 ? (
            <AdminNotice>还没有工作流。先创建一场活动工作流，系统会自动生成完整筹备步骤。</AdminNotice>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工作流</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>AI</TableHead>
                  <TableHead>审批</TableHead>
                  <TableHead>到期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <Link className="font-semibold text-foreground hover:text-primary" href={`/admin/workflows/${run.id}`}>
                        {run.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{run.templateName ?? "自定义流程"}</span>
                        {run.relatedEventTitle ? <span>关联：{run.relatedEventTitle}</span> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge tone={getWorkflowStatusTone(run.status)}>
                        {getWorkflowStatusLabel(run.status)}
                      </AdminStatusBadge>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-32">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{run.progress.done}/{run.progress.total}</span>
                          <span>{run.progress.percent}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${run.progress.percent}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Bot className="size-4" />
                        {run.aiJobs.length}
                      </div>
                    </TableCell>
                    <TableCell>{run.approvals.filter((approval) => approval.status === "pending").length}</TableCell>
                    <TableCell>{formatWorkflowDateTime(run.due_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
