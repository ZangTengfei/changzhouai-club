import { NextResponse } from "next/server";

import {
  createMiniappSession,
  loadMiniappAccountSnapshot,
  MiniappAuthError,
  resolveOrCreateWechatCommunityUser,
} from "@/lib/miniapp-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  exchangeWechatMiniappCode,
  getWechatMiniappConfig,
  WechatMiniappApiError,
} from "@/lib/wechat-miniapp";

export const runtime = "nodejs";

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const config = getWechatMiniappConfig();
  const supabase = createSupabaseAdminClient();

  if (!config || !supabase) {
    return noStoreJson({ error: "miniapp_auth_not_configured" }, 503);
  }

  const payload = (await request.json().catch(() => null)) as
    | { code?: unknown }
    | null;
  const code = typeof payload?.code === "string" ? payload.code.trim() : "";

  if (!code || code.length > 512) {
    return noStoreJson({ error: "invalid_login_code" }, 400);
  }

  try {
    const identity = await exchangeWechatMiniappCode(config, code);
    const userId = await resolveOrCreateWechatCommunityUser(supabase, {
      appId: config.appId,
      openid: identity.openid,
      unionid: identity.unionid,
      channel: "mini_program",
    });
    const [{ token, expiresAt }, user] = await Promise.all([
      createMiniappSession(supabase, userId),
      loadMiniappAccountSnapshot(supabase, userId),
    ]);

    return noStoreJson({ token, expiresAt, user });
  } catch (error) {
    if (error instanceof WechatMiniappApiError) {
      console.error("WeChat mini-program code exchange failed.", {
        errorCode: error.wechatErrorCode ?? error.code,
      });
      return noStoreJson({ error: "wechat_login_failed" }, 502);
    }

    if (error instanceof MiniappAuthError) {
      console.error("Mini-program account resolution failed.", {
        errorCode: error.code,
      });
      const status = error.code === "wechat_identity_conflict" ? 409 : 500;
      return noStoreJson({ error: error.code }, status);
    }

    console.error("Unexpected mini-program login failure.");
    return noStoreJson({ error: "miniapp_login_failed" }, 500);
  }
}
