import { hasSupabaseEnv } from "@/lib/env";
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

  const { data, error } = await supabase
    .from("community_update_likes")
    .select("update_id")
    .eq("update_id", updateId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205" || error.code === "42P01") {
      return false;
    }

    console.error("Failed to load community update like state.", {
      error,
      updateId,
      userId: user.id,
    });
    return false;
  }

  return Boolean(data);
}
