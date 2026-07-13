import { NextResponse } from "next/server";

import { getPublishedEventSummaries } from "@/lib/community-events";

export async function GET() {
  const events = await getPublishedEventSummaries();
  const upcoming = events
    .filter((event) => event.status === "scheduled")
    .sort((left, right) => {
      if (!left.event_at) return 1;
      if (!right.event_at) return -1;
      return left.event_at.localeCompare(right.event_at);
    });
  const history = events.filter((event) => event.status === "completed");

  return NextResponse.json(
    {
      upcoming,
      history,
      counts: { upcoming: upcoming.length, history: history.length },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
