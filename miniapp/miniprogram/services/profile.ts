import { apiRequest } from "./api";

export async function loadProfile() {
  const response = await apiRequest<{ profile: MiniappProfile }>({
    path: "/api/miniapp/profile",
    authenticated: true,
  });
  return response.profile;
}

export async function updateProfile(profile: MiniappProfileUpdate) {
  return apiRequest<{ profile: MiniappProfile; user: MiniappUser }>({
    path: "/api/miniapp/profile",
    method: "PUT",
    authenticated: true,
    data: profile,
  });
}
