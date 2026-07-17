import { randomUUID } from "node:crypto";

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

const MINIAPP_ENV_VERSIONS = new Set(["develop", "trial", "release"]);

type MiniappRuntimeInfo = {
  envVersion: string | null;
  version: string | null;
};

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function parseMiniappRuntimeInfo(payload: {
  envVersion?: unknown;
  version?: unknown;
}): MiniappRuntimeInfo {
  const envVersion =
    typeof payload.envVersion === "string" &&
    MINIAPP_ENV_VERSIONS.has(payload.envVersion)
      ? payload.envVersion
      : null;
  const version =
    typeof payload.version === "string" &&
    /^[0-9A-Za-z._-]{1,32}$/.test(payload.version)
      ? payload.version
      : null;

  return { envVersion, version };
}

async function recordLoginFailure(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  input: MiniappRuntimeInfo & {
    errorCode: string;
    requestId: string;
    stage: "account_resolution" | "code_exchange" | "unexpected";
  },
) {
  try {
    const { error } = await supabase.from("miniapp_analytics_events").insert({
      event_name: "login_failed",
      page_path: "/api/miniapp/auth/login",
      event_data: input,
    });

    if (!error) return;
  } catch {
    // Diagnostics must not replace the original login response.
  }

  console.error("Failed to persist mini-program login diagnostics.", {
    requestId: input.requestId,
  });
}

export async function POST(request: Request) {
  const config = getWechatMiniappConfig();
  const supabase = createSupabaseAdminClient();

  if (!config || !supabase) {
    return noStoreJson({ error: "miniapp_auth_not_configured" }, 503);
  }

  const payload = (await request.json().catch(() => null)) as
    | { code?: unknown; envVersion?: unknown; version?: unknown }
    | null;
  const code = typeof payload?.code === "string" ? payload.code.trim() : "";

  if (!code || code.length > 512) {
    return noStoreJson({ error: "invalid_login_code" }, 400);
  }

  const requestId = randomUUID();
  const runtimeInfo = parseMiniappRuntimeInfo(payload ?? {});

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
      const errorCode = String(error.wechatErrorCode ?? error.code);
      console.error("WeChat mini-program code exchange failed.", {
        errorCode,
        requestId,
      });
      await recordLoginFailure(supabase, {
        ...runtimeInfo,
        errorCode,
        requestId,
        stage: "code_exchange",
      });
      return noStoreJson({ error: "wechat_login_failed", requestId }, 502);
    }

    if (error instanceof MiniappAuthError) {
      console.error("Mini-program account resolution failed.", {
        errorCode: error.code,
        requestId,
      });
      await recordLoginFailure(supabase, {
        ...runtimeInfo,
        errorCode: error.code,
        requestId,
        stage: "account_resolution",
      });
      const status = error.code === "wechat_identity_conflict" ? 409 : 500;
      return noStoreJson({ error: error.code, requestId }, status);
    }

    console.error("Unexpected mini-program login failure.", { requestId });
    await recordLoginFailure(supabase, {
      ...runtimeInfo,
      errorCode: "miniapp_login_failed",
      requestId,
      stage: "unexpected",
    });
    return noStoreJson({ error: "miniapp_login_failed", requestId }, 500);
  }
}
