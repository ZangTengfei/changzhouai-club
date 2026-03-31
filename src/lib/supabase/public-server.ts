import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";

export function createPublicServerClient() {
  const { url, publishableKey } = getSupabaseEnv();

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
