import type { SupabaseClient } from "@supabase/supabase-js";

const COMMUNITY_USER_RESOLUTION_RETRY_DELAY_MS = 150;

function waitForRetry() {
  return new Promise((resolve) => {
    setTimeout(resolve, COMMUNITY_USER_RESOLUTION_RETRY_DELAY_MS);
  });
}

export async function resolveCommunityUserId(
  supabase: SupabaseClient,
  authUserId: string,
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data, error, status } = await supabase.rpc(
        "resolve_community_user_id",
        {
          requested_user_id: authUserId,
        },
      );

      if (!error && typeof data === "string") {
        return data;
      }

      if (attempt === 0 && (status === 0 || status >= 500)) {
        console.warn("Retrying community user resolution after transient failure.", {
          status,
        });
        await waitForRetry();
        continue;
      }
    } catch {
      if (attempt === 0) {
        console.warn("Retrying community user resolution after transport failure.");
        await waitForRetry();
        continue;
      }
    }

    break;
  }

  throw new Error("community_user_resolution_failed");
}
