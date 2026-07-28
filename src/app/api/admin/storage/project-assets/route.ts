import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { uploadPublicAsset } from "@/lib/public-asset-storage";
import {
  buildProjectAssetPath,
  EVENT_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

export async function POST(request: Request) {
  const { response } = await requireAdminApiPermission("projects.write");
  if (response) return response;

  const formData = await request.formData();
  const projectSlug = String(formData.get("eventSlug") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  try {
    const result = await uploadPublicAsset({
      bucket: EVENT_ASSETS_BUCKET,
      path: buildProjectAssetPath(projectSlug, file.name),
      file,
    });

    return NextResponse.json({ publicUrl: result.publicUrl });
  } catch (error) {
    console.error("Failed to upload project asset to Tencent COS.", error);
    return NextResponse.json(
      {
        error: "upload_failed",
        message: "项目图片上传失败，请稍后再试。",
      },
      { status: 500 },
    );
  }
}
