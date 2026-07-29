import type { ReactNode } from "react";

import Link from "next/link";
import { Card, Tag } from "antd";
import { cn } from "@/lib/utils";

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

const toneClassName: Record<AdminTone, string> = {
  neutral: "border-stone-200 bg-stone-100 text-stone-700",
  draft: "border-stone-200 bg-stone-100 text-stone-700",
  scheduled: "border-teal-200 bg-teal-100 text-teal-700",
  completed: "border-emerald-200 bg-emerald-100 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-100 text-rose-700",
  new: "border-teal-200 bg-teal-100 text-teal-700",
  contacted: "border-amber-200 bg-amber-100 text-amber-700",
  qualified: "border-lime-200 bg-lime-100 text-lime-800",
  won: "border-emerald-200 bg-emerald-100 text-emerald-700",
  lost: "border-stone-200 bg-stone-200 text-stone-700",
  pending: "border-amber-200 bg-amber-100 text-amber-700",
  active: "border-emerald-200 bg-emerald-100 text-emerald-700",
  organizer: "border-teal-200 bg-teal-100 text-teal-700",
  admin: "border-amber-200 bg-amber-100 text-amber-800",
  paused: "border-stone-200 bg-stone-200 text-stone-700",
  registered: "border-teal-200 bg-teal-100 text-teal-700",
  waitlist: "border-amber-200 bg-amber-100 text-amber-700",
  attended: "border-emerald-200 bg-emerald-100 text-emerald-700",
};

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
    <Card
      variant="borderless"
      className={cn(
        "admin-panel overflow-hidden rounded-admin-lg border border-admin-border bg-admin-surface shadow-admin [&_.ant-card-body]:p-0",
        className,
      )}
    >
      {children}
    </Card>
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
        "admin-panel-header flex items-start justify-between gap-4 border-b border-admin-divider bg-admin-surface px-5 py-4 max-sm:flex-col max-sm:px-4 max-sm:py-3.5 [&>div:first-child]:min-w-0 [&_p]:m-0 [&_p]:mb-1",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="admin-panel-title m-0 text-[17px] font-semibold leading-[1.4] text-admin-foreground">
          {title}
        </h2>
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
    <div className={cn("admin-panel-body bg-admin-surface p-5 max-sm:p-4", className)}>
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
        "admin-metric min-w-24 rounded-admin border border-admin-border bg-[#fafafa] px-3.5 py-3",
        className,
      )}
    >
      <div className="text-xl font-semibold leading-none text-admin-foreground">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[#8c8c8c]">
        {label}
      </div>
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
    <div
      className={cn(
        "admin-notice rounded-admin border border-[#bae0ff] bg-admin-primary-soft px-3 py-2.5 text-sm text-[#475569]",
        className,
      )}
    >
      {children}
    </div>
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
    <Tag
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        toneClassName[tone],
        className,
      )}
    >
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
    <label className={cn("admin-field grid gap-2", className)}>
      <span className="text-[13px] font-medium tracking-normal text-[#4b5563] normal-case">
        {label}
      </span>
      {children}
    </label>
  );
}

export function AdminCheckboxRow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "admin-checkbox-row flex items-center gap-2 rounded-admin border border-admin-border bg-[#fafafa] px-3 py-2 text-sm text-[#374151]",
        className,
      )}
    >
      {children}
    </label>
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
