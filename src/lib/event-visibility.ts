export type EventVisibility = "public" | "admin_only";

export function parseEventVisibility(value: unknown): EventVisibility {
  return value === "admin_only" ? "admin_only" : "public";
}

export function formatEventVisibility(value: string | null | undefined) {
  return value === "admin_only" ? "仅管理员可见" : "公开可见";
}
