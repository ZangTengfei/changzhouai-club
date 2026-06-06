"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeAdminEventDateTime } from "@/lib/admin/event-datetime";
import { normalizeEventType } from "@/lib/event-type";
import { canAdmin, requireAdminPermission } from "@/lib/supabase/guards";

const ADMIN_EVENTS_PATH = "/admin/events";
const ADMIN_LEADS_PATH = "/admin/leads";
const ADMIN_MEMBERS_PATH = "/admin/members";
const ADMIN_PROJECTS_PATH = "/admin/projects";
const ADMIN_SOCIAL_PATH = "/admin/social";
const ADMIN_UPDATES_PATH = "/admin/updates";
const ADMIN_WORKS_PATH = "/admin/works";
const COMMUNITY_UPDATE_TYPES = new Set([
  "activity",
  "project",
  "share",
  "help",
  "collab",
  "official",
]);
const COMMUNITY_UPDATE_STATUSES = new Set([
  "pending",
  "published",
  "changes_requested",
  "rejected",
  "archived",
]);
const COMMUNITY_UPDATE_RELATED_TYPES = new Set([
  "event",
  "work",
  "project",
  "doc",
  "external",
]);
const PROJECT_TYPES = new Set([
  "crowdsource",
  "project",
  "project_manager",
  "enterprise",
  "role",
  "idea",
]);
const PROJECT_STATUSES = new Set([
  "draft",
  "recruiting",
  "matching",
  "in_progress",
  "filled",
  "closed",
  "archived",
]);
const PROJECT_VISIBILITIES = new Set(["public", "members", "private"]);
const PROJECT_APPLICATION_STATUSES = new Set([
  "new",
  "reviewing",
  "contacted",
  "shortlisted",
  "introduced",
  "active",
  "not_fit",
  "withdrawn",
]);
const WORK_TYPES = new Set([
  "product",
  "project",
  "tool",
  "open_source",
  "case",
  "demo",
  "service",
]);
const WORK_STATUSES = new Set(["idea", "building", "launched", "paused", "archived"]);
const WORK_REVIEW_STATUSES = new Set([
  "pending",
  "approved",
  "changes_requested",
  "rejected",
]);
const EXTERNAL_CASE_CARD_TYPES = new Set([
  "external",
  "project",
  "case",
  "tool",
  "service",
]);

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

function normalizeImageUrls(raw: string) {
  return raw
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeOptionalUrlValue(raw: string | null) {
  const value = raw?.trim() ?? "";

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function getCommunityUpdateType(value: string) {
  const normalized = value.trim();
  return COMMUNITY_UPDATE_TYPES.has(normalized) ? normalized : "share";
}

function getCommunityUpdateStatus(value: string) {
  const normalized = value.trim();
  return COMMUNITY_UPDATE_STATUSES.has(normalized) ? normalized : "pending";
}

function getCommunityUpdateRelatedType(value: string) {
  const normalized = value.trim();
  return COMMUNITY_UPDATE_RELATED_TYPES.has(normalized) ? normalized : null;
}

function getWorkType(value: string) {
  const normalized = value.trim();
  return WORK_TYPES.has(normalized) ? normalized : "product";
}

function getWorkStatus(value: string) {
  const normalized = value.trim();
  return WORK_STATUSES.has(normalized) ? normalized : "launched";
}

function getWorkReviewStatus(value: string) {
  const normalized = value.trim();
  return WORK_REVIEW_STATUSES.has(normalized) ? normalized : "pending";
}

function getExternalCaseCardType(value: string) {
  const normalized = value.trim();
  return EXTERNAL_CASE_CARD_TYPES.has(normalized) ? normalized : "external";
}

function getProjectType(value: string) {
  const normalized = value.trim();
  return PROJECT_TYPES.has(normalized) ? normalized : "project";
}

function getProjectStatus(value: string) {
  const normalized = value.trim();
  return PROJECT_STATUSES.has(normalized) ? normalized : "draft";
}

function getProjectVisibility(value: string) {
  const normalized = value.trim();
  return PROJECT_VISIBILITIES.has(normalized) ? normalized : "public";
}

function getProjectApplicationStatus(value: string) {
  const normalized = value.trim();
  return PROJECT_APPLICATION_STATUSES.has(normalized) ? normalized : "new";
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

function revalidateProjectPaths(...slugs: Array<string | null | undefined>) {
  revalidatePath(ADMIN_PROJECTS_PATH);
  revalidatePath("/");
  revalidatePath("/projects");

  slugs.filter(Boolean).forEach((slug) => {
    revalidatePath(`/projects/${slug}`);
  });
}

function revalidateSocialPaths() {
  revalidatePath(ADMIN_SOCIAL_PATH);
  revalidatePath("/");
}

function revalidateCommunityUpdatePaths(updateId?: string) {
  revalidatePath(ADMIN_UPDATES_PATH);
  revalidatePath("/");
  revalidatePath("/updates");

  if (updateId) {
    revalidatePath(`/updates/${updateId}`);
  }
}

function revalidateWorkPaths(memberId?: string) {
  revalidatePath(ADMIN_WORKS_PATH);
  revalidatePath("/");
  revalidatePath("/works");
  revalidatePath("/members");

  if (memberId) {
    revalidatePath(`/members/${memberId}`);
  }
}

export async function saveAdminEvent(formData: FormData) {
  const adminContext = await requireAdminPermission("events.write");
  const { supabase, user } = adminContext;

  const eventId = String(formData.get("event_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = normalizeSlug(slugInput || title);
  const status = String(formData.get("status") ?? "draft").trim();

  if (!title || !slug) {
    redirect(`${ADMIN_EVENTS_PATH}?error=missing_required_fields`);
  }

  if (status !== "draft" && !canAdmin(adminContext, "events.publish")) {
    redirect(`${ADMIN_EVENTS_PATH}?error=permission_required`);
  }

  const payload = {
    title,
    slug,
    summary: getOptionalValue(formData, "summary"),
    description: getOptionalValue(formData, "description"),
    agenda: getOptionalValue(formData, "agenda"),
    speaker_lineup: getOptionalValue(formData, "speaker_lineup"),
    registration_note: getOptionalValue(formData, "registration_note"),
    registration_url: normalizeOptionalUrlValue(getOptionalValue(formData, "registration_url")),
    event_type: normalizeEventType(getOptionalValue(formData, "event_type")),
    recap: getOptionalValue(formData, "recap"),
    docs_url: getOptionalValue(formData, "docs_url"),
    event_at: normalizeAdminEventDateTime(getOptionalValue(formData, "event_at")),
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
  const { supabase } = await requireAdminPermission("events.delete");

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
  const { supabase } = await requireAdminPermission("events.manage_photos");

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
  const { supabase } = await requireAdminPermission("events.manage_photos");

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
  const { supabase } = await requireAdminPermission("events.manage_photos");

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
  const { supabase } = await requireAdminPermission("members.manage_status");

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
  const adminContext = await requireAdminPermission("members.write_profile");
  const { supabase } = adminContext;

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

  const profileUpdate: Record<string, string | string[] | null> = {
    display_name: displayName,
    city,
    role_label: roleLabel,
    organization,
    monthly_time: monthlyTime,
    bio,
    skills,
    interests,
  };

  if (canAdmin(adminContext, "members.read_contact")) {
    profileUpdate.wechat = wechat;
  }

  const [{ error: profileError }, { error: memberError }] = await Promise.all([
    supabase.from("profiles").update(profileUpdate).eq("id", memberId),
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
  const { supabase } = await requireAdminPermission("members.write_profile");

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
  const { supabase } = await requireAdminPermission("members.write_profile");

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
  const { supabase, user } = await requireAdminPermission("leads.write");

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
  const adminContext = await requireAdminPermission("leads.write");
  const { supabase } = adminContext;

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

  if (!canAdmin(adminContext, "leads.read_sensitive")) {
    redirect(
      buildRedirectPath("/admin/leads", redirectTo, {
        error: "permission_required",
        permission: "leads.read_sensitive",
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
  const { supabase, user } = await requireAdminPermission("leads.match_members");

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
  const { supabase } = await requireAdminPermission("leads.match_members");

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

export async function saveAdminProjectOpportunity(formData: FormData) {
  const { supabase, user } = await requireAdminPermission("projects.write");

  const opportunityId = String(formData.get("opportunity_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = normalizeSlug(slugInput || title);
  const summary = String(formData.get("summary") ?? "").trim();
  let previousSlug: string | null = null;

  if (!title || !summary || !slug) {
    redirect(`${ADMIN_PROJECTS_PATH}?error=missing_project_fields`);
  }

  if (opportunityId) {
    const { data: existingOpportunity } = await supabase
      .from("project_opportunities")
      .select("slug")
      .eq("id", opportunityId)
      .maybeSingle();

    previousSlug = existingOpportunity?.slug ?? null;
  }

  const payload = {
    slug,
    title,
    summary,
    description: getOptionalValue(formData, "description"),
    opportunity_type: getProjectType(String(formData.get("opportunity_type") ?? "")),
    status: getProjectStatus(String(formData.get("status") ?? "")),
    visibility: getProjectVisibility(String(formData.get("visibility") ?? "")),
    role_tags: normalizeSkills(String(formData.get("role_tags") ?? "")),
    topic_tags: normalizeSkills(String(formData.get("topic_tags") ?? "")),
    headcount_label: getOptionalValue(formData, "headcount_label"),
    time_commitment: getOptionalValue(formData, "time_commitment"),
    compensation: getOptionalValue(formData, "compensation"),
    deadline_at: normalizeAdminEventDateTime(getOptionalValue(formData, "deadline_at")),
    location: getOptionalValue(formData, "location"),
    application_cta: getOptionalValue(formData, "application_cta"),
    application_note: getOptionalValue(formData, "application_note"),
    application_requires_login: formData.get("application_requires_login") === "on",
    sort_order: getOptionalInteger(formData, "sort_order"),
    is_featured: formData.get("is_featured") === "on",
  };

  if (opportunityId) {
    const { error } = await supabase
      .from("project_opportunities")
      .update(payload)
      .eq("id", opportunityId);

    if (error) {
      redirect(`${ADMIN_PROJECTS_PATH}?error=database_write_failed`);
    }
  } else {
    const { error } = await supabase.from("project_opportunities").insert({
      ...payload,
      created_by: user.id,
      owner_id: user.id,
    });

    if (error) {
      redirect(`${ADMIN_PROJECTS_PATH}?error=database_write_failed`);
    }
  }

  revalidateProjectPaths(slug, previousSlug);
  redirect(`${ADMIN_PROJECTS_PATH}?saved=project`);
}

export async function deleteAdminProjectOpportunity(formData: FormData) {
  const { supabase } = await requireAdminPermission("projects.delete");
  const opportunityId = String(formData.get("opportunity_id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();

  if (!opportunityId) {
    redirect(`${ADMIN_PROJECTS_PATH}?error=missing_required_fields`);
  }

  const { error } = await supabase
    .from("project_opportunities")
    .delete()
    .eq("id", opportunityId);

  if (error) {
    redirect(`${ADMIN_PROJECTS_PATH}?error=database_write_failed`);
  }

  revalidateProjectPaths(slug);
  redirect(`${ADMIN_PROJECTS_PATH}?saved=project_deleted`);
}

export async function updateAdminProjectApplication(formData: FormData) {
  const { supabase } = await requireAdminPermission("projects.review_applications");

  const applicationId = String(formData.get("application_id") ?? "").trim();
  const projectId = String(formData.get("project_id") ?? "").trim();
  const projectSlug = String(formData.get("project_slug") ?? "").trim();
  const status = getProjectApplicationStatus(String(formData.get("status") ?? ""));

  if (!applicationId || !projectId || !status) {
    redirect(`${ADMIN_PROJECTS_PATH}?error=missing_required_fields`);
  }

  const { error } = await supabase
    .from("project_applications")
    .update({
      status,
      admin_note: getOptionalValue(formData, "admin_note"),
    })
    .eq("id", applicationId);

  if (error) {
    redirect(`${ADMIN_PROJECTS_PATH}?error=database_write_failed`);
  }

  revalidateProjectPaths(projectSlug);
  redirect(`${ADMIN_PROJECTS_PATH}?saved=project_application`);
}

export async function deleteAdminProjectApplication(formData: FormData) {
  const { supabase } = await requireAdminPermission("projects.delete");

  const applicationId = String(formData.get("application_id") ?? "").trim();
  const projectSlug = String(formData.get("project_slug") ?? "").trim();

  if (!applicationId) {
    redirect(`${ADMIN_PROJECTS_PATH}?error=missing_required_fields`);
  }

  const { error } = await supabase
    .from("project_applications")
    .delete()
    .eq("id", applicationId);

  if (error) {
    redirect(`${ADMIN_PROJECTS_PATH}?error=database_write_failed`);
  }

  revalidateProjectPaths(projectSlug);
  redirect(`${ADMIN_PROJECTS_PATH}?saved=project_application_deleted`);
}

export async function saveAdminCommunityUpdate(formData: FormData) {
  const adminContext = await requireAdminPermission("updates.review");
  const { supabase, user } = adminContext;

  const updateId = String(formData.get("update_id") ?? "").trim();
  const authorId = String(formData.get("author_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const title = getOptionalValue(formData, "title");
  const status = getCommunityUpdateStatus(String(formData.get("status") ?? ""));
  const relatedType = getCommunityUpdateRelatedType(
    String(formData.get("related_type") ?? ""),
  );
  const rawRelatedUrl = String(formData.get("related_url") ?? "");
  const relatedUrl = normalizeOptionalUrlValue(rawRelatedUrl);
  const imageUrls = normalizeImageUrls(String(formData.get("image_urls") ?? ""));
  const hasInvalidUrl =
    (rawRelatedUrl.trim() && !relatedUrl) ||
    imageUrls.some((url) => !normalizeOptionalUrlValue(url));

  if (!authorId || !content) {
    redirect(`${ADMIN_UPDATES_PATH}?error=missing_update_fields`);
  }

  if (hasInvalidUrl) {
    redirect(`${ADMIN_UPDATES_PATH}?error=invalid_update_url`);
  }

  if (status === "published" && !canAdmin(adminContext, "updates.publish")) {
    redirect(`${ADMIN_UPDATES_PATH}?error=permission_required`);
  }

  if (
    (formData.get("is_featured") === "on" || formData.get("is_pinned") === "on") &&
    !canAdmin(adminContext, "updates.pin")
  ) {
    redirect(`${ADMIN_UPDATES_PATH}?error=permission_required`);
  }

  const { data: existingUpdate } = updateId
    ? await supabase
        .from("community_updates")
        .select("published_at")
        .eq("id", updateId)
        .maybeSingle()
    : { data: null };
  const publishedAt =
    status === "published"
      ? existingUpdate?.published_at ?? new Date().toISOString()
      : null;
  const shouldPubliclyFeature = status === "published";
  const payload = {
    author_id: authorId,
    update_type: getCommunityUpdateType(String(formData.get("update_type") ?? "")),
    title,
    content,
    tags: normalizeSkills(String(formData.get("tags") ?? "")),
    related_type: relatedType,
    related_url: relatedUrl,
    status,
    moderation_note: getOptionalValue(formData, "moderation_note"),
    sort_order: getOptionalInteger(formData, "sort_order"),
    is_featured: shouldPubliclyFeature && formData.get("is_featured") === "on",
    is_pinned: shouldPubliclyFeature && formData.get("is_pinned") === "on",
    published_at: publishedAt,
    reviewed_by: user.id,
  };

  let savedUpdateId = updateId;

  if (updateId) {
    const { error } = await supabase
      .from("community_updates")
      .update(payload)
      .eq("id", updateId);

    if (error) {
      redirect(`${ADMIN_UPDATES_PATH}?error=database_write_failed`);
    }
  } else {
    const { data: createdUpdate, error } = await supabase
      .from("community_updates")
      .insert({
        ...payload,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !createdUpdate?.id) {
      redirect(`${ADMIN_UPDATES_PATH}?error=database_write_failed`);
    }

    savedUpdateId = createdUpdate.id;
  }

  const { error: deleteImagesError } = await supabase
    .from("community_update_images")
    .delete()
    .eq("update_id", savedUpdateId);

  if (deleteImagesError) {
    redirect(`${ADMIN_UPDATES_PATH}?error=database_write_failed`);
  }

  if (imageUrls.length > 0) {
    const { error: imageInsertError } = await supabase
      .from("community_update_images")
      .insert(
        imageUrls.map((imageUrl, index) => ({
          update_id: savedUpdateId,
          image_url: normalizeOptionalUrlValue(imageUrl),
          sort_order: index,
        })),
      );

    if (imageInsertError) {
      redirect(`${ADMIN_UPDATES_PATH}?error=database_write_failed`);
    }
  }

  revalidateCommunityUpdatePaths(savedUpdateId);
  redirect(`${ADMIN_UPDATES_PATH}?saved=community_update`);
}

export async function deleteAdminCommunityUpdate(formData: FormData) {
  const { supabase } = await requireAdminPermission("updates.delete");
  const updateId = String(formData.get("update_id") ?? "").trim();

  if (!updateId) {
    redirect(`${ADMIN_UPDATES_PATH}?error=missing_required_fields`);
  }

  const { error } = await supabase
    .from("community_updates")
    .delete()
    .eq("id", updateId);

  if (error) {
    redirect(`${ADMIN_UPDATES_PATH}?error=database_write_failed`);
  }

  revalidateCommunityUpdatePaths(updateId);
  redirect(`${ADMIN_UPDATES_PATH}?saved=community_update_deleted`);
}

export async function saveAdminMemberWork(formData: FormData) {
  const adminContext = await requireAdminPermission("works.write");
  const { supabase, user } = adminContext;

  const workId = String(formData.get("work_id") ?? "").trim();
  const memberId = String(formData.get("member_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();

  if (!memberId || !title || !summary) {
    redirect(`${ADMIN_WORKS_PATH}?error=missing_work_fields`);
  }

  const requestedReviewStatus = getWorkReviewStatus(String(formData.get("review_status") ?? ""));
  const requestedIsPublic = formData.get("is_public") === "on";

  if (requestedReviewStatus !== "pending" && !canAdmin(adminContext, "works.review")) {
    redirect(`${ADMIN_WORKS_PATH}?error=permission_required&permission=works.review`);
  }

  if (requestedIsPublic && !canAdmin(adminContext, "works.publish")) {
    redirect(`${ADMIN_WORKS_PATH}?error=permission_required&permission=works.publish`);
  }

  const payload = {
    member_id: memberId,
    title,
    summary,
    description: getOptionalValue(formData, "description"),
    work_type: getWorkType(String(formData.get("work_type") ?? "")),
    status: getWorkStatus(String(formData.get("status") ?? "")),
    review_status: requestedReviewStatus,
    role_label: getOptionalValue(formData, "role_label"),
    cover_image_url: getOptionalValue(formData, "cover_image_url"),
    website_url: getOptionalValue(formData, "website_url"),
    repo_url: getOptionalValue(formData, "repo_url"),
    demo_url: getOptionalValue(formData, "demo_url"),
    tags: normalizeSkills(String(formData.get("tags") ?? "")),
    sort_order: getOptionalInteger(formData, "sort_order"),
    is_public: requestedIsPublic,
    is_featured: formData.get("is_featured") === "on",
  };
  const nextReviewStatus = payload.is_public ? "approved" : payload.review_status;
  const nextIsPublic = ["changes_requested", "rejected"].includes(nextReviewStatus)
    ? false
    : payload.is_public;
  const reviewedPayload = {
    ...payload,
    review_status: nextReviewStatus,
    is_public: nextIsPublic,
    is_featured: nextIsPublic ? payload.is_featured : false,
  };

  if (workId) {
    const { error } = await supabase
      .from("member_works")
      .update(reviewedPayload)
      .eq("id", workId);

    if (error) {
      redirect(`${ADMIN_WORKS_PATH}?error=database_write_failed`);
    }
  } else {
    const { error } = await supabase.from("member_works").insert({
      ...reviewedPayload,
      created_by: user.id,
    });

    if (error) {
      redirect(`${ADMIN_WORKS_PATH}?error=database_write_failed`);
    }
  }

  revalidateWorkPaths(memberId);
  redirect(`${ADMIN_WORKS_PATH}?saved=work`);
}

export async function deleteAdminMemberWork(formData: FormData) {
  const { supabase } = await requireAdminPermission("works.delete");
  const workId = String(formData.get("work_id") ?? "").trim();
  const memberId = String(formData.get("member_id") ?? "").trim();

  if (!workId) {
    redirect(`${ADMIN_WORKS_PATH}?error=missing_required_fields`);
  }

  const { error } = await supabase.from("member_works").delete().eq("id", workId);

  if (error) {
    redirect(`${ADMIN_WORKS_PATH}?error=database_write_failed`);
  }

  revalidateWorkPaths(memberId);
  redirect(`${ADMIN_WORKS_PATH}?saved=work_deleted`);
}

export async function saveAdminExternalCaseCard(formData: FormData) {
  const adminContext = await requireAdminPermission("works.write");
  const { supabase, user } = adminContext;

  const cardId = String(formData.get("external_card_id") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const externalUrl = normalizeOptionalUrlValue(getOptionalValue(formData, "external_url"));
  const requestedIsPublic = formData.get("is_public") === "on";

  if (!title || !summary || !externalUrl) {
    redirect(`${ADMIN_WORKS_PATH}?error=missing_external_card_fields`);
  }

  if (requestedIsPublic && !canAdmin(adminContext, "works.publish")) {
    redirect(`${ADMIN_WORKS_PATH}?error=permission_required&permission=works.publish`);
  }

  const slug =
    normalizeSlug(slugInput) ||
    normalizeSlug(title) ||
    `external-${Date.now().toString(36)}`;
  const payload = {
    slug,
    title,
    summary,
    description: getOptionalValue(formData, "description"),
    card_type: getExternalCaseCardType(String(formData.get("card_type") ?? "")),
    source_label: getOptionalValue(formData, "source_label"),
    cover_image_url: getOptionalValue(formData, "cover_image_url"),
    external_url: externalUrl,
    cta_label: getOptionalValue(formData, "cta_label") ?? "查看详情",
    tags: normalizeSkills(String(formData.get("tags") ?? "")),
    sort_order: getOptionalInteger(formData, "sort_order"),
    is_public: requestedIsPublic,
    is_featured: requestedIsPublic ? formData.get("is_featured") === "on" : false,
  };

  if (cardId) {
    const { error } = await supabase
      .from("external_case_cards")
      .update(payload)
      .eq("id", cardId);

    if (error) {
      redirect(`${ADMIN_WORKS_PATH}?error=database_write_failed`);
    }
  } else {
    const { error } = await supabase.from("external_case_cards").insert({
      ...payload,
      created_by: user.id,
    });

    if (error) {
      redirect(`${ADMIN_WORKS_PATH}?error=database_write_failed`);
    }
  }

  revalidateWorkPaths();
  redirect(`${ADMIN_WORKS_PATH}?saved=external_case_card`);
}

export async function deleteAdminExternalCaseCard(formData: FormData) {
  const { supabase } = await requireAdminPermission("works.delete");
  const cardId = String(formData.get("external_card_id") ?? "").trim();

  if (!cardId) {
    redirect(`${ADMIN_WORKS_PATH}?error=missing_required_fields`);
  }

  const { error } = await supabase
    .from("external_case_cards")
    .delete()
    .eq("id", cardId);

  if (error) {
    redirect(`${ADMIN_WORKS_PATH}?error=database_write_failed`);
  }

  revalidateWorkPaths();
  redirect(`${ADMIN_WORKS_PATH}?saved=external_case_card_deleted`);
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
  const { supabase, user } = await requireAdminPermission("social.write");

  const qrCodeId = String(formData.get("qr_code_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || "常州 AI Club 官方微信";
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
  const { supabase } = await requireAdminPermission("social.write");
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
