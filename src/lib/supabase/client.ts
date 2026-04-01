"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/env";

let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = getSupabaseEnv();

  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
