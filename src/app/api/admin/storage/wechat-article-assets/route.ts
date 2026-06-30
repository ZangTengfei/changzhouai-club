import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildWechatArticleAssetPath,
  EVENT_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

export async function POST(request: Request) {
  const { response } = await requireAdminApiPermission("storage.upload_community_assets");
  if (response) return response;

  const storageAdmin = createSupabaseAdminClient();

  if (!storageAdmin) {
    return NextResponse.json(
      {
        error: "missing_service_role_key",
        message: "服务器未配置 SUPABASE_SERVICE_ROLE_KEY，暂时无法上传公众号图片。",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  if (file.type && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  const assetPath = buildWechatArticleAssetPath(file.name);
  const { error: uploadError } = await storageAdmin.storage
    .from(EVENT_ASSETS_BUCKET)
    .upload(assetPath, file, {
      contentType: file.type || undefined,
    });

  if (uploadError) {
    return NextResponse.json(
      {
        error: "upload_failed",
        message: uploadError.message,
      },
      { status: 400 },
    );
  }

  const { data } = storageAdmin.storage
    .from(EVENT_ASSETS_BUCKET)
    .getPublicUrl(assetPath);

  return NextResponse.json({ publicUrl: data.publicUrl });
}
