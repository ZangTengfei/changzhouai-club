import { loadMiniappSession } from "@/lib/miniapp-auth";
import { miniappJson } from "@/lib/miniapp-api";
import {
  loadCommunitySpaceSnapshot,
  parseCommunitySpaceWindow,
} from "@/lib/community-space";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const window = parseCommunitySpaceWindow(request.url);
  if (!window) {
    return miniappJson({ error: "invalid_booking_window" }, 400);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return miniappJson({ error: "community_space_not_configured" }, 503);
  }

  const session = await loadMiniappSession(supabase, request);

  try {
    const snapshot = await loadCommunitySpaceSnapshot(
      supabase,
      window,
      session?.user_id ?? null,
    );
    return miniappJson(snapshot);
  } catch (error) {
    console.error("Failed to load community space snapshot.", { error });
    return miniappJson({ error: "community_space_load_failed" }, 500);
  }
}
