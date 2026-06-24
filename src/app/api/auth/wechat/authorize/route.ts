import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildOAuthCallbackUrl,
  buildWechatAuthorizationUrl,
  createOpaqueToken,
  getWechatOAuthConfig,
  getWechatStateExpiresAt,
  getWechatProviderName,
  getWechatOAuthScope,
  isValidSupabaseCallbackUrl,
  sha256Hex,
} from "@/lib/wechat-oauth";

export const runtime = "nodejs";

function redirectWithError(redirectUri: string, state: string, description: string) {
  return NextResponse.redirect(
    buildOAuthCallbackUrl(redirectUri, {
      error: "server_error",
      error_description: description,
      state,
    }),
  );
}

export async function GET(request: Request) {
  const config = getWechatOAuthConfig();

  if (!config) {
    return Response.json({ error: "wechat_oauth_not_configured" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const clientId = requestUrl.searchParams.get("client_id");
  const redirectUri = requestUrl.searchParams.get("redirect_uri");
  const responseType = requestUrl.searchParams.get("response_type");
  const providerState = requestUrl.searchParams.get("state");
  const scope = requestUrl.searchParams.get("scope") ?? getWechatOAuthScope();
  const codeChallenge = requestUrl.searchParams.get("code_challenge");
  const codeChallengeMethod = requestUrl.searchParams.get("code_challenge_method");

  if (clientId !== config.appId || responseType !== "code") {
    return Response.json({ error: "invalid_oauth_request" }, { status: 400 });
  }

  if (!redirectUri || !providerState || !isValidSupabaseCallbackUrl(redirectUri)) {
    return Response.json({ error: "invalid_redirect_uri" }, { status: 400 });
  }

  if (!scope.split(/\s+/).includes(getWechatOAuthScope())) {
    return redirectWithError(redirectUri, providerState, "missing_wechat_scope");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return redirectWithError(redirectUri, providerState, "missing_service_role_key");
  }

  const state = createOpaqueToken(24);
  const { error } = await supabase.from("wechat_oauth_states").insert({
    state_hash: sha256Hex(state),
    provider_state: providerState,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    expires_at: getWechatStateExpiresAt(),
  });

  if (error) {
    console.error("Failed to create WeChat OAuth state.", {
      error,
      provider: getWechatProviderName(),
    });
    return redirectWithError(redirectUri, providerState, "state_create_failed");
  }

  return NextResponse.redirect(buildWechatAuthorizationUrl(config, state));
}
