import { unstable_cache } from "next/cache";

import { hasSupabaseEnv } from "@/lib/env";
import { createPublicServerClient } from "@/lib/supabase/public-server";

const PUBLIC_SOCIAL_REVALIDATE_SECONDS = 60;

export type PublicWechatQrCode = {
  id: string;
  title: string;
  imageUrl: string;
  note: string | null;
  expiresAt: string;
};

type WechatQrCodeRow = {
  id: string;
  title: string;
  image_url: string;
  note: string | null;
  expires_at: string;
};

function mapPublicWechatQrCode(row: WechatQrCodeRow): PublicWechatQrCode {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    note: row.note,
    expiresAt: row.expires_at,
  };
}

export async function getCurrentWechatQrCode() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return getCachedCurrentWechatQrCode();
}

const getCachedCurrentWechatQrCode = unstable_cache(
  async () => {
    const supabase = createPublicServerClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("community_wechat_qr_codes")
      .select("id, title, image_url, note, expires_at")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gt("expires_at", now)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      return null;
    }

    return mapPublicWechatQrCode(data as WechatQrCodeRow);
  },
  ["public-current-wechat-qr-code"],
  { revalidate: PUBLIC_SOCIAL_REVALIDATE_SECONDS },
);
