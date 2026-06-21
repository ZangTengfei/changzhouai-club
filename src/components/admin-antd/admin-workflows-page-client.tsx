"use client";

import Link from "next/link";
import {
  ApartmentOutlined,
  CalendarOutlined,
  PlusOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";

import { createWorkflowRunAction } from "@/app/admin/workflows/actions";
import { AdminStatusTag } from "@/components/admin-antd";
import { NativeSelect } from "@/components/ui/native-select";
import { formatWorkflowDateTime, getWorkflowStatusLabel } from "@/lib/admin/workflow-display";
import type { AdminWorkflowRun, AdminWorkflowsData } from "@/lib/admin/workflows";

export function AdminWorkflowsPageClient({
  data,
  message,
  hasError,
}: {
  data: AdminWorkflowsData;
  message: string | null;
  hasError: boolean;
}) {
  const columns: TableColumnsType<AdminWorkflowRun> = [
    {
      title: "工作流",
      dataIndex: "title",
      render: (_, run) => (
        <div>
          <Link className="font-semibold text-foreground hover:text-primary" href={`/admin/workflows/${run.id}`}>
            {run.title}
          </Link>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{run.templateName ?? "自定义流程"}</span>
            {run.relatedEventTitle ? <span>关联：{run.relatedEventTitle}</span> : null}
          </div>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (_, run) => <AdminStatusTag status={run.status} label={getWorkflowStatusLabel(run.status)} />,
    },
    {
      title: "进度",
      width: 180,
      render: (_, run) => (
        <Space size={8}>
          <Progress
            percent={run.progress.percent}
            showInfo={false}
            size="small"
            strokeColor="#0f8f7e"
            style={{ width: 96 }}
          />
          <span className="text-xs text-muted-foreground">
            {run.progress.done}/{run.progress.total}
          </span>
        </Space>
      ),
    },
    {
      title: "AI",
      width: 90,
      render: (_, run) => (
        <Space size={6}>
          <RobotOutlined />
          {run.aiJobs.length}
        </Space>
      ),
    },
    {
      title: "审批",
      width: 90,
      render: (_, run) => run.approvals.filter((approval) => approval.status === "pending").length,
    },
    {
      title: "到期",
      dataIndex: "due_at",
      width: 130,
      render: (value) => formatWorkflowDateTime(value),
    },
  ];

  return (
    <div className="grid gap-4">
      <Card variant="outlined">
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col>
            <Typography.Text type="secondary">Operations OS</Typography.Text>
            <Typography.Title level={2} style={{ margin: 0 }}>
              工作流中枢
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
              把活动、资料、AI 任务、审批和后续合作线索串成可分工的运营流程。
            </Typography.Paragraph>
          </Col>
          <Col>
            <Space wrap>
              <Statistic title="工作流" value={data.stats.total} />
              <Statistic title="进行中" value={data.stats.active} />
              <Statistic title="待审批" value={data.stats.pendingApprovals} />
              <Statistic title="AI 待审" value={data.stats.aiNeedsReview} />
            </Space>
          </Col>
        </Row>
      </Card>

      {message ? <Alert title={message} type={hasError ? "error" : "success"} showIcon /> : null}
      {data.queryErrors.length > 0 ? (
        <Alert title={`后台数据读取出现问题：${data.queryErrors.join(" | ")}`} type="warning" showIcon />
      ) : null}

      {data.permissions.canWrite ? (
        <Card title="创建活动工作流" variant="outlined">
          <form action={createWorkflowRunAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_0.7fr_auto]">
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">工作流标题</span>
              <Input name="title" placeholder="例如：AIGC 视频创作沙龙" />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">关联活动</span>
              <NativeSelect name="related_event_id" defaultValue="">
                <option value="">不关联现有活动</option>
                {data.eventOptions.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} · {formatWorkflowDateTime(event.event_at)}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">优先级</span>
              <NativeSelect name="priority" defaultValue="normal">
                <option value="normal">普通</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
                <option value="low">低</option>
              </NativeSelect>
            </label>
            <div className="flex items-end">
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                创建流程
              </Button>
            </div>
            <input type="hidden" name="template_id" value={data.templates[0]?.id ?? ""} />
            <label className="grid gap-2 lg:col-span-4">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">简要说明</span>
              <Input
                name="summary"
                placeholder="可选：这场活动希望解决什么问题、面向哪些人、需要沉淀什么资产"
              />
            </label>
          </form>
        </Card>
      ) : null}

      <Card
        title="运营工作流"
        extra={
          <Space>
            <Button icon={<CalendarOutlined />}>
              <Link href="/admin/events">活动管理</Link>
            </Button>
            <Button icon={<ApartmentOutlined />}>
              <Link href="/admin">总控台</Link>
            </Button>
          </Space>
        }
        variant="outlined"
      >
        <Table
          columns={columns}
          dataSource={data.runs}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          locale={{
            emptyText: "还没有工作流。先创建一场活动工作流，系统会自动生成完整筹备步骤。",
          }}
        />
      </Card>

      <Card variant="outlined">
        <Space align="start">
          <SafetyCertificateOutlined className="text-primary" />
          <span className="text-sm text-muted-foreground">
            第一版聚焦新活动全流程：主题分析、筹备、官网发布、复盘、社媒分发和资料归档。
          </span>
        </Space>
      </Card>
    </div>
  );
}
