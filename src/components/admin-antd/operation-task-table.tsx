"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Card, Table, type TableColumnsType } from "antd";

import { AdminStatusTag } from "./admin-status-tag";

export type OperationTaskRow = {
  key: string;
  title: string;
  subtitle?: string;
  status: string;
  statusLabel: string;
  priority?: string;
  owner?: string;
  due?: string;
  href?: string;
};

export function OperationTaskTable({
  title,
  rows,
  actionLabel = "查看",
  extra,
}: {
  title: string;
  rows: OperationTaskRow[];
  actionLabel?: string;
  extra?: ReactNode;
}) {
  const columns: TableColumnsType<OperationTaskRow> = [
    {
      title: "事项",
      dataIndex: "title",
      render: (_, row) => (
        <div>
          <strong>{row.title}</strong>
          {row.subtitle ? <div className="text-xs text-muted-foreground">{row.subtitle}</div> : null}
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 110,
      render: (_, row) => <AdminStatusTag status={row.status} label={row.statusLabel} />,
    },
    {
      title: "负责人",
      dataIndex: "owner",
      width: 110,
      render: (value) => value || "未分配",
    },
    {
      title: "截止时间",
      dataIndex: "due",
      width: 120,
      render: (value) => value || "未设置",
    },
    {
      title: "操作",
      width: 92,
      align: "right",
      render: (_, row) =>
        row.href ? (
          <Button size="small">
            <Link href={row.href}>{actionLabel}</Link>
          </Button>
        ) : null,
    },
  ];

  return (
    <Card title={title} extra={extra} variant="outlined">
      <Table
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        locale={{ emptyText: "暂无待处理事项" }}
      />
    </Card>
  );
}
