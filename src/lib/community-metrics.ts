import { unstable_cache } from "next/cache";

import { hasSupabaseEnv } from "@/lib/env";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export const COMMUNITY_MEMBER_COUNT_KEY = "member_count";
export const COMMUNITY_METRICS_CACHE_TAG = "community-metrics";
export const DEFAULT_COMMUNITY_MEMBER_COUNT = 500;

type CommunityMetricRow = {
  numeric_value: number;
};

const getCachedCommunityMemberCount = unstable_cache(
  async () => {
    const supabase = createPublicServerClient();
    const { data, error } = await supabase
      .from("community_metrics")
      .select("numeric_value")
      .eq("metric_key", COMMUNITY_MEMBER_COUNT_KEY)
      .maybeSingle();

    if (error) {
      if (error.code !== "PGRST205") {
        console.warn("Failed to load community member count.", error);
      }

      return DEFAULT_COMMUNITY_MEMBER_COUNT;
    }

    const row = data as CommunityMetricRow | null;
    const numericValue = row?.numeric_value;
    return Number.isInteger(numericValue) &&
      typeof numericValue === "number" &&
      numericValue >= 0
      ? numericValue
      : DEFAULT_COMMUNITY_MEMBER_COUNT;
  },
  ["community-member-count"],
  {
    revalidate: 60,
    tags: [COMMUNITY_METRICS_CACHE_TAG],
  },
);

export async function getCommunityMemberCount() {
  if (!hasSupabaseEnv()) {
    return DEFAULT_COMMUNITY_MEMBER_COUNT;
  }

  return getCachedCommunityMemberCount();
}

export function formatCommunityMemberCount(value: number) {
  return `${value}+`;
}
