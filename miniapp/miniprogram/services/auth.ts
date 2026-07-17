import {
  ApiError,
  apiRequest,
  clearSessionToken,
  getStoredSessionToken,
  storeSessionToken,
} from "./api";
import { trackEvent } from "./analytics";

const LOGIN_RETRY_DELAY_MS = 300;

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

function getMiniappRuntimeInfo() {
  try {
    const { envVersion, version } = wx.getAccountInfoSync().miniProgram;
    return { envVersion, version };
  } catch {
    return {};
  }
}

function isRetryableLoginError(error: unknown) {
  if (error instanceof ApiError) {
    return error.statusCode === 0 || [502, 503, 504].includes(error.statusCode);
  }

  return (
    error instanceof Error &&
    ["missing_wechat_login_code", "wechat_login_failed"].includes(error.message)
  );
}

function waitForLoginRetry() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, LOGIN_RETRY_DELAY_MS);
  });
}

export async function login() {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const code = await getWechatLoginCode();
      const response = await apiRequest<LoginResponse>({
        path: "/api/miniapp/auth/login",
        method: "POST",
        data: { code, ...getMiniappRuntimeInfo() },
      });

      storeSessionToken(response.token);
      trackEvent("login_success", "app", { attempts: attempt + 1 });
      return response.user;
    } catch (error) {
      if (attempt === 0 && isRetryableLoginError(error)) {
        await waitForLoginRetry();
        continue;
      }

      throw error;
    }
  }

  throw new Error("wechat_login_failed");
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
