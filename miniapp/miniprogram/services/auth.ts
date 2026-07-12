import {
  apiRequest,
  clearSessionToken,
  getStoredSessionToken,
  storeSessionToken,
} from "./api";
import { trackEvent } from "./analytics";

type LoginResponse = {
  token: string;
  expiresAt: string;
  user: MiniappUser;
};

type MeResponse = {
  expiresAt: string;
  user: MiniappUser;
};

let pendingSession: Promise<MiniappUser> | null = null;

function getWechatLoginCode() {
  return new Promise<string>((resolve, reject) => {
    wx.login({
      success(result) {
        if (result.code) {
          resolve(result.code);
          return;
        }

        reject(new Error("missing_wechat_login_code"));
      },
      fail() {
        reject(new Error("wechat_login_failed"));
      },
    });
  });
}

export async function login() {
  const code = await getWechatLoginCode();
  const response = await apiRequest<LoginResponse>({
    path: "/api/miniapp/auth/login",
    method: "POST",
    data: { code },
  });

  storeSessionToken(response.token);
  trackEvent("login_success", "app");
  return response.user;
}

export function ensureSession() {
  if (!pendingSession) {
    pendingSession = (async () => {
      if (getStoredSessionToken()) {
        try {
          const response = await apiRequest<MeResponse>({
            path: "/api/miniapp/auth/me",
            authenticated: true,
          });
          return response.user;
        } catch {
          clearSessionToken();
        }
      }

      return login();
    })().finally(() => {
      pendingSession = null;
    });
  }

  return pendingSession;
}

export async function logout() {
  try {
    if (pendingSession) {
      await pendingSession.catch(() => undefined);
    }
    await apiRequest<{ loggedOut: boolean }>({
      path: "/api/miniapp/auth/logout",
      method: "POST",
      authenticated: true,
    });
  } finally {
    pendingSession = null;
    clearSessionToken();
  }
}
