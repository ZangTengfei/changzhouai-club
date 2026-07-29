import { NextResponse } from "next/server";

import { resolveCommunityUserId } from "@/lib/community-user";
import { getConfirmedEventGroupQr } from "@/lib/event-group-qr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const admin = createSupabaseAdminClient();
  if (!admin) return json({ error: "server_not_configured" }, 503);

  try {
    const { slug } = await context.params;
    const userId = await resolveCommunityUserId(admin, user.id);
    const groupQr = await getConfirmedEventGroupQr({
      supabase: admin,
      eventSlug: slug,
      userId,
    });
    if (!groupQr) return json({ error: "not_available" }, 404);
    return json({ groupQr });
  } catch {
    return json({ error: "group_qr_load_failed" }, 500);
  }
}
