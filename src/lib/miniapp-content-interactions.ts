import type { SupabaseClient } from "@supabase/supabase-js";

export type MiniappContentType = "news" | "group_digest";

export type MiniappContentInteraction = {
  isFavorited: boolean;
  lastReadAt: string | null;
};

export async function getMiniappContentInteractions(
  supabase: SupabaseClient,
  userId: string,
  contentType: MiniappContentType,
  contentIds: string[],
) {
  if (contentIds.length === 0) {
    return new Map<string, MiniappContentInteraction>();
  }

  const { data, error } = await supabase
    .from("miniapp_content_interactions")
    .select("content_id, is_favorited, last_read_at")
    .eq("user_id", userId)
    .eq("content_type", contentType)
    .in("content_id", contentIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((item) => [
      item.content_id,
      {
        isFavorited: item.is_favorited,
        lastReadAt: item.last_read_at,
      },
    ]),
  );
}
