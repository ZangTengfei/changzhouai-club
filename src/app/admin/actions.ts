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

function getOptionalInteger(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
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
  revalidatePath("/archive");
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
  revalidatePath("/archive");
  revalidatePath("/account");
  redirect("/admin?saved=deleted");
}

export async function saveAdminEventPhoto(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const photoId = String(formData.get("photo_id") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!eventId || !imageUrl) {
    redirect("/admin?error=missing_photo_fields");
  }

  const payload = {
    event_id: eventId,
    image_url: imageUrl,
    caption: getOptionalValue(formData, "caption"),
    sort_order: getOptionalInteger(formData, "sort_order"),
  };

  if (photoId) {
    await supabase.from("event_photos").update(payload).eq("id", photoId);
  } else {
    await supabase.from("event_photos").insert(payload);
  }

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/archive");
  redirect(`/admin?saved=photo#event-${eventId}`);
}

export async function deleteAdminEventPhoto(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const photoId = String(formData.get("photo_id") ?? "").trim();

  if (photoId) {
    await supabase.from("event_photos").delete().eq("id", photoId);
  }

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/archive");
  redirect(`/admin?saved=photo_deleted#event-${eventId}`);
}

export async function setAdminEventCoverImage(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!eventId || !imageUrl) {
    redirect("/admin?error=missing_photo_fields");
  }

  await supabase.from("events").update({ cover_image_url: imageUrl }).eq("id", eventId);

  revalidatePath("/admin");
  revalidatePath("/events");
  revalidatePath("/archive");
  redirect(`/admin?saved=cover#event-${eventId}`);
}
