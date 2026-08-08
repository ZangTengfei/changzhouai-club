import type { SupabaseClient } from "@supabase/supabase-js";

export async function isAutomatedVerificationUser(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    console.error("Failed to inspect user before sending admin notification.", {
      userId,
      error,
    });
    return false;
  }

  return data.user?.app_metadata?.automated_verification === true;
}
