import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  linkWechatIdentityToCommunityUser,
  MiniappAuthError,
} from "@/lib/miniapp-auth";
import {
  getWechatOAuthConfig,
  getWechatProviderName,
} from "@/lib/wechat-oauth";

type WechatClaims = {
  openid?: unknown;
  unionid?: unknown;
};

function getWebsiteWechatClaims(user: User) {
  const identity = user.identities?.find(
    (candidate) => candidate.provider === getWechatProviderName(),
  );
  const claims = identity?.identity_data?.custom_claims as
    WechatClaims | undefined;
  const openid = typeof claims?.openid === "string" ? claims.openid.trim() : "";
  const unionid =
    typeof claims?.unionid === "string" ? claims.unionid.trim() : "";

  if (!identity) {
    return null;
  }

  if (!openid || !unionid) {
    throw new MiniappAuthError("wechat_unionid_missing");
  }

  return { openid, unionid };
}

export async function syncWebsiteWechatAccount(
  supabase: SupabaseClient,
  user: User,
) {
  const claims = getWebsiteWechatClaims(user);
  if (!claims) {
    return false;
  }

  const config = getWechatOAuthConfig();
  if (!config) {
    throw new MiniappAuthError("wechat_oauth_config_missing");
  }

  const { data: unionAccount, error: unionError } = await supabase
    .from("wechat_union_accounts")
    .select("user_id")
    .eq("union_id", claims.unionid)
    .maybeSingle<{ user_id: string }>();

  if (unionError) {
    throw new MiniappAuthError("union_account_lookup_failed");
  }

  const existingUserId = unionAccount?.user_id;
  if (existingUserId && existingUserId !== user.id) {
    const { data: existingUser, error: existingUserError } =
      await supabase.auth.admin.getUserById(existingUserId);

    if (
      existingUserError ||
      existingUser.user?.app_metadata?.account_anchor !== "wechat_miniapp"
    ) {
      throw new MiniappAuthError("wechat_identity_conflict");
    }

    const { error: promotionError } = await supabase.rpc(
      "promote_miniapp_anchor_to_wechat_user",
      {
        source_user_id: existingUserId,
        target_user_id: user.id,
      },
    );

    if (promotionError) {
      throw new MiniappAuthError("wechat_account_promotion_failed");
    }
  }

  await linkWechatIdentityToCommunityUser(supabase, user.id, {
    appId: config.appId,
    openid: claims.openid,
    unionid: claims.unionid,
    channel: "website",
  });

  return true;
}
