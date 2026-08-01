import { loadMiniappAccountSnapshot } from "@/lib/miniapp-auth";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import {
  MINIAPP_PHONE_CONTACT_POLICY_VERSION,
  MINIAPP_PRIVACY_POLICY_VERSION,
} from "@/lib/miniapp-profile";
import {
  exchangeWechatMiniappPhoneCode,
  getWechatMiniappConfig,
} from "@/lib/wechat-miniapp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const context = await requireMiniappSession(request);
  if (context.response) return context.response;

  const payload = (await request.json().catch(() => null)) as {
    code?: unknown;
  } | null;
  const code = typeof payload?.code === "string" ? payload.code.trim() : "";
  if (!code || code.length > 256) {
    return miniappJson({ error: "invalid_phone_code" }, 400);
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

  const config = getWechatMiniappConfig();
  if (!config) {
    return miniappJson({ error: "wechat_not_configured" }, 503);
  }

  let phoneNumber: string;
  let countryCode: string | null;
  try {
    ({ phoneNumber, countryCode } = await exchangeWechatMiniappPhoneCode(
      config,
      code,
    ));
  } catch {
    return miniappJson({ error: "phone_authorization_failed" }, 400);
  }

  const now = new Date().toISOString();
  const [contactResult, phoneConsentResult] = await Promise.all([
    context.supabase.from("member_private_contacts").upsert(
      {
        user_id: userId,
        phone_number: phoneNumber,
        phone_country_code: countryCode,
        phone_last4: phoneNumber.slice(-4),
        phone_verified_at: now,
        phone_source: "wechat",
      },
      { onConflict: "user_id" },
    ),
    context.supabase.from("miniapp_consents").upsert(
      {
        user_id: userId,
        policy_version: MINIAPP_PHONE_CONTACT_POLICY_VERSION,
        accepted_at: now,
      },
      { onConflict: "user_id,policy_version" },
    ),
  ]);

  if (contactResult.error || phoneConsentResult.error) {
    return miniappJson({ error: "phone_save_failed" }, 500);
  }

  const user = await loadMiniappAccountSnapshot(context.supabase, userId);
  return miniappJson({ user });
}
