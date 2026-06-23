import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildProjectAssetPath,
  EVENT_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

export async function POST(request: Request) {
  const { response } = await requireAdminApiPermission("projects.write");
  if (response) return response;

  const storageAdmin = createSupabaseAdminClient();

  if (!storageAdmin) {
    return NextResponse.json(
      {
        error: "missing_service_role_key",
        message: "服务器未配置 SUPABASE_SERVICE_ROLE_KEY，暂时无法上传项目图片。",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const projectSlug = String(formData.get("eventSlug") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const assetPath = buildProjectAssetPath(projectSlug, file.name);
  const { error: uploadError } = await storageAdmin.storage
    .from(EVENT_ASSETS_BUCKET)
    .upload(assetPath, file, {
      upsert: true,
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
