"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffContext } from "@/lib/supabase/guards";

function normalizeSlug(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getOptionalValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export async function saveAdminEvent(formData: FormData) {
  const { supabase, user } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = normalizeSlug(slugInput || title);
  const status = String(formData.get("status") ?? "draft").trim();

  if (!title || !slug) {
    redirect("/admin?error=missing_required_fields");
  }

  const payload = {
    title,
    slug,
    summary: getOptionalValue(formData, "summary"),
    description: getOptionalValue(formData, "description"),
    event_at: getOptionalValue(formData, "event_at"),
    venue: getOptionalValue(formData, "venue"),
    city: getOptionalValue(formData, "city") ?? "常州",
    cover_image_url: getOptionalValue(formData, "cover_image_url"),
    status,
  };

  if (eventId) {
    await supabase.from("events").update(payload).eq("id", eventId);
  } else {
    await supabase.from("events").insert({
      ...payload,
      created_by: user.id,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/events");
  redirect("/admin?saved=event");
}

export async function deleteAdminEvent(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();

  if (eventId) {
    await supabase.from("events").delete().eq("id", eventId);
  }

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/account");
  redirect("/admin?saved=deleted");
}
