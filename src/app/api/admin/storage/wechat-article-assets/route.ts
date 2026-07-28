import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { uploadPublicAsset } from "@/lib/public-asset-storage";
import {
  buildWechatArticleAssetPath,
  EVENT_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

export async function POST(request: Request) {
  const { response } = await requireAdminApiPermission("storage.upload_community_assets");
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  if (file.type && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  try {
    const result = await uploadPublicAsset({
      bucket: EVENT_ASSETS_BUCKET,
      path: buildWechatArticleAssetPath(file.name),
      file,
    });

    return NextResponse.json({ publicUrl: result.publicUrl });
  } catch (error) {
    console.error("Failed to upload WeChat article asset to Tencent COS.", error);
    return NextResponse.json(
      {
        error: "upload_failed",
        message: "公众号图片上传失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
