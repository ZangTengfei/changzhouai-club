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
  recruiting: "green",
  matching: "cyan",
  in_progress: "blue",
  filled: "green",
  public: "green",
  members: "cyan",
  private: "default",
  new: "cyan",
  waitlist: "cyan",
  shortlisted: "blue",
  introduced: "blue",
  not_fit: "red",
  withdrawn: "red",
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
