import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { loadMiniappSession } from "@/lib/miniapp-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MiniappSession = NonNullable<
  Awaited<ReturnType<typeof loadMiniappSession>>
>;

export function miniappJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function requireMiniappSession(request: Request): Promise<
  | {
      supabase: SupabaseClient;
      session: MiniappSession;
      response?: never;
    }
  | {
      supabase?: never;
      session?: never;
      response: NextResponse;
    }
> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      response: miniappJson({ error: "miniapp_auth_not_configured" }, 503),
    };
  }

  const session = await loadMiniappSession(supabase, request);
  if (!session) {
    return { response: miniappJson({ error: "unauthorized" }, 401) };
  }

  return { supabase, session };
}
