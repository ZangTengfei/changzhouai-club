import { NextResponse } from "next/server";

import { getStaffContextResult } from "@/lib/supabase/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildCommunityQrCodePath,
  EVENT_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

export async function POST(request: Request) {
  const context = await getStaffContextResult();

  if (!context.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!context.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const storageAdmin = createSupabaseAdminClient();

  if (!storageAdmin) {
    return NextResponse.json(
      {
        error: "missing_service_role_key",
        message: "服务器未配置 SUPABASE_SERVICE_ROLE_KEY，暂时无法上传社群二维码。",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const assetPath = buildCommunityQrCodePath(file.name);
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
