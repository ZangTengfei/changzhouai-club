"use client";

import { Tag } from "antd";

const statusColorMap: Record<string, string> = {
  active: "green",
  scheduled: "green",
  completed: "green",
  done: "green",
  approved: "green",
  succeeded: "green",
  published: "green",
  attended: "green",
  registered: "cyan",
  organizer: "cyan",
  admin: "gold",
  pending: "gold",
  waiting_review: "gold",
  needs_review: "gold",
  in_review: "gold",
  reviewing: "gold",
  changes_requested: "orange",
  running: "blue",
  doing: "blue",
  contacted: "blue",
  qualified: "green",
  new: "cyan",
  draft: "default",
  queued: "default",
  todo: "default",
  paused: "default",
  blocked: "red",
  failed: "red",
  rejected: "red",
  cancelled: "red",
  lost: "red",
  archived: "default",
};

export function AdminStatusTag({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <Tag color={statusColorMap[status] ?? "default"} variant="filled">
      {label}
    </Tag>
  );
}
