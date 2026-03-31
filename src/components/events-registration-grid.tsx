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

    async function syncRegistrationState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setRegisteredEventIds(new Set());
        setAuthState("logged_out");
        return;
      }

      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user.id)
        .eq("status", "registered");

      setRegisteredEventIds(new Set((registrations ?? []).map((item) => item.event_id)));
      setAuthState("logged_in");
    }

    void syncRegistrationState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncRegistrationState();
    });

    return () => {
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
