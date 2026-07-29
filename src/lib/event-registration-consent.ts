export const EVENT_REGISTRATION_CONSENT_VERSION = "2026-07-30";
export const EVENT_PORTRAIT_CONSENT_VERSION = "2026-07-30";

export function eventRegistrationConsentKey(eventId: string) {
  return `event-registration:${EVENT_REGISTRATION_CONSENT_VERSION}:${eventId}`;
}

export function eventPortraitConsentKey(eventId: string) {
  return `event-portrait:${EVENT_PORTRAIT_CONSENT_VERSION}:${eventId}`;
}
