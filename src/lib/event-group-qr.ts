import type { SupabaseClient } from "@supabase/supabase-js";

import { EVENT_PRIVATE_ASSETS_BUCKET } from "@/lib/supabase/storage";

export type ConfirmedEventGroupQr = {
  imageUrl: string;
  note: string | null;
  expiresAt: string | null;
};

export async function getConfirmedEventGroupQr({
  supabase,
  eventSlug,
  userId,
}: {
  supabase: SupabaseClient;
  eventSlug: string;
  userId: string;
}): Promise<ConfirmedEventGroupQr | null> {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("slug", eventSlug)
    .neq("status", "draft")
    .maybeSingle();
  if (eventError) throw new Error("event_load_failed");
  if (!event) return null;

  const { data: registration, error: registrationError } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", event.id)
    .eq("user_id", userId)
    .eq("status", "registered")
    .maybeSingle();
  if (registrationError) throw new Error("registration_load_failed");
  if (!registration) return null;

  const { data: qrCode, error: qrCodeError } = await supabase
    .from("event_group_qr_codes")
    .select("storage_path, note, expires_at")
    .eq("event_id", event.id)
    .eq("is_active", true)
    .maybeSingle();
  if (qrCodeError) throw new Error("group_qr_load_failed");
  if (
    !qrCode ||
    (qrCode.expires_at && Date.parse(qrCode.expires_at) <= Date.now())
  ) {
    return null;
  }

  const { data: signedUrl, error: signedUrlError } = await supabase.storage
    .from(EVENT_PRIVATE_ASSETS_BUCKET)
    .createSignedUrl(qrCode.storage_path, 5 * 60);
  if (signedUrlError) throw new Error("group_qr_sign_failed");

  return {
    imageUrl: signedUrl.signedUrl,
    note: qrCode.note,
    expiresAt: qrCode.expires_at,
  };
}
