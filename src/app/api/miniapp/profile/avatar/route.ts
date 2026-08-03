import { loadMiniappAccountSnapshot } from "@/lib/miniapp-auth";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { MINIAPP_PRIVACY_POLICY_VERSION } from "@/lib/miniapp-profile";
import { uploadPublicAsset } from "@/lib/public-asset-storage";
import { optimizeAvatarUpload } from "@/lib/uploaded-image-optimization";
import {
  buildMemberAvatarPath,
  MEMBER_AVATARS_BUCKET,
} from "@/lib/supabase/storage";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

function hasSupportedReportedType(file: File) {
  return (
    !file.type ||
    file.type === "application/octet-stream" ||
    file.type.startsWith("image/")
  );
}

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
  if (
    file.size === 0 ||
    file.size > MAX_AVATAR_BYTES ||
    !hasSupportedReportedType(file)
  ) {
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
  let publicUrl: string;
  let optimizedFile: File;

  try {
    optimizedFile = await optimizeAvatarUpload(file);
  } catch {
    return miniappJson({ error: "invalid_avatar" }, 400);
  }

  try {
    ({ publicUrl } = await uploadPublicAsset({
      bucket: MEMBER_AVATARS_BUCKET,
      path,
      file: optimizedFile,
      optimizeImage: false,
    }));
  } catch (error) {
    console.error("Failed to upload miniapp avatar to Tencent COS.", error);
    return miniappJson({ error: "avatar_upload_failed" }, 500);
  }

  const avatarUrl = `${publicUrl}?v=${Date.now()}`;
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
