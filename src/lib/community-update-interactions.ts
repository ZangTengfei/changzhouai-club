import { hasSupabaseEnv } from "@/lib/env";
import { resolveCommunityUserId } from "@/lib/community-user";
import { createClient } from "@/lib/supabase/server";

export async function getViewerCommunityUpdateLike(updateId: string) {
  if (!hasSupabaseEnv()) {
    return false;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const communityUserId = await resolveCommunityUserId(supabase, user.id);

  const { data, error } = await supabase
    .from("community_update_likes")
    .select("update_id")
    .eq("update_id", updateId)
    .eq("user_id", communityUserId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      return false;
    }

    console.error("Failed to load community update like state.", {
      error,
      updateId,
      userId: communityUserId,
    });
    return false;
  }

  return Boolean(data);
}
