import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { optimizeQrCodeUpload } from "@/lib/uploaded-image-optimization";
import {
  buildEventGroupQrPath,
  EVENT_PRIVATE_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

const MAX_QR_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const { response } = await requireAdminApiPermission(
    "storage.upload_event_assets",
  );
  if (response) return response;

  const formData = await request.formData();
  const eventSlug = String(formData.get("eventSlug") ?? "").trim();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") || file.size > MAX_QR_FILE_SIZE) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }

  const optimizedFile = await optimizeQrCodeUpload(file).catch(() => null);
  if (!optimizedFile) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }

  const storagePath = buildEventGroupQrPath(eventSlug, optimizedFile.name);
  const { error } = await supabase.storage
    .from(EVENT_PRIVATE_ASSETS_BUCKET)
    .upload(storagePath, optimizedFile, {
      cacheControl: "private, max-age=300",
      contentType: optimizedFile.type,
      upsert: false,
    });

  if (error) {
    console.error("Failed to upload private event group QR code.", {
      message: error.message,
    });
    return NextResponse.json(
      { error: "upload_failed", message: "活动群二维码上传失败，请稍后重试。" },
      { status: 500 },
    );
  }

  return NextResponse.json({ value: storagePath });
}
