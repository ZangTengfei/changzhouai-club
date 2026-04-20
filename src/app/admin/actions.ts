"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffContext } from "@/lib/supabase/guards";

const ADMIN_EVENTS_PATH = "/admin/events";
const ADMIN_LEADS_PATH = "/admin/leads";
const ADMIN_MEMBERS_PATH = "/admin/members";
const ADMIN_SOCIAL_PATH = "/admin/social";

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

function revalidateEventPaths(eventId?: string, eventSlug?: string) {
  revalidatePath(ADMIN_EVENTS_PATH);
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/archive");

  if (eventId) {
    revalidatePath(`${ADMIN_EVENTS_PATH}/${eventId}`);
  }

  if (eventSlug) {
    revalidatePath(`/events/${eventSlug}`);
  }
}

function revalidateMemberPaths() {
  revalidatePath(ADMIN_MEMBERS_PATH);
  revalidatePath("/members");
}

function revalidateLeadPaths(leadId?: string) {
  revalidatePath(ADMIN_LEADS_PATH);

  if (leadId) {
    revalidatePath(`${ADMIN_LEADS_PATH}/${leadId}`);
  }
}

function revalidateSocialPaths() {
  revalidatePath(ADMIN_SOCIAL_PATH);
  revalidatePath("/");
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
    agenda: getOptionalValue(formData, "agenda"),
    speaker_lineup: getOptionalValue(formData, "speaker_lineup"),
    registration_note: getOptionalValue(formData, "registration_note"),
    recap: getOptionalValue(formData, "recap"),
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

    revalidateEventPaths(eventId, slug);
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

    revalidateEventPaths(createdEvent.id, slug);
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
  const eventSlug = String(formData.get("event_slug") ?? "").trim();
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

  revalidateEventPaths(eventId, eventSlug || undefined);
  redirect(`${ADMIN_EVENTS_PATH}/${eventId}?saved=photo`);
}

export async function deleteAdminEventPhoto(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const eventSlug = String(formData.get("event_slug") ?? "").trim();
  const photoId = String(formData.get("photo_id") ?? "").trim();

  if (photoId) {
    const { error } = await supabase.from("event_photos").delete().eq("id", photoId);

    if (error) {
      redirect(`${ADMIN_EVENTS_PATH}/${eventId}?error=database_write_failed`);
    }
  }

  revalidateEventPaths(eventId, eventSlug || undefined);
  redirect(`${ADMIN_EVENTS_PATH}/${eventId}?saved=photo_deleted`);
}

export async function setAdminEventCoverImage(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const eventId = String(formData.get("event_id") ?? "").trim();
  const eventSlug = String(formData.get("event_slug") ?? "").trim();
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

  revalidateEventPaths(eventId, eventSlug || undefined);
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
  const wechat = getOptionalValue(formData, "wechat");
  const city = getOptionalValue(formData, "city") ?? "常州";
  const roleLabel = getOptionalValue(formData, "role_label");
  const organization = getOptionalValue(formData, "organization");
  const monthlyTime = getOptionalValue(formData, "monthly_time");
  const bio = getOptionalValue(formData, "bio");
  const skills = normalizeSkills(String(formData.get("skills") ?? ""));
  const interests = normalizeSkills(String(formData.get("interests") ?? ""));
  const willingToAttend = formData.get("willing_to_attend") === "on";
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
        wechat,
        city,
        role_label: roleLabel,
        organization,
        monthly_time: monthlyTime,
        bio,
        skills,
        interests,
      })
      .eq("id", memberId),
    supabase
      .from("members")
      .update({
        willing_to_attend: willingToAttend,
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

export async function updateAdminLead(formData: FormData) {
  const { supabase, user } = await requireStaffContext();

  const leadId = String(formData.get("lead_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const redirectTo = getOptionalValue(formData, "redirect_to");

  if (!leadId || !status) {
    redirect(
      buildRedirectPath("/admin/leads", redirectTo, {
        error: "missing_required_fields",
      }),
    );
  }

  const { error } = await supabase
    .from("cooperation_leads")
    .update({
      status,
      owner_id: user.id,
    })
    .eq("id", leadId);

  if (error) {
    redirect(
      buildRedirectPath("/admin/leads", redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  revalidatePath("/admin/leads");
  revalidateLeadPaths(leadId);
  revalidateRedirectPath(redirectTo);
  redirect(
    buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
      saved: "lead",
    }),
  );
}

export async function updateAdminLeadDetail(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const leadId = String(formData.get("lead_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const redirectTo = getOptionalValue(formData, "redirect_to");
  const adminNote = getOptionalValue(formData, "admin_note");
  const ownerId = getOptionalValue(formData, "owner_id");
  const nextAction = getOptionalValue(formData, "next_action");
  const nextActionAt = getOptionalValue(formData, "next_action_at");
  const lastContactedAt = getOptionalValue(formData, "last_contacted_at");

  if (!leadId || !status) {
    redirect(
      buildRedirectPath("/admin/leads", redirectTo, {
        error: "missing_required_fields",
      }),
    );
  }

  const { error } = await supabase
    .from("cooperation_leads")
    .update({
      status,
      admin_note: adminNote,
      owner_id: ownerId,
      next_action: nextAction,
      next_action_at: nextActionAt,
      last_contacted_at: lastContactedAt,
    })
    .eq("id", leadId);

  if (error) {
    redirect(
      buildRedirectPath("/admin/leads", redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  revalidateLeadPaths(leadId);
  revalidateRedirectPath(redirectTo);
  redirect(
    buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
      saved: "lead_detail",
    }),
  );
}

export async function saveAdminLeadMatch(formData: FormData) {
  const { supabase, user } = await requireStaffContext();

  const leadId = String(formData.get("lead_id") ?? "").trim();
  const matchId = String(formData.get("match_id") ?? "").trim();
  const memberId = String(formData.get("member_id") ?? "").trim();
  const status = String(formData.get("status") ?? "suggested").trim();
  const note = getOptionalValue(formData, "note");
  const redirectTo = getOptionalValue(formData, "redirect_to");

  if (!leadId || !memberId || !status) {
    redirect(
      buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
        error: "missing_required_fields",
      }),
    );
  }

  if (matchId) {
    const { error } = await supabase
      .from("cooperation_lead_matches")
      .update({
        member_id: memberId,
        status,
        note,
      })
      .eq("id", matchId);

    if (error) {
      redirect(
        buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
          error: "database_write_failed",
        }),
      );
    }
  } else {
    const { error } = await supabase.from("cooperation_lead_matches").insert({
      lead_id: leadId,
      member_id: memberId,
      status,
      note,
      created_by: user.id,
    });

    if (error) {
      redirect(
        buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
          error: "database_write_failed",
        }),
      );
    }
  }

  revalidateLeadPaths(leadId);
  revalidateRedirectPath(redirectTo);
  redirect(
    buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
      saved: "lead_match",
    }),
  );
}

export async function deleteAdminLeadMatch(formData: FormData) {
  const { supabase } = await requireStaffContext();

  const leadId = String(formData.get("lead_id") ?? "").trim();
  const matchId = String(formData.get("match_id") ?? "").trim();
  const redirectTo = getOptionalValue(formData, "redirect_to");

  if (!leadId || !matchId) {
    redirect(
      buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
        error: "missing_required_fields",
      }),
    );
  }

  const { error } = await supabase
    .from("cooperation_lead_matches")
    .delete()
    .eq("id", matchId);

  if (error) {
    redirect(
      buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
        error: "database_write_failed",
      }),
    );
  }

  revalidateLeadPaths(leadId);
  revalidateRedirectPath(redirectTo);
  redirect(
    buildRedirectPath(ADMIN_LEADS_PATH, redirectTo, {
      saved: "lead_match_deleted",
    }),
  );
}

function toWechatQrDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const date = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? new Date(`${value}:00+08:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export async function saveAdminWechatQrCode(formData: FormData) {
  const { supabase, user } = await requireStaffContext();

  const qrCodeId = String(formData.get("qr_code_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || "常州 AI 社区微信群";
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const startsAt = toWechatQrDateTime(getOptionalValue(formData, "starts_at"));
  const expiresAt = toWechatQrDateTime(getOptionalValue(formData, "expires_at"));
  const isActive = formData.get("is_active") === "on";

  if (!imageUrl || !startsAt || !expiresAt) {
    redirect(`${ADMIN_SOCIAL_PATH}?error=missing_required_fields`);
  }

  if (new Date(expiresAt).getTime() <= new Date(startsAt).getTime()) {
    redirect(`${ADMIN_SOCIAL_PATH}?error=invalid_qr_expiration`);
  }

  const payload = {
    title,
    image_url: imageUrl,
    note: getOptionalValue(formData, "note"),
    starts_at: startsAt,
    expires_at: expiresAt,
    is_active: isActive,
  };

  if (qrCodeId) {
    const { error } = await supabase
      .from("community_wechat_qr_codes")
      .update(payload)
      .eq("id", qrCodeId);

    if (error) {
      redirect(`${ADMIN_SOCIAL_PATH}?error=database_write_failed`);
    }
  } else {
    const { error } = await supabase.from("community_wechat_qr_codes").insert({
      ...payload,
      created_by: user.id,
    });

    if (error) {
      redirect(`${ADMIN_SOCIAL_PATH}?error=database_write_failed`);
    }
  }

  revalidateSocialPaths();
  redirect(`${ADMIN_SOCIAL_PATH}?saved=wechat_qr`);
}

export async function deleteAdminWechatQrCode(formData: FormData) {
  const { supabase } = await requireStaffContext();
  const qrCodeId = String(formData.get("qr_code_id") ?? "").trim();

  if (!qrCodeId) {
    redirect(`${ADMIN_SOCIAL_PATH}?error=missing_required_fields`);
  }

  const { error } = await supabase
    .from("community_wechat_qr_codes")
    .delete()
    .eq("id", qrCodeId);

  if (error) {
    redirect(`${ADMIN_SOCIAL_PATH}?error=database_write_failed`);
  }

  revalidateSocialPaths();
  redirect(`${ADMIN_SOCIAL_PATH}?saved=wechat_qr_deleted`);
}
