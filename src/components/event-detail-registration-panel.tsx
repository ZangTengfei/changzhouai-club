"use client";

import { useEffect, useState } from "react";

import { EventRegistrationForm } from "@/components/event-registration-form";
import type { PublicEventDetail } from "@/lib/community-events";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type AuthState = "loading" | "logged_out" | "logged_in";

export function EventDetailRegistrationPanel({
  event,
  redirectTo,
}: {
  event: PublicEventDetail;
  redirectTo: string;
}) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setAuthState("logged_out");
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function syncRegistrationState(userId?: string | null) {
      const resolvedUserId =
        userId ??
        (await supabase.auth.getSession()).data.session?.user.id ??
        null;

      if (!resolvedUserId) {
        if (!cancelled) {
          setIsRegistered(false);
          setAuthState("logged_out");
        }
        return;
      }

      const { data: registration } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", resolvedUserId)
        .eq("status", "registered")
        .maybeSingle();

      if (!cancelled) {
        setIsRegistered(Boolean(registration));
        setAuthState("logged_in");
      }
    }

    void syncRegistrationState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncRegistrationState(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [event.id]);

  return (
    <EventRegistrationForm
      event={{
        id: event.id,
        title: event.title,
        summary: event.summary,
        event_at: event.eventAt,
        venue: event.venue,
        city: event.city,
        slug: event.slug,
        registration_note: event.registrationNote,
      }}
      authState={authState}
      isRegistered={isRegistered}
      redirectTo={redirectTo}
      showDetailLink={false}
    />
  );
}
