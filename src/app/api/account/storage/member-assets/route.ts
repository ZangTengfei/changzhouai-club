import { resolveCommunityUserId } from "@/lib/community-user";
import { uploadPublicAsset } from "@/lib/public-asset-storage";
import { createClient } from "@/lib/supabase/server";
import { optimizeAvatarUpload } from "@/lib/uploaded-image-optimization";
import {
  buildMemberAvatarPath,
  buildMemberWorkAssetPath,
  MEMBER_AVATARS_BUCKET,
  MEMBER_WORK_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const assetType = formData?.get("assetType");

  if (!(file instanceof File)) {
    return Response.json({ error: "missing_file" }, { status: 400 });
  }

  if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "invalid_image" }, { status: 400 });
  }

  if (assetType !== "avatar" && assetType !== "work") {
    return Response.json({ error: "invalid_asset_type" }, { status: 400 });
  }

  try {
    const communityUserId = await resolveCommunityUserId(supabase, user.id);
    const isAvatar = assetType === "avatar";
    const uploadFile = isAvatar ? await optimizeAvatarUpload(file) : file;
    const result = await uploadPublicAsset({
      bucket: isAvatar ? MEMBER_AVATARS_BUCKET : MEMBER_WORK_ASSETS_BUCKET,
      path: isAvatar
        ? buildMemberAvatarPath(communityUserId)
        : buildMemberWorkAssetPath(communityUserId, file.name),
      file: uploadFile,
    });

    return Response.json({ publicUrl: result.publicUrl });
  } catch (error) {
    console.error("Failed to upload member asset to Tencent COS.", error);
    return Response.json(
      {
        error: "upload_failed",
        message: "图片上传失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
