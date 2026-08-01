import { loadMiniappAccountSnapshot } from "@/lib/miniapp-auth";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import {
  isMiniappDisplayNameReady,
  MINIAPP_PRIVACY_POLICY_VERSION,
} from "@/lib/miniapp-profile";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const context = await requireMiniappSession(request);
  if (context.response) return context.response;

  const payload = (await request.json().catch(() => null)) as {
    displayName?: unknown;
  } | null;
  const displayName =
    typeof payload?.displayName === "string" ? payload.displayName.trim() : "";

  if (displayName.length > 60 || !isMiniappDisplayNameReady(displayName)) {
    return miniappJson({ error: "invalid_display_name" }, 400);
  }

  const userId = context.session.user_id;
  const { data: consent, error: consentError } = await context.supabase
    .from("miniapp_consents")
    .select("policy_version")
    .eq("user_id", userId)
    .eq("policy_version", MINIAPP_PRIVACY_POLICY_VERSION)
    .maybeSingle();

  if (consentError) {
    return miniappJson({ error: "privacy_consent_load_failed" }, 500);
  }
  if (!consent) {
    return miniappJson({ error: "privacy_consent_required" }, 400);
  }

  const { error } = await context.supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId);

  if (error) {
    return miniappJson({ error: "profile_update_failed" }, 500);
  }

  const user = await loadMiniappAccountSnapshot(context.supabase, userId);
  return miniappJson({ user });
}
