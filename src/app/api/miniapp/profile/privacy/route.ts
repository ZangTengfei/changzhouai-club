import { loadMiniappAccountSnapshot } from "@/lib/miniapp-auth";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { MINIAPP_PRIVACY_POLICY_VERSION } from "@/lib/miniapp-profile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = await requireMiniappSession(request);
  if (context.response) return context.response;

  const payload = (await request.json().catch(() => null)) as {
    accepted?: unknown;
    policyVersion?: unknown;
  } | null;
  if (
    payload?.accepted !== true ||
    payload.policyVersion !== MINIAPP_PRIVACY_POLICY_VERSION
  ) {
    return miniappJson({ error: "privacy_consent_required" }, 400);
  }

  const userId = context.session.user_id;
  const { error } = await context.supabase.from("miniapp_consents").upsert(
    {
      user_id: userId,
      policy_version: MINIAPP_PRIVACY_POLICY_VERSION,
      accepted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,policy_version" },
  );
  if (error) {
    return miniappJson({ error: "privacy_consent_save_failed" }, 500);
  }

  const user = await loadMiniappAccountSnapshot(context.supabase, userId);
  return miniappJson({ user });
}
