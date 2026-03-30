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

function normalizeSkills(raw: string) {
  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildRedirectPath(basePath: string, redirectTo: string | null, params: Record<string, string>) {
  const safeTarget = redirectTo?.startsWith("/") ? redirectTo : basePath;
  const [pathname, query = ""] = safeTarget.split("?");
  const searchParams = new URLSearchParams(query);

  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  const nextQuery = searchParams.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function revalidateRedirectPath(redirectTo: string | null) {
  if (!redirectTo?.startsWith("/")) {
    return;
  }

  const [pathname] = redirectTo.split("?");
  revalidatePath(pathname);
}

function revalidateEventPaths(eventId?: string) {
  revalidatePath(ADMIN_EVENTS_PATH);
  revalidatePath("/");
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
  const redirectTo = getOptionalValue(formData, "redirect_to");
  const isPubliclyVisible = formData.get("is_publicly_visible") === "on";

  if (!memberId || !status) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "missing_required_fields",
      }),
    );
  }

  const { error } = await supabase
    .from("members")
    .update({
      status,
      is_publicly_visible: isPubliclyVisible,
    })
    .eq("id", memberId);

  if (error) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  revalidateMemberPaths();
  revalidateRedirectPath(redirectTo);
  redirect(
    buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
      saved: "member",
    }),
  );
}

export async function updateAdminMemberProfile(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const memberId = String(formData.get("member_id") ?? "").trim();
  const redirectTo = getOptionalValue(formData, "redirect_to");
  const displayName = getOptionalValue(formData, "display_name");
  const city = getOptionalValue(formData, "city") ?? "常州";
  const bio = getOptionalValue(formData, "bio");
  const skills = normalizeSkills(String(formData.get("skills") ?? ""));
  const willingToShare = formData.get("willing_to_share") === "on";
  const willingToJoinProjects = formData.get("willing_to_join_projects") === "on";

  if (!memberId) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "missing_required_fields",
      }),
    );
  }

  const [{ error: profileError }, { error: memberError }] = await Promise.all([
    supabase
      .from("profiles")
      .update({
        display_name: displayName,
        city,
        bio,
        skills,
      })
      .eq("id", memberId),
    supabase
      .from("members")
      .update({
        willing_to_share: willingToShare,
        willing_to_join_projects: willingToJoinProjects,
      })
      .eq("id", memberId),
  ]);

  if (profileError || memberError) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  revalidateMemberPaths();
  revalidateRedirectPath(redirectTo);
  redirect(
    buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
      saved: "member_profile",
    }),
  );
}

export async function updateAdminJoinRequest(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const requestId = String(formData.get("request_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const redirectTo = getOptionalValue(formData, "redirect_to");
  const adminNote = getOptionalValue(formData, "admin_note");

  if (!requestId || !status) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "missing_required_fields",
      }),
    );
  }

  const { data: existingRequest, error: existingError } = await supabase
    .from("community_join_requests")
    .select("contacted_at, approved_at")
    .eq("id", requestId)
    .single();

  if (existingError || !existingRequest) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  const now = new Date().toISOString();
  const payload: {
    status: string;
    admin_note: string | null;
    contacted_at?: string;
    approved_at?: string;
  } = {
    status,
    admin_note: adminNote,
  };

  if (status === "contacted" && !existingRequest.contacted_at) {
    payload.contacted_at = now;
  }

  if (status === "approved") {
    if (!existingRequest.contacted_at) {
      payload.contacted_at = now;
    }

    if (!existingRequest.approved_at) {
      payload.approved_at = now;
    }
  }

  const { error } = await supabase
    .from("community_join_requests")
    .update(payload)
    .eq("id", requestId);

  if (error) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  revalidateMemberPaths();
  revalidateRedirectPath(redirectTo);
  redirect(
    buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
      saved: "join_request",
    }),
  );
}

export async function updateAdminJoinRequestPipeline(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const requestId = String(formData.get("request_id") ?? "").trim();
  const redirectTo = getOptionalValue(formData, "redirect_to");
  const convertedMemberId = getOptionalValue(formData, "converted_member_id");

  if (!requestId) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "missing_required_fields",
      }),
    );
  }

  const { data: existingRequest, error: existingError } = await supabase
    .from("community_join_requests")
    .select(
      "status, contacted_at, approved_at, invited_to_register_at, joined_group_at, first_attended_event_at, converted_to_member_at, converted_member_id",
    )
    .eq("id", requestId)
    .single();

  if (existingError || !existingRequest) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  const now = new Date().toISOString();
  const markInvited = formData.get("mark_invited_to_register") === "on";
  const markJoinedGroup = formData.get("mark_joined_group") === "on";
  const markFirstAttended = formData.get("mark_first_attended_event") === "on";
  const markConverted = formData.get("mark_converted_to_member") === "on";

  const nextStatus =
    markConverted || convertedMemberId
      ? existingRequest.status === "archived"
        ? "archived"
        : "approved"
      : existingRequest.status;

  const payload = {
    status: nextStatus,
    invited_to_register_at: markInvited
      ? existingRequest.invited_to_register_at ?? now
      : null,
    joined_group_at: markJoinedGroup ? existingRequest.joined_group_at ?? now : null,
    first_attended_event_at: markFirstAttended
      ? existingRequest.first_attended_event_at ?? now
      : null,
    converted_to_member_at: markConverted
      ? existingRequest.converted_to_member_at ?? now
      : null,
    converted_member_id: convertedMemberId,
    contacted_at:
      markJoinedGroup || markFirstAttended || markConverted || convertedMemberId
        ? existingRequest.contacted_at ?? now
        : existingRequest.contacted_at,
    approved_at:
      markConverted || convertedMemberId
        ? existingRequest.approved_at ?? now
        : existingRequest.approved_at,
  };

  const { error } = await supabase
    .from("community_join_requests")
    .update(payload)
    .eq("id", requestId);

  if (error) {
    redirect(
      buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  revalidateMemberPaths();
  revalidateRedirectPath(redirectTo);
  redirect(
    buildRedirectPath(ADMIN_MEMBERS_PATH, redirectTo, {
      saved: "join_request_pipeline",
    }),
  );
}
