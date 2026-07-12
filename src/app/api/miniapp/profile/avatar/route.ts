import { loadMiniappAccountSnapshot } from "@/lib/miniapp-auth";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { MINIAPP_PRIVACY_POLICY_VERSION } from "@/lib/miniapp-profile";
import {
  buildMemberAvatarPath,
  MEMBER_AVATARS_BUCKET,
} from "@/lib/supabase/storage";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const privacyAccepted = formData?.get("privacyAccepted") === "true";
  const policyVersion = String(formData?.get("policyVersion") ?? "");
  if (
    !privacyAccepted ||
    policyVersion !== MINIAPP_PRIVACY_POLICY_VERSION
  ) {
    return miniappJson({ error: "privacy_consent_required" }, 400);
  }
  if (!(file instanceof File)) {
    return miniappJson({ error: "missing_avatar" }, 400);
  }
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_AVATAR_BYTES) {
    return miniappJson({ error: "invalid_avatar" }, 400);
  }

  const userId = auth.session.user_id;
  const { error: consentError } = await auth.supabase
    .from("miniapp_consents")
    .upsert(
      {
        user_id: userId,
        policy_version: MINIAPP_PRIVACY_POLICY_VERSION,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: "user_id,policy_version" },
    );
  if (consentError) {
    return miniappJson({ error: "privacy_consent_save_failed" }, 500);
  }

  const path = buildMemberAvatarPath(userId);
  const { error: uploadError } = await auth.supabase.storage
    .from(MEMBER_AVATARS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return miniappJson({ error: "avatar_upload_failed" }, 500);
  }

  const { data } = auth.supabase.storage
    .from(MEMBER_AVATARS_BUCKET)
    .getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  const { error: profileError } = await auth.supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);

  if (profileError) {
    return miniappJson({ error: "avatar_profile_update_failed" }, 500);
  }

  const user = await loadMiniappAccountSnapshot(auth.supabase, userId);
  return miniappJson({ avatarUrl, user });
}
