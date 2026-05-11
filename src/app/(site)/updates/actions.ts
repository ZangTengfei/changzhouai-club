"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function toggleCommunityUpdateLike(formData: FormData) {
  const updateId = String(formData.get("update_id") ?? "").trim();
  const nextPath = updateId ? `/updates/${updateId}` : "/updates";

  if (!updateId) {
    redirect("/updates");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  const { error } = await supabase.rpc("toggle_community_update_like", {
    target_update_id: updateId,
  });

  if (error) {
    console.error("Failed to toggle community update like.", {
      error,
      updateId,
      userId: user.id,
    });
  }

  revalidatePath("/updates");
  revalidatePath(nextPath);
  redirect(nextPath);
}
