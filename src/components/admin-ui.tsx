import type { ReactNode } from "react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes
    .flatMap((className) =>
      typeof className === "string" ? className.split(/\s+/) : [],
    )
    .filter(Boolean)
    .map((className) =>
      styles[className as keyof typeof styles]
        ? `${styles[className as keyof typeof styles]} ${className}`
        : className,
    )
    .join(" ");
}

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
      className={cn(
        cx(
          "admin-panel border-border/70 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur",
        ),
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
    <CardHeader
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
        <CardTitle className={cx("admin-panel-title text-lg text-foreground")}>
          {title}
        </CardTitle>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </CardHeader>
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
    <CardContent
      className={cn(cx("admin-panel-body px-4 pb-4 pt-4"), className)}
    >
      {children}
    </CardContent>
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
      <div className="text-lg font-semibold leading-none text-foreground">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
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
        cx(
          "admin-notice rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/50 px-3 py-2 text-sm text-muted-foreground",
        ),
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
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        toneClassName[tone],
        className,
      )}
    >
      {children}
    </Badge>
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
    <label className={cn(cx("admin-field grid gap-2"), className)}>
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
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
        cx(
          "admin-checkbox-row flex items-center gap-2 rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 px-3 py-2 text-sm text-foreground",
        ),
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
