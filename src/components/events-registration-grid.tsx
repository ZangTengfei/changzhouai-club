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
  const [registrationStatuses, setRegistrationStatuses] = useState<
    Map<string, string>
  >(new Map());

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
          setRegistrationStatuses(new Map());
          setAuthState("logged_out");
        }
        return;
      }

      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("event_id, status")
        .eq("user_id", resolvedUserId)
        .in("status", ["pending", "registered", "waitlisted"]);

      if (!cancelled) {
        setRegistrationStatuses(
          new Map(
            (registrations ?? []).map((item) => [item.event_id, item.status]),
          ),
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
          registrationStatus={registrationStatuses.get(event.id) ?? null}
          redirectTo={`/events/${event.slug}`}
          highlightEventType
          showEventSlug={false}
        />
      ))}
    </div>
  );
}
