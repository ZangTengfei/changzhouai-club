import type { ReactNode } from "react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  scheduled: "border-sky-200 bg-sky-100 text-sky-700",
  completed: "border-emerald-200 bg-emerald-100 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-100 text-rose-700",
  new: "border-sky-200 bg-sky-100 text-sky-700",
  contacted: "border-amber-200 bg-amber-100 text-amber-700",
  qualified: "border-violet-200 bg-violet-100 text-violet-700",
  won: "border-emerald-200 bg-emerald-100 text-emerald-700",
  lost: "border-slate-200 bg-slate-200 text-slate-700",
  pending: "border-amber-200 bg-amber-100 text-amber-700",
  active: "border-emerald-200 bg-emerald-100 text-emerald-700",
  organizer: "border-indigo-200 bg-indigo-100 text-indigo-700",
  admin: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700",
  paused: "border-slate-200 bg-slate-200 text-slate-700",
  registered: "border-sky-200 bg-sky-100 text-sky-700",
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
      className={cn(
        "border-border/70 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur",
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
        "flex flex-col gap-3 border-b border-border/70 px-4 py-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <CardTitle className="text-lg text-foreground">{title}</CardTitle>
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
  return <CardContent className={cn("px-4 pb-4 pt-4", className)}>{children}</CardContent>;
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
        "min-w-[88px] rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/40 px-3 py-2",
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
        "rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/50 px-3 py-2 text-sm text-muted-foreground",
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
    <label className={cn("grid gap-2", className)}>
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
        "flex items-center gap-2 rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 px-3 py-2 text-sm text-foreground",
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
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
