import {
  apiRequest,
  clearSessionToken,
  getStoredSessionToken,
  storeSessionToken,
} from "./api";

type LoginResponse = {
  token: string;
  expiresAt: string;
  user: MiniappUser;
};

type MeResponse = {
  expiresAt: string;
  user: MiniappUser;
};

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
  return response.user;
}

export async function ensureSession() {
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
}

export async function logout() {
  try {
    await apiRequest<{ loggedOut: boolean }>({
      path: "/api/miniapp/auth/logout",
      method: "POST",
      authenticated: true,
    });
  } finally {
    clearSessionToken();
  }
}
