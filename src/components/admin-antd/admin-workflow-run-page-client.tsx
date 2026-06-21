"use client";

import Link from "next/link";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  GlobalOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Flex,
  Progress,
  Space,
  Steps,
  Table,
  Timeline,
  Typography,
  type StepsProps,
  type TableColumnsType,
} from "antd";

import {
  requestWorkflowApprovalAction,
  runWorkflowAiJobAction,
  updateWorkflowStepStatusAction,
} from "@/app/admin/workflows/actions";
import { AdminStatusTag } from "@/components/admin-antd";
import { NativeSelect } from "@/components/admin-antd";
import {
  formatWorkflowDateTime,
  getWorkflowStatusLabel,
} from "@/lib/admin/workflow-display";
import type {
  AdminWorkflowRun,
  AdminWorkflowsData,
  AiJobRow,
  WorkflowApprovalRow,
  WorkflowArtifactRow,
  WorkflowStepRow,
} from "@/lib/admin/workflows";

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

type WorkflowRunDetailData = {
  run: AdminWorkflowRun;
  permissions: AdminWorkflowsData["permissions"];
  queryErrors: string[];
};

function getStepAiJobType(step: WorkflowStepRow) {
  const metadata = step.metadata as Record<string, unknown>;
  return typeof metadata.ai_job_type === "string" ? metadata.ai_job_type : null;
}

function getLatestAiJobForStep(aiJobs: AiJobRow[], stepId: string) {
  return aiJobs.find((job) => job.step_id === stepId) ?? null;
}

function getStepStatus(status: string): NonNullable<StepsProps["items"]>[number]["status"] {
  if (["approved", "done", "skipped"].includes(status)) {
    return "finish";
  }

  if (["blocked", "failed", "rejected"].includes(status)) {
    return "error";
  }

  if (["doing", "waiting_ai", "waiting_review", "changes_requested"].includes(status)) {
    return "process";
  }

  return "wait";
}

function renderAiOutput(job: AiJobRow | null) {
  if (!job?.output_snapshot || Object.keys(job.output_snapshot).length === 0) {
    return (
      <Alert
        type="info"
        showIcon
        title="还没有 AI 产物"
        description="运行节点后会在这里显示摘要、检查项和多平台草稿。"
      />
    );
  }

  const output = job.output_snapshot as {
    title?: string;
    summary?: string;
    checklist?: string[];
    drafts?: Array<{ channel?: string; title?: string; body?: string }>;
    next_actions?: string[];
  };

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {output.title ?? "AI 草稿"}
        </Typography.Title>
        {output.summary ? (
          <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
            {output.summary}
          </Typography.Paragraph>
        ) : null}
      </div>

      {output.checklist?.length ? (
        <Space orientation="vertical" size={8} style={{ width: "100%" }}>
          <Typography.Text type="secondary">检查项</Typography.Text>
          {output.checklist.map((item) => (
            <Flex key={item} gap={8} align="start">
              <CheckCircleOutlined className="text-primary" />
              <Typography.Text>{item}</Typography.Text>
            </Flex>
          ))}
        </Space>
      ) : null}

      {output.drafts?.length ? (
        <Space orientation="vertical" size={10} style={{ width: "100%" }}>
          <Typography.Text type="secondary">多平台草稿</Typography.Text>
          {output.drafts.map((draft, index) => (
            <Card key={`${draft.channel}-${index}`} size="small">
              <Space orientation="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap>
                  <AdminStatusTag status="ready" label={draft.channel ?? "草稿"} />
                  <Typography.Text strong>{draft.title}</Typography.Text>
                </Space>
                {draft.body ? (
                  <Typography.Paragraph type="secondary" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                    {draft.body}
                  </Typography.Paragraph>
                ) : null}
              </Space>
            </Card>
          ))}
        </Space>
      ) : null}
    </Space>
  );
}

export function AdminWorkflowRunPageClient({
  data,
  message,
  hasError,
}: {
  data: WorkflowRunDetailData;
  message: string | null;
  hasError: boolean;
}) {
  const { run, permissions, queryErrors } = data;
  const currentStep =
    run.steps.find((step) => ["doing", "waiting_ai", "waiting_review"].includes(step.status)) ??
    run.steps.find((step) => step.status === "todo") ??
    run.steps[0] ??
    null;
  const currentAiJob = currentStep ? getLatestAiJobForStep(run.aiJobs, currentStep.id) : null;
  const currentAiJobType = currentStep ? getStepAiJobType(currentStep) : null;

  const stepColumns: TableColumnsType<WorkflowStepRow> = [
    {
      title: "任务",
      dataIndex: "title",
      render: (_, step) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{step.title}</Typography.Text>
          {step.description ? (
            <Typography.Text type="secondary" className="max-w-xl">
              {step.description}
            </Typography.Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: "状态",
      width: 120,
      render: (_, step) => (
        <AdminStatusTag status={step.status} label={getWorkflowStatusLabel(step.status)} />
      ),
    },
    {
      title: "到期",
      width: 130,
      render: (_, step) => formatWorkflowDateTime(step.due_at),
    },
    {
      title: "AI",
      width: 120,
      render: (_, step) => {
        const aiJobType = getStepAiJobType(step);
        const latestJob = getLatestAiJobForStep(run.aiJobs, step.id);

        if (latestJob) {
          return <AdminStatusTag status={latestJob.status} label={getWorkflowStatusLabel(latestJob.status)} />;
        }

        return aiJobType ? <Typography.Text type="secondary">可运行</Typography.Text> : <Typography.Text type="secondary">手动</Typography.Text>;
      },
    },
    {
      title: "操作",
      width: 290,
      render: (_, step) => {
        const aiJobType = getStepAiJobType(step);

        return (
          <Space wrap>
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
              <Button htmlType="submit">更新</Button>
            </form>
            {permissions.canRunAi && aiJobType ? (
              <form action={runWorkflowAiJobAction}>
                <input type="hidden" name="run_id" value={run.id} />
                <input type="hidden" name="step_id" value={step.id} />
                <input type="hidden" name="job_type" value={aiJobType} />
                <input type="hidden" name="redirect_to" value={`/admin/workflows/${run.id}`} />
                <Button htmlType="submit" icon={<RobotOutlined />}>
                  运行 AI
                </Button>
              </form>
            ) : null}
          </Space>
        );
      },
    },
  ];

  const artifactColumns: TableColumnsType<WorkflowArtifactRow> = [
    {
      title: "名称",
      dataIndex: "title",
      render: (_, artifact) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{artifact.title}</Typography.Text>
          {artifact.description ? <Typography.Text type="secondary">{artifact.description}</Typography.Text> : null}
        </Space>
      ),
    },
    {
      title: "类型",
      dataIndex: "artifact_type",
      width: 110,
    },
    {
      title: "可见性",
      width: 110,
      render: (_, artifact) => (
        <AdminStatusTag
          status={artifact.visibility === "private" ? "archived" : "published"}
          label={artifact.visibility}
        />
      ),
    },
    {
      title: "状态",
      width: 110,
      render: (_, artifact) => (
        <AdminStatusTag status={artifact.status} label={getWorkflowStatusLabel(artifact.status)} />
      ),
    },
    {
      title: "更新时间",
      width: 130,
      render: (_, artifact) => formatWorkflowDateTime(artifact.created_at),
    },
  ];

  const approvalItems = run.approvals.map((approval: WorkflowApprovalRow) => ({
    color: approval.status === "approved" ? "green" : approval.status === "rejected" ? "red" : "blue",
    children: (
      <Space orientation="vertical" size={2}>
        <Space wrap>
          <Typography.Text strong>{approval.title}</Typography.Text>
          <AdminStatusTag status={approval.status} label={getWorkflowStatusLabel(approval.status)} />
        </Space>
        <Typography.Text type="secondary">
          {approval.approval_type} · {formatWorkflowDateTime(approval.created_at)}
        </Typography.Text>
      </Space>
    ),
  }));

  return (
    <div className="grid gap-4">
      <Card>
        <Flex justify="space-between" align="start" gap={16} wrap="wrap">
          <Space orientation="vertical" size={10}>
            <Space wrap>
              <Link href="/admin/workflows" className="text-muted-foreground">
                工作流 / 活动
              </Link>
              <AdminStatusTag status={run.status} label={getWorkflowStatusLabel(run.status)} />
            </Space>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {run.title}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: 0, maxWidth: 760 }}>
              {run.summary || run.relatedEventTitle || "这是一条社区运营流程，用于串联任务、AI 产物、审批和资料归档。"}
            </Typography.Paragraph>
          </Space>
          <Space wrap>
            <Button href="/admin/workflows" icon={<ArrowLeftOutlined />}>
              返回工作流
            </Button>
            {permissions.canRunAi && currentStep && currentAiJobType ? (
              <form action={runWorkflowAiJobAction}>
                <input type="hidden" name="run_id" value={run.id} />
                <input type="hidden" name="step_id" value={currentStep.id} />
                <input type="hidden" name="job_type" value={currentAiJobType} />
                <input type="hidden" name="redirect_to" value={`/admin/workflows/${run.id}`} />
                <Button type="primary" htmlType="submit" icon={<ThunderboltOutlined />}>
                  生成 AI 草稿
                </Button>
              </form>
            ) : null}
            {permissions.canReview && currentStep ? (
              <form action={requestWorkflowApprovalAction}>
                <input type="hidden" name="run_id" value={run.id} />
                <input type="hidden" name="step_id" value={currentStep.id} />
                <input type="hidden" name="title" value={`${currentStep.title} 审核`} />
                <input type="hidden" name="redirect_to" value={`/admin/workflows/${run.id}`} />
                <Button htmlType="submit" icon={<SendOutlined />}>
                  提交审批
                </Button>
              </form>
            ) : null}
            <Button href="/admin/events" icon={<GlobalOutlined />}>
              活动管理
            </Button>
          </Space>
        </Flex>

        <Divider />

        <Descriptions column={{ xs: 1, sm: 2, lg: 4 }} size="small">
          <Descriptions.Item label="流程编号">{run.id.slice(0, 12)}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatWorkflowDateTime(run.created_at)}</Descriptions.Item>
          <Descriptions.Item label="负责人">{run.ownerName ?? "未设置"}</Descriptions.Item>
          <Descriptions.Item label="截止时间">{formatWorkflowDateTime(run.due_at)}</Descriptions.Item>
        </Descriptions>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Card size="small">
            <Typography.Text type="secondary">步骤进度</Typography.Text>
            <Progress percent={run.progress.percent} strokeColor="#0f8f7e" />
            <Typography.Text type="secondary">
              {run.progress.done}/{run.progress.total}
            </Typography.Text>
          </Card>
          <Card size="small">
            <Typography.Text type="secondary">AI 任务</Typography.Text>
            <Typography.Title level={3} style={{ margin: "8px 0 0" }}>
              {run.aiJobs.length}
            </Typography.Title>
          </Card>
          <Card size="small">
            <Typography.Text type="secondary">活动资产</Typography.Text>
            <Typography.Title level={3} style={{ margin: "8px 0 0" }}>
              {run.artifacts.length}
            </Typography.Title>
          </Card>
          <Card size="small">
            <Typography.Text type="secondary">待审批</Typography.Text>
            <Typography.Title level={3} style={{ margin: "8px 0 0" }}>
              {run.approvals.filter((item) => item.status === "pending").length}
            </Typography.Title>
          </Card>
        </div>
      </Card>

      {message ? <Alert title={message} type={hasError ? "error" : "success"} showIcon /> : null}
      {queryErrors.length > 0 ? (
        <Alert title={`后台数据读取出现问题：${queryErrors.join(" | ")}`} type="warning" showIcon />
      ) : null}

      <Card title="活动生命周期">
        <Steps
          size="small"
          current={Math.max(run.steps.findIndex((step) => step.id === currentStep?.id), 0)}
          items={run.steps.slice(0, 8).map((step, index) => ({
            title: `${index + 1} ${step.title}`,
            description: (
              <Space orientation="vertical" size={2}>
                <AdminStatusTag status={step.status} label={getWorkflowStatusLabel(step.status)} />
                <Typography.Text type="secondary">{formatWorkflowDateTime(step.due_at)}</Typography.Text>
              </Space>
            ),
            status: getStepStatus(step.status),
          }))}
        />
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card title="工作流任务">
          <Table
            columns={stepColumns}
            dataSource={run.steps}
            rowKey="id"
            pagination={false}
            scroll={{ x: 980 }}
          />
        </Card>

        <Card
          title={
            <Space>
              <RobotOutlined />
              AI 执行面板
            </Space>
          }
        >
          {currentStep ? (
            <Space orientation="vertical" size={16} style={{ width: "100%" }}>
              <Card size="small">
                <Typography.Text type="secondary">当前任务</Typography.Text>
                <Typography.Title level={4} style={{ margin: "6px 0" }}>
                  {currentStep.title}
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
                  {currentStep.description ?? "选择一个可运行 AI 的节点，生成待审核草稿。"}
                </Typography.Paragraph>
              </Card>
              {renderAiOutput(currentAiJob)}
              {currentAiJob?.error_message ? (
                <Alert title={`最近一次 AI 任务失败：${currentAiJob.error_message}`} type="error" showIcon />
              ) : null}
            </Space>
          ) : (
            <Alert title="这个工作流还没有任务。" type="info" showIcon />
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card
          title={
            <Space>
              <FileTextOutlined />
              活动资产
            </Space>
          }
        >
          <Table
            columns={artifactColumns}
            dataSource={run.artifacts}
            rowKey="id"
            pagination={false}
            locale={{
              emptyText: "还没有产物。AI 草稿、海报、报名链接、复盘和资料索引都会记录在这里。",
            }}
            scroll={{ x: 720 }}
          />
        </Card>

        <Card title="审批记录">
          {approvalItems.length > 0 ? (
            <Timeline items={approvalItems} />
          ) : (
            <Alert title="还没有审批记录。官网发布、海报终稿、社媒外发和资料同步都应走审批。" type="info" showIcon />
          )}
        </Card>
      </div>
    </div>
  );
}
