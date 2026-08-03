import { NextResponse } from "next/server";

import {
  getAdminOnlyEventSummaries,
  getDraftEventSummaries,
  getPublishedEventSummaries,
} from "@/lib/community-events";
import {
  getEventParticipantSummaries,
  type EventParticipantSummary,
} from "@/lib/event-participants";
import { canPreviewMiniappDraftEvents } from "@/lib/miniapp-admin";
import { loadOptionalMiniappSession } from "@/lib/miniapp-api";

const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 20;

function parseInteger(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const includeLegacyCatalog =
    !searchParams.has("mode") &&
    !searchParams.has("filter") &&
    !searchParams.has("offset") &&
    !searchParams.has("limit");
  const publicEvents = await getPublishedEventSummaries();
  const auth = await loadOptionalMiniappSession(request);
  const canPreviewDrafts = auth
    ? await canPreviewMiniappDraftEvents(auth.supabase, auth.session.user_id)
    : false;
  const drafts = canPreviewDrafts
    ? await getDraftEventSummaries(auth!.supabase)
    : [];
  const adminOnlyEvents = canPreviewDrafts
    ? await getAdminOnlyEventSummaries(auth!.supabase)
    : [];
  const events = [...publicEvents, ...adminOnlyEvents];
  const upcoming = events
    .filter((event) => event.status === "scheduled")
    .sort((left, right) => {
      if (!left.event_at) return 1;
      if (!right.event_at) return -1;
      return left.event_at.localeCompare(right.event_at);
    });
  const history = events.filter((event) => event.status === "completed");
  const requestedMode = searchParams.get("mode");
  const mode = requestedMode === "draft" && canPreviewDrafts
    ? "draft"
    : requestedMode === "history" || requestedMode === "upcoming"
    ? requestedMode
    : upcoming.length > 0 ? "upcoming" : "history";
  const requestedFilter = searchParams.get("filter");
  const filter = requestedFilter === "community" || requestedFilter === "external"
    ? requestedFilter
    : "all";
  const sourceEvents = mode === "draft"
    ? drafts
    : mode === "upcoming" ? upcoming : history;
  const filteredEvents = filter === "all"
    ? sourceEvents
    : sourceEvents.filter((event) => event.event_type === filter);
  const offset = parseInteger(searchParams.get("offset"), 0);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE)),
  );
  const pagedEvents = filteredEvents.slice(offset, offset + limit);
  const responseEvents = includeLegacyCatalog
    ? Array.from(
        new Map(
          [...upcoming, ...history, ...pagedEvents].map((event) => [
            event.id,
            event,
          ]),
        ).values(),
      )
    : pagedEvents;
  let participantSummaries = new Map<string, EventParticipantSummary>();
  try {
    participantSummaries = await getEventParticipantSummaries(
      responseEvents.map((event) => event.id),
      4,
    );
  } catch (error) {
    console.error(
      "Failed to load mini-program event participant previews.",
      error,
    );
  }
  const withParticipants = <T extends { id: string }>(event: T) => {
    const summary = participantSummaries.get(event.id);
    return {
      ...event,
      registration_count: summary?.registrationCount ?? 0,
      confirmed_count: summary?.confirmedCount ?? 0,
      participant_preview: summary?.participants ?? [],
    };
  };

  return NextResponse.json(
    {
      ...(includeLegacyCatalog
        ? {
            upcoming: upcoming.map(withParticipants),
            history: history.map(withParticipants),
          }
        : {}),
      events: pagedEvents.map(withParticipants),
      mode,
      filter,
      canPreviewDrafts,
      counts: {
        upcoming: upcoming.length,
        history: history.length,
        draft: drafts.length,
      },
      categoryCounts: {
        all: sourceEvents.length,
        community: sourceEvents.filter((event) => event.event_type === "community").length,
        external: sourceEvents.filter((event) => event.event_type === "external").length,
      },
      pagination: {
        offset,
        limit,
        total: filteredEvents.length,
        hasMore: offset + pagedEvents.length < filteredEvents.length,
      },
    },
    {
      headers: {
        "Cache-Control": canPreviewDrafts
          ? "private, no-store"
          : "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
