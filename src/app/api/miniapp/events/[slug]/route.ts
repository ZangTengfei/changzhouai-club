import { NextResponse } from "next/server";

import {
  getDraftEventBySlug,
  getPublicEventBySlug,
} from "@/lib/community-events";
import { canPreviewMiniappDraftEvents } from "@/lib/miniapp-admin";
import { loadOptionalMiniappSession } from "@/lib/miniapp-api";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const publicEvent = slug ? await getPublicEventBySlug(slug) : null;

  if (publicEvent) {
    return NextResponse.json(
      { event: publicEvent },
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
    ? await getDraftEventBySlug(auth!.supabase, slug)
    : null;

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    { event },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
