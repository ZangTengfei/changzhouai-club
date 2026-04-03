import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getStaffContextResult } from "@/lib/supabase/guards";
import {
  buildEventAssetPath,
  EVENT_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

function createAdminStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  const context = await getStaffContextResult();

  if (!context.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!context.isStaff) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const storageAdmin = createAdminStorageClient();

  if (!storageAdmin) {
    return NextResponse.json(
      {
        error: "missing_service_role_key",
        message: "服务器未配置 SUPABASE_SERVICE_ROLE_KEY，暂时无法上传活动图片。",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const eventSlug = String(formData.get("eventSlug") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }

  const assetPath = buildEventAssetPath(eventSlug, file.name);
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
