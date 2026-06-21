"use client";

import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";

import Link from "next/link";
import { Alert, Card as AntCard, Checkbox, Form, Statistic, Tag } from "antd";

import { cn, cssModuleCxWithGlobals } from "@/lib/utils";

import styles from "./admin-ui.module.css";

export type AdminTone =
  | "neutral"
  | "draft"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "new"
  | "contacted"
  | "qualified"
  | "won"
  | "lost"
  | "pending"
  | "active"
  | "organizer"
  | "admin"
  | "paused"
  | "registered"
  | "waitlist"
  | "attended";

const toneColor: Record<AdminTone, string> = {
  neutral: "default",
  draft: "default",
  scheduled: "green",
  completed: "green",
  cancelled: "red",
  new: "cyan",
  contacted: "blue",
  qualified: "green",
  won: "green",
  lost: "default",
  pending: "gold",
  active: "green",
  organizer: "cyan",
  admin: "gold",
  paused: "default",
  registered: "cyan",
  waitlist: "gold",
  attended: "green",
};

const cx = cssModuleCxWithGlobals.bind(null, styles);

export function AdminPageStack({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>;
}

export function AdminPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <AntCard
      className={cn(
        cx(
          "admin-panel min-w-0 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur",
        ),
        className,
      )}
      variant="outlined"
    >
      {children}
    </AntCard>
  );
}

export function AdminPanelHeader({
  eyebrow,
  title,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        cx(
          "admin-panel-header flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-start sm:justify-between",
        ),
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <div className={cx("admin-panel-title text-lg font-semibold text-foreground")}>
          {title}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminPanelBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(cx("admin-panel-body px-4 pb-4 pt-4"), className)}
    >
      {children}
    </div>
  );
}

export function AdminMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        cx(
          "admin-metric min-w-[88px] rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/40 px-3 py-2",
        ),
        className,
      )}
    >
      <Statistic title={label} value={typeof value === "string" || typeof value === "number" ? value : undefined} />
      {typeof value !== "string" && typeof value !== "number" ? (
        <div className="text-lg font-semibold leading-none text-foreground">{value}</div>
      ) : null}
    </div>
  );
}

export function AdminNotice({
  children,
  className,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Alert className={className} title={children} type="info" showIcon />
  );
}

export function AdminStatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: AdminTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tag color={toneColor[tone]} variant="filled" className={className}>
      {children}
    </Tag>
  );
}

export function AdminField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Form.Item
      className={cn(cx("admin-field"), className)}
      label={label}
      colon={false}
      layout="vertical"
    >
      {children}
    </Form.Item>
  );
}

export function AdminCheckboxRow({
  className,
  name,
  value,
  defaultChecked,
  disabled,
  children,
}: {
  className?: string;
  name?: string;
  value?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  const childArray = Children.toArray(children);
  const inputElement = childArray.find(
    (child): child is ReactElement<ComponentProps<"input">> =>
      isValidElement(child) && child.type === "input",
  );
  const labelChildren = childArray.filter((child) => child !== inputElement);
  const inputProps = inputElement?.props;
  const checkboxName = name ?? inputProps?.name;
  const checkboxValue = value ?? (inputProps?.value ? String(inputProps.value) : undefined);
  const checkboxDefaultChecked = defaultChecked ?? inputProps?.defaultChecked;
  const checkboxDisabled = disabled ?? inputProps?.disabled;

  return (
    <div
      className={cn(
        cx(
          "admin-checkbox-row flex items-center gap-2 rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 px-3 py-2 text-sm text-foreground",
        ),
        className,
      )}
    >
      <Checkbox
        name={checkboxName}
        value={checkboxValue}
        defaultChecked={checkboxDefaultChecked}
        disabled={checkboxDisabled}
      >
        {labelChildren}
      </Checkbox>
    </div>
  );
}

export function AdminFilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "admin-filter-link inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "admin-filter-link-active border-primary/30 bg-primary/10 text-primary"
          : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
