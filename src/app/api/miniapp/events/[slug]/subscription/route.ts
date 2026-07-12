import type { SupabaseClient } from "@supabase/supabase-js";

import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";
import { getWechatMiniappReminderConfig } from "@/lib/wechat-miniapp";

export const runtime = "nodejs";

async function loadEvent(
  supabase: SupabaseClient,
  slug: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select("id, event_at, status")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error("event_load_failed");
  return data;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const config = getWechatMiniappReminderConfig();
  if (!config) return miniappJson({ available: false, subscription: null });

  const { slug } = await context.params;
  const event = await loadEvent(auth.supabase, slug);
  if (!event) return miniappJson({ error: "not_found" }, 404);

  const { data, error } = await auth.supabase
    .from("miniapp_event_subscriptions")
    .select("status, send_at, sent_at")
    .eq("user_id", auth.session.user_id)
    .eq("event_id", event.id)
    .eq("template_id", config.templateId)
    .maybeSingle();

  if (error) return miniappJson({ error: "subscription_load_failed" }, 500);

  return miniappJson({
    available: event.status === "scheduled" && Boolean(event.event_at),
    templateId: config.templateId,
    subscription: data ?? null,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const config = getWechatMiniappReminderConfig();
  if (!config) return miniappJson({ error: "reminder_not_configured" }, 503);

  const payload = (await request.json().catch(() => null)) as
    | { status?: unknown }
    | null;
  const status = payload?.status;
  if (status !== "accepted" && status !== "rejected") {
    return miniappJson({ error: "invalid_subscription_status" }, 400);
  }

  const { slug } = await context.params;
  const event = await loadEvent(auth.supabase, slug);
  if (!event) return miniappJson({ error: "not_found" }, 404);
  if (event.status !== "scheduled" || !event.event_at) {
    return miniappJson({ error: "reminder_unavailable" }, 409);
  }

  const eventAt = new Date(event.event_at).getTime();
  const sendAt = new Date(Math.max(Date.now(), eventAt - 24 * 60 * 60 * 1_000));
  const { data, error } = await auth.supabase
    .from("miniapp_event_subscriptions")
    .upsert(
      {
        user_id: auth.session.user_id,
        event_id: event.id,
        template_id: config.templateId,
        status,
        send_at: sendAt.toISOString(),
        sent_at: null,
        last_error: null,
      },
      { onConflict: "user_id,event_id,template_id" },
    )
    .select("status, send_at, sent_at")
    .single();

  if (error) return miniappJson({ error: "subscription_save_failed" }, 500);
  return miniappJson({ subscription: data });
}
