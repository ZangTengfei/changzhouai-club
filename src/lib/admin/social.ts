import { requireStaffContext } from "@/lib/supabase/guards";

export type AdminWechatQrCodeRow = {
  id: string;
  title: string;
  image_url: string;
  note: string | null;
  starts_at: string;
  expires_at: string;
  expiration_reminded_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type AdminSocialData = {
  qrCodes: AdminWechatQrCodeRow[];
  currentQrCode: AdminWechatQrCodeRow | null;
  queryErrors: string[];
};

export async function loadAdminSocialData(): Promise<AdminSocialData> {
  const { supabase } = await requireStaffContext();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("community_wechat_qr_codes")
    .select(
      "id, title, image_url, note, starts_at, expires_at, expiration_reminded_at, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  const qrCodes = (data ?? []) as AdminWechatQrCodeRow[];
  const currentQrCode =
    qrCodes.find(
      (item) => item.is_active && item.starts_at <= now && item.expires_at > now,
    ) ?? null;

  return {
    qrCodes,
    currentQrCode,
    queryErrors: [error?.message].filter(Boolean) as string[],
  };
}
