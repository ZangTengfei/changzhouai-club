import { timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getWechatMiniappAccessToken,
  getWechatMiniappConfig,
  getWechatMiniappReminderConfig,
  sendWechatMiniappSubscribeMessage,
  WechatMiniappApiError,
} from "@/lib/wechat-miniapp";

export const runtime = "nodejs";

type DueSubscription = {
  id: string;
  user_id: string;
  event_id: string;
  template_id: string;
  events: {
    slug: string;
    title: string;
    event_at: string;
    venue: string | null;
    city: string | null;
    status: string;
  } | null;
};

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!secret || !token) return false;

  const expected = Buffer.from(secret);
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function compact(value: string | null | undefined, maxLength = 20) {
  const text = value?.trim() || "待公布";
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`;
}

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const wechatConfig = getWechatMiniappConfig();
  const reminderConfig = getWechatMiniappReminderConfig();
  if (!supabase || !wechatConfig || !reminderConfig) {
    return NextResponse.json({ error: "reminder_not_configured" }, { status: 503 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("miniapp_event_subscriptions")
    .select(
      "id, user_id, event_id, template_id, events(slug, title, event_at, venue, city, status)",
    )
    .eq("status", "accepted")
    .lte("send_at", now)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "subscriptions_load_failed" }, { status: 500 });
  }

  const subscriptions = (data ?? []) as unknown as DueSubscription[];
  if (subscriptions.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0, cancelled: 0 });
  }

  const userIds = Array.from(new Set(subscriptions.map((item) => item.user_id)));
  const eventIds = Array.from(new Set(subscriptions.map((item) => item.event_id)));
  const [identityResult, registrationResult] = await Promise.all([
    supabase
      .from("user_identities")
      .select("user_id, provider_user_id")
      .eq("provider", "wechat")
      .eq("provider_app_id", wechatConfig.appId)
      .eq("provider_channel", "mini_program")
      .in("user_id", userIds),
    supabase
      .from("event_registrations")
      .select("user_id, event_id")
      .eq("status", "registered")
      .in("user_id", userIds)
      .in("event_id", eventIds),
  ]);

  if (identityResult.error || registrationResult.error) {
    return NextResponse.json(
      { error: "reminder_targets_load_failed" },
      { status: 500 },
    );
  }

  const openids = new Map(
    (identityResult.data ?? []).map((identity) => [
      identity.user_id as string,
      identity.provider_user_id as string,
    ]),
  );
  const activeRegistrations = new Set(
    (registrationResult.data ?? []).map(
      (registration) => `${registration.user_id}:${registration.event_id}`,
    ),
  );
  const deliverableSubscriptions: DueSubscription[] = [];
  let cancelled = 0;

  for (const subscription of subscriptions) {
    const event = subscription.events;
    const registrationActive = activeRegistrations.has(
      `${subscription.user_id}:${subscription.event_id}`,
    );

    if (
      !event ||
      event.status !== "scheduled" ||
      !registrationActive ||
      new Date(event.event_at).getTime() <= Date.now()
    ) {
      await supabase
        .from("miniapp_event_subscriptions")
        .update({
          status: "cancelled",
          last_error: "reminder_target_inactive",
        })
        .eq("id", subscription.id);
      cancelled += 1;
      continue;
    }

    deliverableSubscriptions.push(subscription);
  }

  if (deliverableSubscriptions.length === 0) {
    return NextResponse.json({
      processed: subscriptions.length,
      sent: 0,
      failed: 0,
      cancelled,
    });
  }

  const accessToken = await getWechatMiniappAccessToken(wechatConfig);
  let sent = 0;
  let failed = 0;

  for (const subscription of deliverableSubscriptions) {
    const event = subscription.events;
    const openid = openids.get(subscription.user_id);

    try {
      if (!event || !openid) {
        throw new Error("invalid_reminder_target");
      }

      await sendWechatMiniappSubscribeMessage({
        accessToken,
        openid,
        templateId: subscription.template_id,
        page: `pages/events/detail/index?slug=${encodeURIComponent(event.slug)}`,
        data: {
          [reminderConfig.titleKey]: { value: compact(event.title) },
          [reminderConfig.timeKey]: { value: formatEventTime(event.event_at) },
          [reminderConfig.locationKey]: {
            value: compact(event.venue || event.city || "常州"),
          },
        },
      });

      await supabase
        .from("miniapp_event_subscriptions")
        .update({ status: "sent", sent_at: now, last_error: null })
        .eq("id", subscription.id);
      sent += 1;
    } catch (sendError) {
      const errorCode =
        sendError instanceof WechatMiniappApiError
          ? `${sendError.code}:${sendError.wechatErrorCode ?? "unknown"}`
          : "invalid_reminder_target";
      await supabase
        .from("miniapp_event_subscriptions")
        .update({ status: "failed", last_error: errorCode })
        .eq("id", subscription.id);
      failed += 1;
    }
  }

  return NextResponse.json({
    processed: subscriptions.length,
    sent,
    failed,
    cancelled,
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
