import type { SupabaseClient } from "@supabase/supabase-js";

import { sendAdminEventRegistrationNotification } from "@/lib/email";
import {
  EVENT_PORTRAIT_CONSENT_VERSION,
  EVENT_REGISTRATION_CONSENT_VERSION,
  eventPortraitConsentKey,
  eventRegistrationConsentKey,
} from "@/lib/event-registration-consent";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { canPreviewMiniappDraftEvents } from "@/lib/miniapp-admin";
import { isMiniappRegistrationReady } from "@/lib/miniapp-profile";

export const runtime = "nodejs";

async function loadEvent(
  supabase: SupabaseClient,
  slug: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, summary, event_at, venue, city, status, visibility, event_type, registration_url, registration_mode",
    )
    .eq("slug", slug)
    .neq("status", "draft")
    .maybeSingle();

  if (error) throw new Error("event_load_failed");
  if (!data) return null;
  if (
    data.visibility === "admin_only" &&
    !(await canPreviewMiniappDraftEvents(supabase, userId))
  ) {
    return null;
  }
  return data;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const { slug } = await context.params;
  const event = await loadEvent(auth.supabase, slug, auth.session.user_id);
  if (!event) return miniappJson({ error: "not_found" }, 404);

  const { data, error } = await auth.supabase
    .from("event_registrations")
    .select("id, status, note, created_at")
    .eq("event_id", event.id)
    .eq("user_id", auth.session.user_id)
    .maybeSingle();

  if (error) return miniappJson({ error: "registration_load_failed" }, 500);

  return miniappJson({ registration: data ?? null });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const payload = (await request.json().catch(() => null)) as
    | {
        note?: unknown;
        portraitConsentAccepted?: unknown;
        portraitConsentVersion?: unknown;
        registrationConsentAccepted?: unknown;
        registrationConsentVersion?: unknown;
      }
    | null;
  const note = typeof payload?.note === "string" ? payload.note.trim() : "";
  if (note.length > 500) {
    return miniappJson({ error: "invalid_registration_note" }, 400);
  }
  if (payload?.registrationConsentAccepted !== true) {
    return miniappJson({ error: "registration_consent_required" }, 400);
  }
  if (payload?.portraitConsentAccepted !== true) {
    return miniappJson({ error: "portrait_consent_required" }, 400);
  }
  if (
    payload.registrationConsentVersion !== EVENT_REGISTRATION_CONSENT_VERSION ||
    payload.portraitConsentVersion !== EVENT_PORTRAIT_CONSENT_VERSION
  ) {
    return miniappJson({ error: "registration_consent_version_mismatch" }, 409);
  }
  const { slug } = await context.params;
  const event = await loadEvent(auth.supabase, slug, auth.session.user_id);
  if (!event) return miniappJson({ error: "not_found" }, 404);
  if (event.status !== "scheduled") {
    return miniappJson({ error: "registration_closed" }, 409);
  }
  if (event.event_type === "external" || event.registration_url) {
    return miniappJson({ error: "external_registration_required" }, 409);
  }
  if (event.registration_mode === "review" && !note) {
    return miniappJson({ error: "registration_note_required" }, 400);
  }

  const userId = auth.session.user_id;
  const [{ data: existing }, { data: profile }] = await Promise.all([
    auth.supabase
      .from("event_registrations")
      .select("status")
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .maybeSingle(),
    auth.supabase
      .from("profiles")
      .select(
        "display_name, email, wechat, city, role_label, industry_tags, skills, capability_summary, seeking_summary",
      )
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (
    !profile ||
    !isMiniappRegistrationReady({
      displayName: profile.display_name,
      wechat: profile.wechat,
      city: profile.city,
      roleLabel: profile.role_label,
      industryTags: profile.industry_tags,
      skills: profile.skills,
      capabilitySummary: profile.capability_summary,
      seekingSummary: profile.seeking_summary,
    })
  ) {
    return miniappJson({ error: "profile_incomplete" }, 409);
  }

  const acceptedAt = new Date().toISOString();
  const registrationConsent = {
    user_id: userId,
    policy_version: eventRegistrationConsentKey(event.id),
    accepted_at: acceptedAt,
  };
  const portraitConsentKey = eventPortraitConsentKey(event.id);
  const { error: registrationConsentError } = await auth.supabase
    .from("miniapp_consents")
    .upsert(
      [
        registrationConsent,
        {
          user_id: userId,
          policy_version: portraitConsentKey,
          accepted_at: acceptedAt,
        },
      ],
      { onConflict: "user_id,policy_version" },
    );
  if (registrationConsentError) {
    return miniappJson({ error: "registration_consent_save_failed" }, 500);
  }
  const { data: registrationData, error } = await auth.supabase
    .rpc("submit_event_registration", {
      p_event_id: event.id,
      p_user_id: userId,
      p_note: note || null,
      p_allow_admin_only: event.visibility === "admin_only",
    })
    .single();

  if (error || !registrationData) {
    const errorMessage = error?.message ?? "";
    const errorCode = errorMessage.includes("registration_closed")
      ? "registration_closed"
      : errorMessage.includes("external_registration_required")
        ? "external_registration_required"
        : errorMessage.includes("invalid_registration_note")
          ? "invalid_registration_note"
          : "registration_save_failed";
    return miniappJson(
      { error: errorCode },
      errorCode === "registration_save_failed" ? 500 : 409,
    );
  }

  const registration = registrationData as {
    id: string;
    status: string;
    note: string | null;
    created_at: string;
  };

  if (existing?.status !== registration.status) {
    try {
      await sendAdminEventRegistrationNotification({
        eventTitle: event.title,
        eventSlug: event.slug,
        eventAt: event.event_at,
        venue: event.venue,
        city: event.city,
        registrantDisplayName: profile.display_name,
        registrantEmail: profile.email,
        registrantWechat: profile.wechat,
        registrantCity: profile.city ?? "常州",
        note: note || null,
      });
    } catch (notificationError) {
      console.error("Failed to send mini-program registration notification.", {
        userId,
        eventId: event.id,
        notificationError,
      });
    }
  }

  return miniappJson({ registration });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const { slug } = await context.params;
  const event = await loadEvent(auth.supabase, slug, auth.session.user_id);
  if (!event) return miniappJson({ error: "not_found" }, 404);
  if (event.status !== "scheduled") {
    return miniappJson({ error: "registration_closed" }, 409);
  }

  const userId = auth.session.user_id;
  const { data: attendance, error: attendanceError } = await auth.supabase
    .from("event_attendance")
    .select("id")
    .eq("event_id", event.id)
    .eq("user_id", userId)
    .not("checked_in_at", "is", null)
    .maybeSingle();

  if (attendanceError) {
    return miniappJson({ error: "registration_cancel_failed" }, 500);
  }
  if (attendance) {
    return miniappJson({ error: "registration_locked_after_checkin" }, 409);
  }

  const [
    { data, error },
    { error: subscriptionError },
    { error: portraitConsentError },
  ] = await Promise.all([
    auth.supabase
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .neq("status", "cancelled")
      .select("id, status, note, created_at")
      .maybeSingle(),
    auth.supabase
      .from("miniapp_event_subscriptions")
      .update({ status: "cancelled", last_error: null })
      .eq("event_id", event.id)
      .eq("user_id", userId)
      .in("status", ["accepted", "rejected", "failed"]),
    auth.supabase
      .from("miniapp_consents")
      .delete()
      .eq("user_id", userId)
      .eq("policy_version", eventPortraitConsentKey(event.id)),
  ]);

  if (error || subscriptionError || portraitConsentError) {
    return miniappJson({ error: "registration_cancel_failed" }, 500);
  }

  return miniappJson({ registration: data ?? null });
}
