import { NextResponse } from "next/server";

import {
  getAdminPreviewEventBySlug,
  getPublicEventBySlug,
} from "@/lib/community-events";
import { getEventParticipantSummaries } from "@/lib/event-participants";
import { canPreviewMiniappDraftEvents } from "@/lib/miniapp-admin";
import { loadOptionalMiniappSession } from "@/lib/miniapp-api";

async function withParticipants<T extends { id: string }>(event: T) {
  try {
    const summaries = await getEventParticipantSummaries([event.id], 12);
    const summary = summaries.get(event.id);
    return {
      ...event,
      registrationCount: summary?.registrationCount ?? 0,
      confirmedCount: summary?.confirmedCount ?? 0,
      participants: summary?.participants ?? [],
    };
  } catch (error) {
    console.error("Failed to load mini-program event participants.", error);
    return {
      ...event,
      registrationCount: 0,
      confirmedCount: 0,
      participants: [],
    };
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const publicEvent = slug ? await getPublicEventBySlug(slug) : null;

  if (publicEvent) {
    return NextResponse.json(
      { event: await withParticipants(publicEvent) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  }

  const auth = await loadOptionalMiniappSession(request);
  const canPreviewDrafts = auth
    ? await canPreviewMiniappDraftEvents(auth.supabase, auth.session.user_id)
    : false;
  const event = canPreviewDrafts && slug
    ? await getAdminPreviewEventBySlug(auth!.supabase, slug)
    : null;

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    { event: await withParticipants(event) },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
