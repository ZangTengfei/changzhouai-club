import { apiRequest } from "./api";

export function bindPhoneNumber(code: string) {
  return apiRequest<{ user: MiniappUser }>({
    path: "/api/miniapp/profile/phone",
    method: "POST",
    authenticated: true,
    data: { code },
  });
}
