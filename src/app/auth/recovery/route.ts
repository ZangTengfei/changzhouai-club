import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getPublicSiteUrl, hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account/password";
  }

  return value;
}

function getRedirectOrigin(requestUrl: URL) {
  return getPublicSiteUrl() ?? requestUrl.origin;
}

function redirectToSite(requestUrl: URL, path: string) {
  return NextResponse.redirect(new URL(path, getRedirectOrigin(requestUrl)));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!hasSupabaseEnv() || !tokenHash || type !== "recovery") {
    return redirectToSite(requestUrl, "/login?error=recovery_link");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    return redirectToSite(requestUrl, "/login?error=recovery_link_expired");
  }

  return redirectToSite(requestUrl, next);
}
