import { NextResponse } from "next/server";

import { verifyPrivateEventGroupQrUrl } from "@/lib/private-event-group-qr-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isEventGroupQrCosKey } from "@/lib/supabase/storage";
import { getTencentCosObject } from "@/lib/tencent-cos";

export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json(
    { error: "not_available" },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await context.params;
  const url = new URL(request.url);

  if (
    !verifyPrivateEventGroupQrUrl(
      eventId,
      url.searchParams.get("expires"),
      url.searchParams.get("signature"),
    )
  ) {
    return unavailable();
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return unavailable();

  const { data: qrCode, error } = await supabase
    .from("event_group_qr_codes")
    .select("storage_path, expires_at")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .maybeSingle();
  if (
    error ||
    !qrCode ||
    !isEventGroupQrCosKey(qrCode.storage_path) ||
    (qrCode.expires_at && Date.parse(qrCode.expires_at) <= Date.now())
  ) {
    return unavailable();
  }

  try {
    const object = await getTencentCosObject(qrCode.storage_path);
    const body = new Uint8Array(object.Body.byteLength);
    body.set(object.Body);
    return new Response(body.buffer, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Type": object.headers?.["content-type"] ?? "image/webp",
        "Content-Length": String(object.Body.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return unavailable();
  }
}
