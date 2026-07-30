import { apiRequest } from "./api";

export async function loadProfile() {
  return apiRequest<{
    profile: MiniappProfile;
    options: MiniappProfileOptions;
  }>({
    path: "/api/miniapp/profile",
    authenticated: true,
  });
}

export async function updateProfile(profile: MiniappProfileUpdate) {
  return apiRequest<{
    profile: MiniappProfile;
    user: MiniappUser;
    options: MiniappProfileOptions;
  }>({
    path: "/api/miniapp/profile",
    method: "PUT",
    authenticated: true,
    data: profile,
  });
}

export async function loadSharedProfile(handle: string, eventSlug = "") {
  const eventQuery = eventSlug
    ? `?event=${encodeURIComponent(eventSlug)}`
    : "";
  return apiRequest<{ profile: MiniappSharedProfile }>({
    path: `/api/miniapp/members/${encodeURIComponent(handle)}${eventQuery}`,
    authenticated: Boolean(eventSlug),
  });
}
