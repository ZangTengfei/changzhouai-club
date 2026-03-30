"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffContext } from "@/lib/supabase/guards";

const ADMIN_EVENTS_PATH = "/admin/events";
const ADMIN_MEMBERS_PATH = "/admin/members";

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

function revalidateEventPaths(eventId?: string) {
  revalidatePath(ADMIN_EVENTS_PATH);
  revalidatePath("/events");
  revalidatePath("/archive");

  if (eventId) {
    revalidatePath(`${ADMIN_EVENTS_PATH}/${eventId}`);
  }
}

function revalidateMemberPaths() {
  revalidatePath(ADMIN_MEMBERS_PATH);
  revalidatePath("/members");
}

export async function saveAdminEvent(formData: FormData) {
  const { supabase, user } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = normalizeSlug(slugInput || title);
  const status = String(formData.get("status") ?? "draft").trim();

  if (!title || !slug) {
    redirect(`${ADMIN_EVENTS_PATH}?error=missing_required_fields`);
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
    const { error } = await supabase.from("events").update(payload).eq("id", eventId);

    if (error) {
      redirect(`${ADMIN_EVENTS_PATH}/${eventId}?error=database_write_failed`);
    }

    revalidateEventPaths(eventId);
    redirect(`${ADMIN_EVENTS_PATH}/${eventId}?saved=event`);
  } else {
    const { data: createdEvent, error } = await supabase
      .from("events")
      .insert({
        ...payload,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !createdEvent?.id) {
      redirect(`${ADMIN_EVENTS_PATH}?error=database_write_failed`);
    }

    revalidateEventPaths(createdEvent.id);
    redirect(`${ADMIN_EVENTS_PATH}/${createdEvent.id}?saved=event`);
  }
}

export async function deleteAdminEvent(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();

  if (eventId) {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      redirect(`${ADMIN_EVENTS_PATH}/${eventId}?error=database_write_failed`);
    }
  }

  revalidateEventPaths();
  revalidatePath("/account");
  redirect(`${ADMIN_EVENTS_PATH}?saved=deleted`);
}

export async function saveAdminEventPhoto(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const photoId = String(formData.get("photo_id") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!eventId || !imageUrl) {
    redirect(`${ADMIN_EVENTS_PATH}?error=missing_photo_fields`);
  }

  const payload = {
    event_id: eventId,
    image_url: imageUrl,
    caption: getOptionalValue(formData, "caption"),
    sort_order: getOptionalInteger(formData, "sort_order"),
  };

  if (photoId) {
    const { error } = await supabase.from("event_photos").update(payload).eq("id", photoId);

    if (error) {
      redirect(`${ADMIN_EVENTS_PATH}/${eventId}?error=database_write_failed`);
    }
  } else {
    const { error } = await supabase.from("event_photos").insert(payload);

    if (error) {
      redirect(`${ADMIN_EVENTS_PATH}/${eventId}?error=database_write_failed`);
    }
  }

  revalidateEventPaths(eventId);
  redirect(`${ADMIN_EVENTS_PATH}/${eventId}?saved=photo`);
}

export async function deleteAdminEventPhoto(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const photoId = String(formData.get("photo_id") ?? "").trim();

  if (photoId) {
    const { error } = await supabase.from("event_photos").delete().eq("id", photoId);

    if (error) {
      redirect(`${ADMIN_EVENTS_PATH}/${eventId}?error=database_write_failed`);
    }
  }

  revalidateEventPaths(eventId);
  redirect(`${ADMIN_EVENTS_PATH}/${eventId}?saved=photo_deleted`);
}

export async function setAdminEventCoverImage(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!eventId || !imageUrl) {
    redirect(`${ADMIN_EVENTS_PATH}?error=missing_photo_fields`);
  }

  const { error } = await supabase
    .from("events")
    .update({ cover_image_url: imageUrl })
    .eq("id", eventId);

  if (error) {
    redirect(`${ADMIN_EVENTS_PATH}/${eventId}?error=database_write_failed`);
  }

  revalidateEventPaths(eventId);
  redirect(`${ADMIN_EVENTS_PATH}/${eventId}?saved=cover`);
}

export async function updateAdminMember(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const memberId = String(formData.get("member_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const isPubliclyVisible = formData.get("is_publicly_visible") === "on";

  if (!memberId || !status) {
    redirect(`${ADMIN_MEMBERS_PATH}?error=missing_required_fields`);
  }

  const { error } = await supabase
    .from("members")
    .update({
      status,
      is_publicly_visible: isPubliclyVisible,
    })
    .eq("id", memberId);

  if (error) {
    redirect(`${ADMIN_MEMBERS_PATH}?error=database_write_failed`);
  }

  revalidateMemberPaths();
  redirect(`${ADMIN_MEMBERS_PATH}?saved=member`);
}
