import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildOAuthCallbackUrl,
  buildWechatClaims,
  createOpaqueToken,
  exchangeWechatCode,
  fetchWechatUserInfo,
  getWechatCodeExpiresAt,
  getWechatOAuthConfig,
  sha256Hex,
} from "@/lib/wechat-oauth";

export const runtime = "nodejs";

type WechatOAuthStateRow = {
  provider_state: string;
  redirect_uri: string;
  code_challenge: string | null;
  code_challenge_method: string | null;
  expires_at: string;
  used_at: string | null;
};

function redirectWithError(row: WechatOAuthStateRow, description: string) {
  return NextResponse.redirect(
    buildOAuthCallbackUrl(row.redirect_uri, {
      error: "server_error",
      error_description: description,
      state: row.provider_state,
    }),
  );
}

export async function GET(request: Request) {
  const config = getWechatOAuthConfig();
  const supabase = createSupabaseAdminClient();

  if (!config || !supabase) {
    return Response.json({ error: "wechat_oauth_not_configured" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  if (!code || !state) {
    return Response.json({ error: "missing_wechat_callback_params" }, { status: 400 });
  }

  const { data: row, error: stateError } = await supabase
    .from("wechat_oauth_states")
    .select("provider_state, redirect_uri, code_challenge, code_challenge_method, expires_at, used_at")
    .eq("state_hash", sha256Hex(state))
    .maybeSingle<WechatOAuthStateRow>();

  if (stateError || !row) {
    console.error("Failed to load WeChat OAuth state.", { stateError });
    return Response.json({ error: "invalid_wechat_state" }, { status: 400 });
  }

  if (row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    return redirectWithError(row, "invalid_or_expired_state");
  }

  const { error: stateUpdateError } = await supabase
    .from("wechat_oauth_states")
    .update({ used_at: new Date().toISOString() })
    .eq("state_hash", sha256Hex(state))
    .is("used_at", null);

  if (stateUpdateError) {
    console.error("Failed to mark WeChat OAuth state as used.", {
      stateUpdateError,
    });
    return redirectWithError(row, "state_update_failed");
  }

  try {
    const token = await exchangeWechatCode(config, code);
    const userInfo = await fetchWechatUserInfo(token);
    const claims = buildWechatClaims(token, userInfo);
    const authCode = createOpaqueToken(32);

    const { error: codeCreateError } = await supabase.from("wechat_oauth_codes").insert({
      auth_code_hash: sha256Hex(authCode),
      claims,
      redirect_uri: row.redirect_uri,
      code_challenge: row.code_challenge,
      code_challenge_method: row.code_challenge_method,
      code_expires_at: getWechatCodeExpiresAt(),
    });

    if (codeCreateError) {
      console.error("Failed to create WeChat OAuth code.", { codeCreateError });
      return redirectWithError(row, "code_create_failed");
    }

    return NextResponse.redirect(
      buildOAuthCallbackUrl(row.redirect_uri, {
        code: authCode,
        state: row.provider_state,
      }),
    );
  } catch (error) {
    console.error("Failed to complete WeChat OAuth callback.", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return redirectWithError(row, "wechat_callback_failed");
  }
}
