"use client";

import Link from "next/link";
import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FormOutlined,
  GlobalOutlined,
  TeamOutlined,
  MoreOutlined,
  NotificationOutlined,
  ReloadOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Flex,
  Progress,
  Row,
  Space,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";

import type {
  AdminOperationsData,
  OperationAiTaskRow,
  OperationAssetRow,
  OperationWorkflowRow,
} from "@/lib/admin/operations";

import { AdminStatusTag } from "./admin-status-tag";
import { OperationMetricCard } from "./operation-metric-card";
import styles from "./admin-operations-dashboard.module.css";

const metricIcons = {
  "weekly-events": <CalendarOutlined />,
  "pending-work": <FormOutlined />,
  "ai-review": <RobotOutlined />,
  leads: <TeamOutlined />,
  assets: <FileTextOutlined />,
} as const;

export function AdminOperationsDashboard({ data }: { data: AdminOperationsData }) {
  const workflowColumns: TableColumnsType<OperationWorkflowRow> = [
    {
      title: "活动与阶段",
      dataIndex: "title",
      render: (_, row) => (
        <Space>
          <Avatar shape="square" size={42} className={styles.workflowAvatar}>
            {row.title.slice(0, 1)}
          </Avatar>
          <span>
            <Link className={styles.primaryLink} href={`/admin/workflows/${row.id}`}>
              {row.title}
            </Link>
            <div className={styles.mutedText}>{row.subtitle}</div>
          </span>
        </Space>
      ),
    },
    {
      title: "进度",
      dataIndex: "progressPercent",
      width: 170,
      render: (_, row) => (
        <Space size={8}>
          <Progress
            percent={row.progressPercent}
            showInfo={false}
            size="small"
            strokeColor="#0f8f7e"
            className={styles.workflowProgress}
          />
          <span className={styles.mutedText}>{row.progressText}</span>
        </Space>
      ),
    },
    {
      title: "下一步动作",
      dataIndex: "nextAction",
    },
    {
      title: "负责人",
      dataIndex: "owner",
      width: 110,
      render: (value) => (
        <Space size={6}>
          <Avatar size={24}>{String(value).slice(0, 1)}</Avatar>
          {value}
        </Space>
      ),
    },
    {
      title: "截止时间",
      dataIndex: "due",
      width: 100,
    },
    {
      title: "状态",
      width: 92,
      render: (_, row) => <AdminStatusTag status={row.status} label={row.statusLabel} />,
    },
  ];

  const aiColumns: TableColumnsType<OperationAiTaskRow> = [
    {
      title: "任务名称",
      dataIndex: "title",
      render: (_, row) =>
        row.href ? (
          <Link className={styles.primaryLink} href={row.href}>
            {row.title}
          </Link>
        ) : (
          row.title
        ),
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 86,
      render: (value) => <Badge color="#2563eb" text={value} />,
    },
    {
      title: "状态",
      width: 118,
      render: (_, row) => <AdminStatusTag status={row.status} label={row.statusLabel} />,
    },
    {
      title: "进度",
      dataIndex: "progress",
      width: 150,
      render: (value) => <Progress percent={value} size="small" />,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      width: 136,
    },
    {
      title: "创建人",
      dataIndex: "creator",
      width: 92,
    },
  ];

  const assetColumns: TableColumnsType<OperationAssetRow> = [
    {
      title: "名称",
      dataIndex: "title",
      render: (_, row) =>
        row.href ? (
          <Link className={styles.primaryLink} href={row.href}>
            {row.title}
          </Link>
        ) : (
          row.title
        ),
    },
    {
      title: "类型",
      dataIndex: "type",
      width: 86,
    },
    {
      title: "索引状态",
      width: 112,
      render: (_, row) => <AdminStatusTag status={row.status} label={row.statusLabel} />,
    },
    {
      title: "隐私级别",
      dataIndex: "visibility",
      width: 96,
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      width: 130,
    },
  ];

  return (
    <div className={styles.dashboard}>
      <Flex align="center" justify="space-between" className={styles.header}>
        <div>
          <Typography.Title level={2} className={styles.title}>
            运营总控台
          </Typography.Title>
          <Typography.Text type="secondary">
            汇总活动、AI 产物、审批、资料和合作线索，先看到今天最该处理的事情。
          </Typography.Text>
        </div>
        <Space size={16}>
          <Button icon={<CalendarOutlined />}>2025-05-20 周二</Button>
          <Badge count={6} size="small">
            <Button icon={<BellOutlined />} />
          </Badge>
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            刷新
          </Button>
        </Space>
      </Flex>

      {data.queryErrors.length > 0 ? (
        <Card className={styles.warningCard}>
          后台数据读取出现问题：{data.queryErrors.join(" | ")}
        </Card>
      ) : null}

      <Row gutter={[16, 16]}>
        {data.metrics.map((metric) => (
          <Col key={metric.key} xs={24} sm={12} xl={24 / 5}>
            <OperationMetricCard
              title={metric.title}
              value={metric.value}
              compareLabel={metric.compareLabel}
              delta={metric.delta}
              tone={metric.tone}
              icon={metricIcons[metric.key as keyof typeof metricIcons] ?? <GlobalOutlined />}
            />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="进行中的活动工作流"
            extra={<Link href="/admin/workflows">查看全部工作流</Link>}
            variant="outlined"
          >
            <Table
              columns={workflowColumns}
              dataSource={data.workflows}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: "暂无进行中的工作流" }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card
            title="待审批动作"
            extra={<Link href="/admin/workflows">查看全部</Link>}
            variant="outlined"
          >
            <div className={styles.approvalList}>
              {data.approvals.length > 0 ? (
                data.approvals.map((approval) => (
                  <div key={approval.id} className={styles.approvalItem}>
                    <Avatar size={54} className={styles.approvalIcon}>
                      <CheckCircleOutlined />
                    </Avatar>
                    <div className={styles.approvalBody}>
                      <strong>{approval.title}</strong>
                      <span>{approval.subtitle}</span>
                    </div>
                    <AdminStatusTag status={approval.status} label={approval.priority} />
                    <Button>
                      <Link href={approval.href}>去审批</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className={styles.emptyBlock}>暂无待审批动作</div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title="AI 任务队列"
            extra={
              <Space>
                <RobotOutlined />
                <Link href="/admin/workflows">查看全部任务</Link>
              </Space>
            }
            variant="outlined"
          >
            <Table
              columns={aiColumns}
              dataSource={data.aiTasks}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: "暂无 AI 任务" }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card
            title="资料资产提醒"
            extra={
              <Button type="text" icon={<MoreOutlined />}>
                查看全部
              </Button>
            }
            variant="outlined"
          >
            <Table
              columns={assetColumns}
              dataSource={data.assets}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: "暂无资料资产" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
