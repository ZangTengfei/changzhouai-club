import { getApiBaseUrl } from "./config";
import { getStoredSessionToken } from "./api";

export function uploadAvatar(filePath: string) {
  const token = getStoredSessionToken();
  if (!token) return Promise.reject(new Error("unauthorized"));

  return new Promise<{ avatarUrl: string; user: MiniappUser }>((resolve, reject) => {
    wx.uploadFile({
      url: `${getApiBaseUrl()}/api/miniapp/profile/avatar`,
      filePath,
      name: "file",
      header: { Authorization: `Bearer ${token}` },
      success(response) {
        const body = (() => {
          try {
            return JSON.parse(response.data) as {
              avatarUrl?: string;
              user?: MiniappUser;
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

        reject(new Error("avatar_upload_failed"));
      },
      fail: reject,
    });
  });
}
