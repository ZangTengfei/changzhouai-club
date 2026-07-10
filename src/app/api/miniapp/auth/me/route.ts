import { NextResponse } from "next/server";

import {
  loadMiniappAccountSnapshot,
  loadMiniappSession,
} from "@/lib/miniapp-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "miniapp_auth_not_configured" },
      { status: 503 },
    );
  }

  const session = await loadMiniappSession(supabase, request);
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const user = await loadMiniappAccountSnapshot(supabase, session.user_id);
  return NextResponse.json(
    { user, expiresAt: session.expires_at },
    { headers: { "Cache-Control": "no-store" } },
  );
}
