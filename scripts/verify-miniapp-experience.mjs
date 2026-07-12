import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const apiBaseUrl = process.env.MINIAPP_VERIFY_API_BASE_URL?.trim() || "http://localhost:3000";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase server configuration.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const checks = [];
let userId = null;
let avatarPath = null;
let temporaryEventId = null;

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

function pass(name) {
  checks.push(name);
}

try {
  const email = `miniapp-verify-${randomUUID()}@users.invalid`;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name: "体验版测试用户" },
  });
  if (createError || !created.user) throw createError ?? new Error("user_create_failed");
  userId = created.user.id;

  const token = randomBytes(32).toString("base64url");
  const { error: sessionError } = await supabase.from("miniapp_sessions").insert({
    user_id: userId,
    token_hash: createHash("sha256").update(token).digest("hex"),
    expires_at: new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
  });
  if (sessionError) throw sessionError;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const unauthorized = await request("/api/miniapp/profile");
  assert.equal(unauthorized.response.status, 401);
  pass("unauthorized_session_rejected");

  const profileGet = await request("/api/miniapp/profile", { headers: authHeaders });
  assert.equal(profileGet.response.status, 200);
  pass("profile_loaded");

  const profilePut = await request("/api/miniapp/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      displayName: "体验版测试用户",
      wechat: "miniapp_verify",
      city: "常州",
      roleLabel: "测试",
      organization: "常州 AI Club",
      monthlyTime: "每月 2 小时",
      bio: "自动化验收临时账号",
      skills: ["测试"],
      interests: ["社区活动"],
      willingToAttend: true,
      willingToShare: false,
      willingToJoinProjects: false,
      privacyAccepted: true,
    }),
  });
  assert.equal(profilePut.response.status, 200);
  assert.equal(profilePut.body?.user?.profileComplete, true);
  pass("profile_saved_with_consent");

  const avatarForm = new FormData();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  avatarForm.append("file", new Blob([png], { type: "image/png" }), "avatar.png");
  avatarForm.append("privacyAccepted", "true");
  avatarForm.append("policyVersion", "2026-07-13");
  const avatarUpload = await request("/api/miniapp/profile/avatar", {
    method: "POST",
    headers: authHeaders,
    body: avatarForm,
  });
  assert.equal(avatarUpload.response.status, 200);
  assert.match(avatarUpload.body?.avatarUrl ?? "", /member-avatars/);
  avatarPath = `${userId}/avatar`;
  pass("avatar_uploaded");

  const { data: existingEvent, error: eventError } = await supabase
    .from("events")
    .select("id, slug")
    .eq("status", "scheduled")
    .neq("event_type", "external")
    .is("registration_url", null)
    .order("event_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (eventError) throw eventError;

  let event = existingEvent;
  if (!event) {
    const slug = `miniapp-verify-${randomUUID()}`;
    const { data: createdEvent, error: createEventError } = await supabase
      .from("events")
      .insert({
        slug,
        title: "小程序体验版自动验收活动",
        summary: "仅用于自动化验收，完成后自动删除。",
        status: "scheduled",
        event_type: "community",
        event_at: new Date(Date.now() + 48 * 60 * 60 * 1_000).toISOString(),
        city: "常州",
        venue: "自动化测试场地",
      })
      .select("id, slug")
      .single();
    if (createEventError) throw createEventError;
    event = createdEvent;
    temporaryEventId = createdEvent.id;
  }

  const { error: seedRegistrationError } = await supabase
    .from("event_registrations")
    .insert({ event_id: event.id, user_id: userId, status: "registered" });
  if (seedRegistrationError) throw seedRegistrationError;

  const registrationPut = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ note: "自动化验收" }),
    },
  );
  assert.equal(registrationPut.response.status, 200);
  assert.equal(registrationPut.body?.registration?.status, "registered");
  pass("event_registered_idempotently");

  const registrations = await request("/api/miniapp/registrations", {
    headers: authHeaders,
  });
  assert.equal(registrations.response.status, 200);
  assert.ok(registrations.body?.registrations?.length >= 1);
  pass("registrations_listed");

  const reminder = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/subscription`,
    { headers: authHeaders },
  );
  assert.equal(reminder.response.status, 200);
  pass("reminder_configuration_loaded");

  if (reminder.body?.available && reminder.body?.templateId) {
    const reminderSave = await request(
      `/api/miniapp/events/${encodeURIComponent(event.slug)}/subscription`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ status: "rejected" }),
      },
    );
    assert.equal(reminderSave.response.status, 200);
    pass("reminder_preference_saved");
  }

  const registrationDelete = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    { method: "DELETE", headers: authHeaders },
  );
  assert.equal(registrationDelete.response.status, 200);
  assert.equal(registrationDelete.body?.registration?.status, "cancelled");
  pass("event_registration_cancelled");

  if (reminder.body?.available && reminder.body?.templateId) {
    const { data: cancelledReminder, error: cancelledReminderError } = await supabase
      .from("miniapp_event_subscriptions")
      .select("id, status")
      .eq("user_id", userId)
      .eq("event_id", event.id)
      .eq("template_id", reminder.body.templateId)
      .maybeSingle();
    if (cancelledReminderError) throw cancelledReminderError;
    assert.equal(cancelledReminder?.status, "cancelled");
    pass("reminder_cancelled_with_registration");

    const subscriptionAfterCancel = await request(
      `/api/miniapp/events/${encodeURIComponent(event.slug)}/subscription`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ status: "rejected" }),
      },
    );
    assert.equal(subscriptionAfterCancel.response.status, 409);
    assert.equal(subscriptionAfterCancel.body?.error, "registration_required");
    pass("reminder_requires_active_registration");

    if (process.env.CRON_SECRET && cancelledReminder) {
      const { error: reactivateReminderError } = await supabase
        .from("miniapp_event_subscriptions")
        .update({ status: "accepted", send_at: new Date().toISOString() })
        .eq("id", cancelledReminder.id);
      if (reactivateReminderError) throw reactivateReminderError;

      const cron = await request("/api/cron/miniapp-event-reminders", {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      assert.equal(cron.response.status, 200);
      assert.ok(cron.body?.cancelled >= 1);
      pass("cron_skips_inactive_registration");
    }
  }

  const analytics = await request("/api/miniapp/analytics", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: "profile_saved",
      pagePath: "/verification",
      eventData: { source: "automated_check" },
    }),
  });
  assert.equal(analytics.response.status, 200);
  pass("analytics_tracked");

  console.log(JSON.stringify({ ok: true, checks }, null, 2));
} finally {
  if (avatarPath) {
    await supabase.storage.from("member-avatars").remove([avatarPath]);
  }
  if (userId) {
    await supabase
      .from("miniapp_analytics_events")
      .delete()
      .eq("user_id", userId);
  }
  if (userId) {
    await supabase.auth.admin.deleteUser(userId);
  }
  if (temporaryEventId) {
    await supabase.from("events").delete().eq("id", temporaryEventId);
  }
}
