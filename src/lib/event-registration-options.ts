export const EVENT_REGISTRATION_MODES = ["instant", "review"] as const;

export type EventRegistrationMode =
  (typeof EVENT_REGISTRATION_MODES)[number];

export function normalizeEventRegistrationMode(
  value: unknown,
): EventRegistrationMode {
  return value === "review" ? "review" : "instant";
}

export function parseEventRegistrationMode(
  value: unknown,
): EventRegistrationMode {
  const mode = String(value ?? "instant").trim();
  if (!EVENT_REGISTRATION_MODES.includes(mode as EventRegistrationMode)) {
    throw new Error("invalid_registration_mode");
  }

  return mode as EventRegistrationMode;
}

export function parseEventRegistrationCapacity(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const capacity = Number(value);
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error("invalid_registration_capacity");
  }

  return capacity;
}
