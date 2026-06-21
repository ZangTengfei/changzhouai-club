"use client";

import type { ReactNode } from "react";
import { Card, Space, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";

import styles from "./operation-metric-card.module.css";

type OperationMetricCardProps = {
  title: string;
  value: ReactNode;
  compareLabel: string;
  delta?: number;
  icon: ReactNode;
  tone?: "teal" | "orange" | "blue" | "green" | "red";
};

export function OperationMetricCard({
  title,
  value,
  compareLabel,
  delta,
  icon,
  tone = "teal",
}: OperationMetricCardProps) {
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className={styles.card} variant="outlined">
      <Space align="center" size={14}>
        <span className={`${styles.icon} ${styles[tone]}`}>{icon}</span>
        <span>
          <Typography.Text className={styles.title}>{title}</Typography.Text>
          <strong className={styles.value}>{value}</strong>
        </span>
      </Space>
      <div className={styles.compare}>
        <span>{compareLabel}</span>
        {typeof delta === "number" ? (
          <span className={positive ? styles.up : styles.down}>
            {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(delta)}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
