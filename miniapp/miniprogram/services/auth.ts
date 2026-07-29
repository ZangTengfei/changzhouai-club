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

class WechatLoginClientError extends Error {
  constructor(
    readonly errorCode: "missing_wechat_login_code" | "wechat_login_failed",
    readonly errno: number | null,
    readonly errorMessage: string,
  ) {
    super(errorCode);
    this.name = "WechatLoginClientError";
  }
}

let pendingSession: Promise<MiniappUser> | null = null;

function sanitizeClientErrorMessage(message: unknown) {
  return typeof message === "string"
    ? message.replace(/[\r\n\t]+/g, " ").trim().slice(0, 160)
    : "";
}

function getWechatLoginCode() {
  return new Promise<string>((resolve, reject) => {
    wx.login({
      success(result) {
        if (result.code) {
          resolve(result.code);
          return;
        }

        reject(
          new WechatLoginClientError(
            "missing_wechat_login_code",
            null,
            sanitizeClientErrorMessage(result.errMsg),
          ),
        );
      },
      fail(error) {
        reject(
          new WechatLoginClientError(
            "wechat_login_failed",
            Number.isFinite(error.errno) ? error.errno : null,
            sanitizeClientErrorMessage(error.errMsg),
          ),
        );
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
    error instanceof WechatLoginClientError &&
    ["missing_wechat_login_code", "wechat_login_failed"].includes(
      error.errorCode,
    )
  );
}

function recordRealtimeLoginFailure(
  error: unknown,
  attempt: number,
  retrying: boolean,
) {
  const runtimeInfo = getMiniappRuntimeInfo();
  const details =
    error instanceof WechatLoginClientError
      ? {
          stage: "wx_login",
          errorCode: error.errorCode,
          errno: error.errno,
          errorMessage: error.errorMessage,
        }
      : error instanceof ApiError
        ? {
            stage: "login_request",
            errorCode: error.errorCode,
            statusCode: error.statusCode,
            requestId: error.requestId,
          }
        : {
            stage: "unexpected",
            errorCode: "unknown_login_error",
          };

  try {
    const logger = wx.getRealtimeLogManager();
    logger[retrying ? "warn" : "error"]("miniapp_login_failed", {
      ...runtimeInfo,
      ...details,
      attempt,
      retrying,
    });
  } catch {
    // Login must not depend on diagnostic logging support.
  }
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
      const retrying = attempt === 0 && isRetryableLoginError(error);
      recordRealtimeLoginFailure(error, attempt + 1, retrying);
      if (retrying) {
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
      if (!getStoredSessionToken()) {
        throw new ApiError(401, "login_required");
      }

      try {
        const response = await apiRequest<MeResponse>({
          path: "/api/miniapp/auth/me",
          authenticated: true,
        });
        return response.user;
      } catch (error) {
        clearSessionToken();
        throw error;
      }
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
