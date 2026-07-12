import type { SupabaseClient } from "@supabase/supabase-js";

import { sendAdminEventRegistrationNotification } from "@/lib/email";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

async function loadEvent(
  supabase: SupabaseClient,
  slug: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, slug, title, summary, event_at, venue, city, status, event_type, registration_url",
    )
    .eq("slug", slug)
    .neq("status", "draft")
    .maybeSingle();

  if (error) throw new Error("event_load_failed");
  return data;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const { slug } = await context.params;
  const event = await loadEvent(auth.supabase, slug);
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
    | { note?: unknown }
    | null;
  const note = typeof payload?.note === "string" ? payload.note.trim() : "";
  if (note.length > 500) {
    return miniappJson({ error: "invalid_registration_note" }, 400);
  }

  const { slug } = await context.params;
  const event = await loadEvent(auth.supabase, slug);
  if (!event) return miniappJson({ error: "not_found" }, 404);
  if (event.status !== "scheduled") {
    return miniappJson({ error: "registration_closed" }, 409);
  }
  if (event.event_type === "external" || event.registration_url) {
    return miniappJson({ error: "external_registration_required" }, 409);
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
      .select("display_name, email, wechat, city")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (!profile?.display_name?.trim() || !profile.wechat?.trim()) {
    return miniappJson({ error: "profile_incomplete" }, 409);
  }

  const { data: registration, error } = await auth.supabase
    .from("event_registrations")
    .upsert(
      {
        event_id: event.id,
        user_id: userId,
        note: note || null,
        status: "registered",
      },
      { onConflict: "event_id,user_id" },
    )
    .select("id, status, note, created_at")
    .single();

  if (error) {
    return miniappJson({ error: "registration_save_failed" }, 500);
  }

  if (existing?.status !== "registered") {
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
  const event = await loadEvent(auth.supabase, slug);
  if (!event) return miniappJson({ error: "not_found" }, 404);

  const userId = auth.session.user_id;
  const [{ data, error }, { error: subscriptionError }] = await Promise.all([
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
  ]);

  if (error || subscriptionError) {
    return miniappJson({ error: "registration_cancel_failed" }, 500);
  }

  return miniappJson({ registration: data ?? null });
}
