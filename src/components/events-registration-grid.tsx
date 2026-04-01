"use client";

import { useEffect, useState } from "react";

import { EventRegistrationForm } from "@/components/event-registration-form";
import type { PublicScheduledEvent } from "@/lib/community-events";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type AuthState = "loading" | "logged_out" | "logged_in";

export function EventsRegistrationGrid({
  events,
}: {
  events: PublicScheduledEvent[];
}) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());

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
          setRegisteredEventIds(new Set());
          setAuthState("logged_out");
        }
        return;
      }

      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", resolvedUserId)
        .eq("status", "registered");

      if (!cancelled) {
        setRegisteredEventIds(
          new Set((registrations ?? []).map((item) => item.event_id)),
        );
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
  }, []);

  return (
    <div className="card-grid">
      {events.map((event) => (
        <EventRegistrationForm
          key={event.id}
          event={event}
          authState={authState}
          isRegistered={registeredEventIds.has(event.id)}
          redirectTo={`/events/${event.slug}`}
        />
      ))}
    </div>
  );
}
