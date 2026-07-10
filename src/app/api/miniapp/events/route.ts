import { NextResponse } from "next/server";

import { getScheduledEvents } from "@/lib/community-events";

export async function GET() {
  const events = await getScheduledEvents();

  return NextResponse.json(
    { events },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
