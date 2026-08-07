import { apiRequest, getStoredSessionToken } from "./api";

export type MemberPoolQuery = {
  query?: string;
  city?: string;
  industry?: string;
  skill?: string;
  intent?: "share" | "projects" | "seeking" | "";
  page?: number;
};

export function loadMemberPool(filters: MemberPoolQuery = {}) {
  const search = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  return apiRequest<MiniappMemberPoolResponse>({
    path: `/api/miniapp/members${search ? `?${search}` : ""}`,
    authenticated: Boolean(getStoredSessionToken()),
  });
}
