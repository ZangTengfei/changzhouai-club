import { NextResponse } from "next/server";

import { getPublishedEventSummaries } from "@/lib/community-events";

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
  const events = await getPublishedEventSummaries();
  const upcoming = events
    .filter((event) => event.status === "scheduled")
    .sort((left, right) => {
      if (!left.event_at) return 1;
      if (!right.event_at) return -1;
      return left.event_at.localeCompare(right.event_at);
    });
  const history = events.filter((event) => event.status === "completed");
  const requestedMode = searchParams.get("mode");
  const mode = requestedMode === "history" || requestedMode === "upcoming"
    ? requestedMode
    : upcoming.length > 0 ? "upcoming" : "history";
  const requestedFilter = searchParams.get("filter");
  const filter = requestedFilter === "community" || requestedFilter === "external"
    ? requestedFilter
    : "all";
  const sourceEvents = mode === "upcoming" ? upcoming : history;
  const filteredEvents = filter === "all"
    ? sourceEvents
    : sourceEvents.filter((event) => event.event_type === filter);
  const offset = parseInteger(searchParams.get("offset"), 0);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInteger(searchParams.get("limit"), DEFAULT_PAGE_SIZE)),
  );
  const pagedEvents = filteredEvents.slice(offset, offset + limit);

  return NextResponse.json(
    {
      ...(includeLegacyCatalog ? { upcoming, history } : {}),
      events: pagedEvents,
      mode,
      filter,
      counts: { upcoming: upcoming.length, history: history.length },
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
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
