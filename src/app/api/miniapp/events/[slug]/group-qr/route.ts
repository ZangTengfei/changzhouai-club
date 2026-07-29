import { getConfirmedEventGroupQr } from "@/lib/event-group-qr";
import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  try {
    const { slug } = await context.params;
    const groupQr = await getConfirmedEventGroupQr({
      supabase: auth.supabase,
      eventSlug: slug,
      userId: auth.session.user_id,
    });
    if (!groupQr) return miniappJson({ error: "not_available" }, 404);
    return miniappJson({ groupQr });
  } catch {
    return miniappJson({ error: "group_qr_load_failed" }, 500);
  }
}
