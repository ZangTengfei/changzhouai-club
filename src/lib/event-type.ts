export const EVENT_TYPES = ["community", "external"] as const;

export type EventType = (typeof EVENT_TYPES)[number];

const eventTypeLabelMap: Record<EventType, string> = {
  community: "社区活动",
  external: "外部活动",
};

export function normalizeEventType(value: string | null | undefined): EventType {
  return EVENT_TYPES.includes(value as EventType) ? (value as EventType) : "community";
}

export function formatEventType(value: string | null | undefined) {
  const eventType = normalizeEventType(value);
  return eventTypeLabelMap[eventType];
}
