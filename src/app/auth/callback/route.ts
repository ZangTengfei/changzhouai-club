import { NextResponse } from "next/server";

import { getPublicSiteUrl, hasSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { syncWechatOAuthAccount } from "@/lib/wechat-account-linking";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
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
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!hasSupabaseEnv()) {
    return redirectToSite(requestUrl, "/login?error=oauth_callback");
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return redirectToSite(requestUrl, "/login?error=oauth_callback");
    }

    const admin = createSupabaseAdminClient();

    try {
      if (data.user && admin) {
        await syncWechatOAuthAccount(admin, data.user);
      } else if (
        data.user?.identities?.some(
          (identity) => identity.provider === "custom:wechat",
        )
      ) {
        throw new Error("Supabase admin configuration is missing.");
      }
    } catch (linkError) {
      console.error("Failed to link website WeChat account.", {
        userId: data.user?.id,
        error: linkError instanceof Error ? linkError.message : "unknown_error",
      });
      return redirectToSite(requestUrl, "/login?error=wechat_account_link");
    }

    return redirectToSite(requestUrl, next);
  }

  return redirectToSite(requestUrl, "/login?error=oauth_callback");
}
