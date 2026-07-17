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
