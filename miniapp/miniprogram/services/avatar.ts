import { getApiBaseUrl } from "./config";
import {
  ApiError,
  clearSessionToken,
  getStoredSessionToken,
} from "./api";

export function uploadAvatar(filePath: string, policyVersion: string) {
  const token = getStoredSessionToken();
  if (!token) return Promise.reject(new Error("unauthorized"));

  return new Promise<{ avatarUrl: string; user: MiniappUser }>((resolve, reject) => {
    wx.uploadFile({
      url: `${getApiBaseUrl()}/api/miniapp/profile/avatar`,
      filePath,
      name: "file",
      formData: {
        privacyAccepted: "true",
        policyVersion,
      },
      header: { Authorization: `Bearer ${token}` },
      success(response) {
        const body = (() => {
          try {
            return JSON.parse(response.data) as {
              avatarUrl?: string;
              user?: MiniappUser;
              error?: string;
              requestId?: string;
            };
          } catch {
            return null;
          }
        })();

        if (
          response.statusCode >= 200 &&
          response.statusCode < 300 &&
          body?.avatarUrl &&
          body.user
        ) {
          resolve({ avatarUrl: body.avatarUrl, user: body.user });
          return;
        }

        if (response.statusCode === 401) {
          clearSessionToken();
        }
        reject(
          new ApiError(
            response.statusCode,
            body?.error ?? "avatar_upload_failed",
            typeof body?.requestId === "string" ? body.requestId : null,
          ),
        );
      },
      fail() {
        reject(new ApiError(0, "network_error"));
      },
    });
  });
}
