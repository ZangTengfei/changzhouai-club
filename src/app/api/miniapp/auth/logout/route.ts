import { NextResponse } from "next/server";

import {
  loadMiniappSession,
  revokeMiniappSession,
} from "@/lib/miniapp-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

  await revokeMiniappSession(supabase, session.id);
  return NextResponse.json(
    { loggedOut: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
