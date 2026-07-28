import { apiRequest } from "./api";

const EVENT_REGISTRATION_CONSENT_VERSION = "2026-07-28";
const EVENT_PORTRAIT_CONSENT_VERSION = "2026-07-28";

type RegistrationResponse = {
  registration: MiniappRegistration | null;
};

export async function loadEventRegistration(slug: string) {
  const response = await apiRequest<RegistrationResponse>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/registration`,
    authenticated: true,
  });
  return response.registration;
}

export async function registerForEvent(
  slug: string,
  note: string,
  consent: {
    portraitConsentAccepted: boolean;
    registrationConsentAccepted: boolean;
  },
) {
  const response = await apiRequest<RegistrationResponse>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/registration`,
    method: "PUT",
    authenticated: true,
    data: {
      note,
      ...consent,
      registrationConsentVersion: EVENT_REGISTRATION_CONSENT_VERSION,
      portraitConsentVersion: EVENT_PORTRAIT_CONSENT_VERSION,
    },
  });
  return response.registration;
}

export async function cancelEventRegistration(slug: string) {
  const response = await apiRequest<RegistrationResponse>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/registration`,
    method: "DELETE",
    authenticated: true,
  });
  return response.registration;
}

export async function loadMyRegistrations() {
  const response = await apiRequest<{ registrations: MiniappRegistration[] }>({
    path: "/api/miniapp/registrations",
    authenticated: true,
  });
  return response.registrations;
}
