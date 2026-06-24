import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createOAuthJsonError,
  createOpaqueToken,
  getBasicAuthCredentials,
  getWechatAccessTokenExpiresAt,
  getWechatAccessTokenTtlSeconds,
  getWechatOAuthConfig,
  safeCompare,
  sha256Base64Url,
  sha256Hex,
} from "@/lib/wechat-oauth";

export const runtime = "nodejs";

type WechatOAuthCodeRow = {
  redirect_uri: string;
  code_challenge: string | null;
  code_challenge_method: string | null;
  code_expires_at: string;
  used_at: string | null;
};

function verifyPkceChallenge(
  codeVerifier: string | null,
  codeChallenge: string | null,
  codeChallengeMethod: string | null,
) {
  if (!codeChallenge) {
    return true;
  }

  if (!codeVerifier) {
    return false;
  }

  if (!codeChallengeMethod || codeChallengeMethod === "plain") {
    return safeCompare(codeVerifier, codeChallenge);
  }

  if (codeChallengeMethod === "S256") {
    return safeCompare(sha256Base64Url(codeVerifier), codeChallenge);
  }

  return false;
}

export async function POST(request: Request) {
  const config = getWechatOAuthConfig();
  const supabase = createSupabaseAdminClient();

  if (!config || !supabase) {
    return createOAuthJsonError("server_error", "wechat_oauth_not_configured", 503);
  }

  const formData = await request.formData();
  const basicAuth = getBasicAuthCredentials(request);
  const clientId = basicAuth?.clientId ?? String(formData.get("client_id") ?? "");
  const clientSecret =
    basicAuth?.clientSecret ?? String(formData.get("client_secret") ?? "");
  const grantType = String(formData.get("grant_type") ?? "");
  const code = String(formData.get("code") ?? "");
  const redirectUri = String(formData.get("redirect_uri") ?? "");
  const codeVerifier = formData.get("code_verifier")
    ? String(formData.get("code_verifier"))
    : null;

  if (clientId !== config.appId || clientSecret !== config.appSecret) {
    return createOAuthJsonError("invalid_client", "invalid_client", 401);
  }

  if (grantType !== "authorization_code" || !code || !redirectUri) {
    return createOAuthJsonError("invalid_request", "invalid_token_request");
  }

  const { data: row, error } = await supabase
    .from("wechat_oauth_codes")
    .select("redirect_uri, code_challenge, code_challenge_method, code_expires_at, used_at")
    .eq("auth_code_hash", sha256Hex(code))
    .maybeSingle<WechatOAuthCodeRow>();

  if (error || !row) {
    return createOAuthJsonError("invalid_grant", "invalid_or_expired_code");
  }

  if (
    row.used_at ||
    row.redirect_uri !== redirectUri ||
    new Date(row.code_expires_at).getTime() < Date.now()
  ) {
    return createOAuthJsonError("invalid_grant", "invalid_or_expired_code");
  }

  if (!verifyPkceChallenge(codeVerifier, row.code_challenge, row.code_challenge_method)) {
    return createOAuthJsonError("invalid_grant", "invalid_code_verifier");
  }

  const accessToken = createOpaqueToken(32);
  const { error: updateError } = await supabase
    .from("wechat_oauth_codes")
    .update({
      access_token_hash: sha256Hex(accessToken),
      access_token_expires_at: getWechatAccessTokenExpiresAt(),
      used_at: new Date().toISOString(),
    })
    .eq("auth_code_hash", sha256Hex(code))
    .is("used_at", null);

  if (updateError) {
    console.error("Failed to issue WeChat OAuth access token.", { updateError });
    return createOAuthJsonError("server_error", "token_issue_failed", 500);
  }

  return Response.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: getWechatAccessTokenTtlSeconds(),
      scope: "snsapi_login",
    },
    {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    },
  );
}
