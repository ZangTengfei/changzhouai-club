import { createHash, randomBytes, timingSafeEqual } from "crypto";

import { getPublicSiteUrl } from "@/lib/env";

const WECHAT_AUTHORIZATION_URL = "https://open.weixin.qq.com/connect/qrconnect";
const WECHAT_TOKEN_URL = "https://api.weixin.qq.com/sns/oauth2/access_token";
const WECHAT_USERINFO_URL = "https://api.weixin.qq.com/sns/userinfo";
const WECHAT_SCOPE = "snsapi_login";
const STATE_TTL_SECONDS = 10 * 60;
const CODE_TTL_SECONDS = 5 * 60;
const ACCESS_TOKEN_TTL_SECONDS = 5 * 60;

export type WechatOAuthConfig = {
  appId: string;
  appSecret: string;
  baseUrl: string;
  callbackUrl: string;
};

export type WechatOAuthClaims = {
  sub: string;
  name?: string;
  nickname?: string;
  picture?: string;
  avatar_url?: string;
  provider_id: string;
  full_name?: string;
  custom_claims: {
    openid: string;
    unionid?: string;
    city?: string;
    province?: string;
    country?: string;
    scope?: string;
  };
};

type WechatTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  openid?: string;
  scope?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

type WechatUserInfoResponse = {
  openid?: string;
  nickname?: string;
  headimgurl?: string;
  city?: string;
  province?: string;
  country?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

export function getWechatOAuthConfig() {
  const appId = process.env.WECHAT_OPEN_APP_ID?.trim();
  const appSecret = process.env.WECHAT_OPEN_APP_SECRET?.trim();
  const baseUrl = (
    process.env.WECHAT_OAUTH_BASE_URL?.trim() ??
    getPublicSiteUrl() ??
    ""
  ).replace(/\/$/, "");

  if (!appId || !appSecret || !baseUrl) {
    return null;
  }

  return {
    appId,
    appSecret,
    baseUrl,
    callbackUrl: new URL("/api/auth/wechat/callback", baseUrl).toString(),
  };
}

export function hasWechatOAuthEnv() {
  return Boolean(getWechatOAuthConfig());
}

export function getWechatProviderName() {
  return "custom:wechat";
}

export function getWechatOAuthScope() {
  return WECHAT_SCOPE;
}

export function getWechatStateExpiresAt() {
  return new Date(Date.now() + STATE_TTL_SECONDS * 1000).toISOString();
}

export function getWechatCodeExpiresAt() {
  return new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString();
}

export function getWechatAccessTokenExpiresAt() {
  return new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();
}

export function getWechatAccessTokenTtlSeconds() {
  return ACCESS_TOKEN_TTL_SECONDS;
}

export function createOpaqueToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function sha256Base64Url(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isValidSupabaseCallbackUrl(value: string) {
  try {
    const url = new URL(value);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (url.protocol !== "https:" && !isLocalhost) {
      return false;
    }

    return url.pathname === "/auth/v1/callback";
  } catch {
    return false;
  }
}

export function buildWechatAuthorizationUrl(config: WechatOAuthConfig, state: string) {
  const url = new URL(WECHAT_AUTHORIZATION_URL);
  url.searchParams.set("appid", config.appId);
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", WECHAT_SCOPE);
  url.searchParams.set("state", state);

  return `${url.toString()}#wechat_redirect`;
}

export function buildOAuthCallbackUrl(
  redirectUri: string,
  params: Record<string, string>,
) {
  const url = new URL(redirectUri);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

export function createOAuthJsonError(
  error: string,
  description: string,
  status = 400,
) {
  return Response.json(
    {
      error,
      error_description: description,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    },
  );
}

export async function exchangeWechatCode(config: WechatOAuthConfig, code: string) {
  const url = new URL(WECHAT_TOKEN_URL);
  url.searchParams.set("appid", config.appId);
  url.searchParams.set("secret", config.appSecret);
  url.searchParams.set("code", code);
  url.searchParams.set("grant_type", "authorization_code");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const body = (await response.json()) as WechatTokenResponse;

  if (!response.ok || body.errcode || !body.access_token || !body.openid) {
    throw new Error(body.errmsg || "wechat_token_exchange_failed");
  }

  return body;
}

export async function fetchWechatUserInfo(token: WechatTokenResponse) {
  if (!token.access_token || !token.openid) {
    return null;
  }

  const url = new URL(WECHAT_USERINFO_URL);
  url.searchParams.set("access_token", token.access_token);
  url.searchParams.set("openid", token.openid);
  url.searchParams.set("lang", "zh_CN");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const body = (await response.json()) as WechatUserInfoResponse;

  if (!response.ok || body.errcode) {
    return null;
  }

  return body;
}

export function buildWechatClaims(
  token: WechatTokenResponse,
  userInfo: WechatUserInfoResponse | null,
) {
  if (!token.openid) {
    throw new Error("missing_wechat_openid");
  }

  const unionid = userInfo?.unionid ?? token.unionid;
  const nickname = userInfo?.nickname?.trim() || "微信用户";
  const avatarUrl = userInfo?.headimgurl?.trim() || undefined;

  return {
    sub: token.openid,
    name: nickname,
    nickname,
    picture: avatarUrl,
    avatar_url: avatarUrl,
    provider_id: token.openid,
    full_name: nickname,
    custom_claims: {
      openid: token.openid,
      unionid,
      city: userInfo?.city,
      province: userInfo?.province,
      country: userInfo?.country,
      scope: token.scope,
    },
  } satisfies WechatOAuthClaims;
}

export function getBasicAuthCredentials(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString(
      "utf8",
    );
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex < 0) {
      return null;
    }

    return {
      clientId: decoded.slice(0, separatorIndex),
      clientSecret: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}
