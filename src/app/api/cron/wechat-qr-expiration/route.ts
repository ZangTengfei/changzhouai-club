import { NextResponse } from "next/server";

import { sendWechatQrExpirationReminder } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ExpiringWechatQrCodeRow = {
  id: string;
  title: string;
  note: string | null;
  expires_at: string;
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "missing_service_role_key" },
      { status: 500 },
    );
  }

  const reminderWindowHours = Number(
    process.env.WECHAT_QR_EXPIRATION_REMINDER_HOURS ?? "24",
  );
  const reminderWindowMs =
    Number.isFinite(reminderWindowHours) && reminderWindowHours > 0
      ? reminderWindowHours * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;
  const now = new Date();
  const threshold = new Date(now.getTime() + reminderWindowMs).toISOString();

  const { data, error } = await supabase
    .from("community_wechat_qr_codes")
    .select("id, title, note, expires_at")
    .eq("is_active", true)
    .is("expiration_reminded_at", null)
    .lte("expires_at", threshold)
    .order("expires_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Failed to load expiring WeChat QR codes.", {
      message: error.message,
    });

    return NextResponse.json(
      { error: "database_read_failed" },
      { status: 500 },
    );
  }

  const qrCodes = (data ?? []) as ExpiringWechatQrCodeRow[];
  const results = await Promise.all(
    qrCodes.map(async (qrCode) => {
      const notified = await sendWechatQrExpirationReminder({
        qrCodeId: qrCode.id,
        title: qrCode.title,
        note: qrCode.note,
        expiresAt: qrCode.expires_at,
      });

      if (!notified) {
        return {
          id: qrCode.id,
          notified,
        };
      }

      const { error: updateError } = await supabase
        .from("community_wechat_qr_codes")
        .update({ expiration_reminded_at: new Date().toISOString() })
        .eq("id", qrCode.id);

      if (updateError) {
        console.error("Failed to mark WeChat QR expiration reminder.", {
          id: qrCode.id,
          message: updateError.message,
        });
      }

      return {
        id: qrCode.id,
        notified,
        marked: !updateError,
      };
    }),
  );

  return NextResponse.json({
    checked: qrCodes.length,
    notified: results.filter((result) => result.notified).length,
    results,
  });
}
