"use client";

import type { ReactNode } from "react";
import { Alert, Card, Space, Statistic, Typography } from "antd";

type AdminAntdStat = {
  label: string;
  value: number | string;
};

export function AdminAntdPageHeader({
  eyebrow,
  title,
  stats,
  actions,
}: {
  eyebrow: string;
  title: string;
  stats?: AdminAntdStat[];
  actions?: ReactNode;
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography.Text type="secondary">{eyebrow}</Typography.Text>
          <Typography.Title level={2} style={{ margin: "4px 0 0" }}>
            {title}
          </Typography.Title>
        </div>
        <Space wrap size="large">
          {stats?.map((stat) => (
            <Statistic key={stat.label} title={stat.label} value={stat.value} />
          ))}
          {actions}
        </Space>
      </div>
    </Card>
  );
}

export function AdminAntdCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <Card
      title={
        <Space orientation="vertical" size={0}>
          {eyebrow ? <Typography.Text type="secondary">{eyebrow}</Typography.Text> : null}
          <span>{title}</span>
        </Space>
      }
    >
      {children}
    </Card>
  );
}

export function AdminRecordCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Card
      size="small"
      className="min-w-0"
      styles={{
        body: {
          overflow: "hidden",
          padding: 0,
        },
      }}
    >
      {children}
    </Card>
  );
}

export function AdminAntdAlert({
  message,
  type = "warning",
}: {
  message: string;
  type?: "success" | "info" | "warning" | "error";
}) {
  return <Alert title={message} type={type} showIcon />;
}
