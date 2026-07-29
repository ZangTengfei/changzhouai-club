import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeAdminEventDateTime } from "@/lib/admin/event-datetime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EVENT_PRIVATE_ASSETS_BUCKET } from "@/lib/supabase/storage";

export type AdminEventGroupQrCode = {
  event_id: string;
  storage_path: string;
  note: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  previewUrl?: string | null;
};

export type AdminEventGroupQrInput = {
  storagePath: string | null;
  note: string | null;
  expiresAt: string | null;
  isActive: boolean;
};

function isValidEventGroupQrPath(value: string) {
  return (
    value.startsWith("events/") &&
    value.includes("/group-qr/") &&
    !value.includes("..") &&
    !value.includes("://")
  );
}

export function parseAdminEventGroupQrInput(
  payload: Record<string, unknown>,
): AdminEventGroupQrInput {
  const storagePath = String(payload.group_qr_storage_path ?? "").trim();
  const note = String(payload.group_qr_note ?? "").trim();
  const rawExpiresAt = String(payload.group_qr_expires_at ?? "").trim();
  const expiresAt = normalizeAdminEventDateTime(rawExpiresAt || null);

  if (storagePath && !isValidEventGroupQrPath(storagePath)) {
    throw new Error("invalid_group_qr_path");
  }
  if (note.length > 300) {
    throw new Error("invalid_group_qr_note");
  }
  if (expiresAt && Number.isNaN(Date.parse(expiresAt))) {
    throw new Error("invalid_group_qr_expiration");
  }

  return {
    storagePath: storagePath || null,
    note: note || null,
    expiresAt,
    isActive: payload.group_qr_active === true,
  };
}

async function deletePrivateQrObject(storagePath: string | null | undefined) {
  if (!storagePath) return;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const { error } = await supabase.storage
    .from(EVENT_PRIVATE_ASSETS_BUCKET)
    .remove([storagePath]);
  if (error) {
    console.error("Failed to remove private event group QR object.", {
      message: error.message,
    });
  }
}

export async function saveAdminEventGroupQrCode({
  supabase,
  eventId,
  actorId,
  input,
}: {
  supabase: SupabaseClient;
  eventId: string;
  actorId: string;
  input: AdminEventGroupQrInput;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("event_group_qr_codes")
    .select("storage_path")
    .eq("event_id", eventId)
    .maybeSingle();
  if (existingError) throw new Error("group_qr_load_failed");

  if (!input.storagePath) {
    const { error } = await supabase
      .from("event_group_qr_codes")
      .delete()
      .eq("event_id", eventId);
    if (error) throw new Error("group_qr_save_failed");
    await deletePrivateQrObject(existing?.storage_path);
    return;
  }

  const { error } = await supabase.from("event_group_qr_codes").upsert(
    {
      event_id: eventId,
      storage_path: input.storagePath,
      note: input.note,
      expires_at: input.expiresAt,
      is_active: input.isActive,
      created_by: actorId,
    },
    { onConflict: "event_id" },
  );
  if (error) throw new Error("group_qr_save_failed");

  if (existing?.storage_path && existing.storage_path !== input.storagePath) {
    await deletePrivateQrObject(existing.storage_path);
  }
}

export async function deleteAdminEventGroupQrObject(storagePath?: string | null) {
  await deletePrivateQrObject(storagePath);
}

export async function createAdminEventGroupQrPreviewUrl(
  storagePath?: string | null,
) {
  if (!storagePath) return null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage
    .from(EVENT_PRIVATE_ASSETS_BUCKET)
    .createSignedUrl(storagePath, 5 * 60);
  if (error) return null;
  return data.signedUrl;
}
