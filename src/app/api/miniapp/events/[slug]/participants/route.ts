import { NextResponse } from "next/server";

import {
  getAdminPreviewEventBySlug,
  getPublicEventBySlug,
} from "@/lib/community-events";
import { getEventParticipantSummaries } from "@/lib/event-participants";
import { canPreviewMiniappDraftEvents } from "@/lib/miniapp-admin";
import { loadOptionalMiniappSession } from "@/lib/miniapp-api";

async function loadVisibleEvent(
  request: Request,
  slug: string,
) {
  const publicEvent = await getPublicEventBySlug(slug);
  if (publicEvent) return { event: publicEvent, isPublic: true };

  const auth = await loadOptionalMiniappSession(request);
  const canPreviewDrafts = auth
    ? await canPreviewMiniappDraftEvents(auth.supabase, auth.session.user_id)
    : false;
  const event = canPreviewDrafts
    ? await getAdminPreviewEventBySlug(auth!.supabase, slug)
    : null;
  return event ? { event, isPublic: false } : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const visible = slug ? await loadVisibleEvent(request, slug) : null;

  if (!visible) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const summaries = await getEventParticipantSummaries(
      [visible.event.id],
      Number.MAX_SAFE_INTEGER,
    );
    const summary = summaries.get(visible.event.id);
    return NextResponse.json(
      {
        event: {
          slug: visible.event.slug,
          title: visible.event.title,
        },
        confirmedCount: summary?.confirmedCount ?? 0,
        participants: summary?.participants ?? [],
      },
      {
        headers: {
          "Cache-Control": visible.isPublic
            ? "public, s-maxage=60, stale-while-revalidate=300"
            : "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Failed to load mini-program event participant list.", error);
    return NextResponse.json(
      { error: "event_participants_load_failed" },
      { status: 500 },
    );
  }
}
