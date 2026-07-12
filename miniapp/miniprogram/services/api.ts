import { getApiBaseUrl } from "./config";

const SESSION_TOKEN_STORAGE_KEY = "miniapp_session_token";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly errorCode: string,
  ) {
    super(errorCode);
    this.name = "ApiError";
  }
}

export function getStoredSessionToken() {
  const token = wx.getStorageSync(SESSION_TOKEN_STORAGE_KEY);
  return typeof token === "string" && token ? token : null;
}

export function storeSessionToken(token: string) {
  wx.setStorageSync(SESSION_TOKEN_STORAGE_KEY, token);
}

export function clearSessionToken() {
  wx.removeStorageSync(SESSION_TOKEN_STORAGE_KEY);
}

export function apiRequest<T>(options: {
  path: string;
  method?: RequestMethod;
  data?: WechatMiniprogram.IAnyObject;
  authenticated?: boolean;
}) {
  const token = options.authenticated ? getStoredSessionToken() : null;

  return new Promise<T>((resolve, reject) => {
    wx.request<T & { error?: string }>({
      url: `${getApiBaseUrl()}${options.path}`,
      method: options.method ?? "GET",
      data: options.data,
      header: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }

        if (response.statusCode === 401) {
          clearSessionToken();
        }

        reject(
          new ApiError(
            response.statusCode,
            response.data?.error ?? "request_failed",
          ),
        );
      },
      fail() {
        reject(new ApiError(0, "network_error"));
      },
    });
  });
}
