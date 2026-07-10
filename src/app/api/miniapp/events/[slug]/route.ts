import { NextResponse } from "next/server";

import { getPublicEventBySlug } from "@/lib/community-events";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const event = slug ? await getPublicEventBySlug(slug) : null;

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    { event },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
