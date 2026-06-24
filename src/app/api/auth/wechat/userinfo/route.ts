import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sha256Hex } from "@/lib/wechat-oauth";

export const runtime = "nodejs";

type WechatOAuthUserinfoRow = {
  claims: Record<string, unknown>;
  access_token_expires_at: string | null;
};

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function GET(request: Request) {
  const supabase = createSupabaseAdminClient();
  const accessToken = getBearerToken(request);

  if (!supabase) {
    return Response.json({ error: "server_error" }, { status: 503 });
  }

  if (!accessToken) {
    return Response.json({ error: "missing_bearer_token" }, { status: 401 });
  }

  const { data: row, error } = await supabase
    .from("wechat_oauth_codes")
    .select("claims, access_token_expires_at")
    .eq("access_token_hash", sha256Hex(accessToken))
    .maybeSingle<WechatOAuthUserinfoRow>();

  if (error || !row?.access_token_expires_at) {
    return Response.json({ error: "invalid_token" }, { status: 401 });
  }

  if (new Date(row.access_token_expires_at).getTime() < Date.now()) {
    return Response.json({ error: "invalid_token" }, { status: 401 });
  }

  return Response.json(row.claims, {
    headers: {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}
