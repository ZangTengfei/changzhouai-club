import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveCommunityUserId(
  supabase: SupabaseClient,
  authUserId: string,
) {
  const { data, error } = await supabase.rpc("resolve_community_user_id", {
    requested_user_id: authUserId,
  });

  if (error || typeof data !== "string") {
    throw new Error("community_user_resolution_failed");
  }

  return data;
}
