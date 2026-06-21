"use client";

import {
  Children,
  isValidElement,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Alert, Card, Checkbox, Form, Select, Statistic, Tag } from "antd";

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

type NativeOptionProps = ComponentProps<"option">;
type NativeSelectProps = Omit<ComponentProps<"select">, "onChange" | "value"> & {
  value?: string;
  onChange?: (value: string) => void;
};

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

function getOptionText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getOptionText).join("");
  }

  return "";
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
      className={cn("min-w-0 bg-card/95 shadow-[0_10px_28px_rgba(15,23,42,0.05)]", className)}
      styles={{ body: { padding: 0 } }}
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
        <div className="text-lg font-semibold text-foreground">{title}</div>
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
  return <div className={cn("px-4 pb-4 pt-4", className)}>{children}</div>;
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
    <Card size="small" className={cn("min-w-[88px]", className)} styles={{ body: { padding: 12 } }}>
      {typeof value === "string" || typeof value === "number" ? (
        <Statistic title={label} value={value} />
      ) : (
        <div className="grid gap-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <div className="text-lg font-semibold leading-none text-foreground">{value}</div>
        </div>
      )}
    </Card>
  );
}

export function AdminNotice({
  children,
  className,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <Alert className={className} message={children} type="info" showIcon />;
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
    <Tag color={toneColor[tone]} className={className}>
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
    <Form.Item className={className} label={label} colon={false} layout="vertical">
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
  const [isChecked, setIsChecked] = useState(Boolean(checkboxDefaultChecked));

  return (
    <Card size="small" className={className} styles={{ body: { padding: "8px 12px" } }}>
      {checkboxName && isChecked ? (
        <input type="hidden" name={checkboxName} value={checkboxValue ?? "on"} />
      ) : null}
      <Checkbox
        checked={isChecked}
        disabled={checkboxDisabled}
        onChange={(event) => setIsChecked(event.target.checked)}
      >
        {labelChildren}
      </Checkbox>
    </Card>
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

export function NativeSelect({
  className,
  children,
  defaultValue,
  disabled,
  name,
  required: _required,
  value,
  onChange,
}: NativeSelectProps) {
  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => {
      const option = child as ReactElement<NativeOptionProps>;
      const optionValue = String(option.props.value ?? getOptionText(option.props.children));

      return {
        label: option.props.children,
        value: optionValue,
        disabled: option.props.disabled,
      };
    });
  const fallbackValue =
    typeof defaultValue === "string" ? defaultValue : String(defaultValue ?? options[0]?.value ?? "");
  const [innerValue, setInnerValue] = useState(fallbackValue);
  const selectedValue = value ?? innerValue;

  return (
    <>
      {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
      <Select
        className={className}
        value={selectedValue}
        disabled={disabled}
        options={options}
        onChange={(nextValue) => {
          setInnerValue(nextValue);
          onChange?.(nextValue);
        }}
      />
    </>
  );
}
