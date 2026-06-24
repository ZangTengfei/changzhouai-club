import { NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/env";
import {
  getWechatOAuthConfig,
  getWechatProviderName,
} from "@/lib/wechat-oauth";

export const runtime = "nodejs";

type EmbeddedUrlPayload = {
  authorizeUrl?: unknown;
};

const noStoreHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: noStoreHeaders,
    },
  );
}

function getValidatedAuthorizeUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const authorizeUrl = new URL(value);
    const { url: supabaseUrl } = getSupabaseEnv();
    const expectedSupabaseUrl = new URL(supabaseUrl);

    if (
      authorizeUrl.origin !== expectedSupabaseUrl.origin ||
      authorizeUrl.pathname !== "/auth/v1/authorize" ||
      authorizeUrl.searchParams.get("provider") !== getWechatProviderName()
    ) {
      return null;
    }

    return authorizeUrl;
  } catch {
    return null;
  }
}

function getRedirectLocation(response: Response, baseUrl: URL) {
  const location = response.headers.get("location");

  if (!location || ![301, 302, 303, 307, 308].includes(response.status)) {
    return null;
  }

  try {
    return new URL(location, baseUrl);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const config = getWechatOAuthConfig();

  if (!config) {
    return jsonError("wechat_oauth_not_configured", 503);
  }

  let payload: EmbeddedUrlPayload;

  try {
    payload = (await request.json()) as EmbeddedUrlPayload;
  } catch {
    return jsonError("invalid_json");
  }

  const authorizeUrl = getValidatedAuthorizeUrl(payload.authorizeUrl);

  if (!authorizeUrl) {
    return jsonError("invalid_authorize_url");
  }

  const { publishableKey } = getSupabaseEnv();
  const supabaseResponse = await fetch(authorizeUrl, {
    cache: "no-store",
    redirect: "manual",
    headers: {
      Accept: "text/html,application/json",
      Authorization: `Bearer ${publishableKey}`,
      apikey: publishableKey,
    },
  });
  const providerAuthorizeUrl = getRedirectLocation(
    supabaseResponse,
    authorizeUrl,
  );

  if (!providerAuthorizeUrl) {
    return jsonError("wechat_provider_authorize_url_unavailable", 502);
  }

  const oauthBaseUrl = new URL(config.baseUrl);

  if (
    providerAuthorizeUrl.origin !== oauthBaseUrl.origin ||
    providerAuthorizeUrl.pathname !== "/api/auth/wechat/authorize"
  ) {
    return jsonError("invalid_wechat_provider_authorize_url", 502);
  }

  const providerResponse = await fetch(providerAuthorizeUrl, {
    cache: "no-store",
    redirect: "manual",
    headers: {
      Accept: "text/html,application/json",
    },
  });
  const wechatUrl = getRedirectLocation(providerResponse, providerAuthorizeUrl);

  if (
    !wechatUrl ||
    wechatUrl.origin !== "https://open.weixin.qq.com" ||
    wechatUrl.pathname !== "/connect/qrconnect"
  ) {
    return jsonError("wechat_authorization_url_unavailable", 502);
  }

  return NextResponse.json(
    { url: wechatUrl.toString() },
    {
      headers: noStoreHeaders,
    },
  );
}
