import { apiRequest } from "./api";

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

export async function registerForEvent(slug: string, note: string) {
  const response = await apiRequest<RegistrationResponse>({
    path: `/api/miniapp/events/${encodeURIComponent(slug)}/registration`,
    method: "PUT",
    authenticated: true,
    data: { note },
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
