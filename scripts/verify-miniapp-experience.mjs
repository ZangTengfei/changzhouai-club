import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const apiBaseUrl =
  process.env.MINIAPP_VERIFY_API_BASE_URL?.trim() || "http://localhost:3000";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const eventRegistrationConsentVersion = "2026-07-28";
const eventPortraitConsentVersion = "2026-07-28";

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
let eventGroupQrPath = null;

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
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: "体验版测试用户" },
    });
  if (createError || !created.user)
    throw createError ?? new Error("user_create_failed");
  userId = created.user.id;

  const token = randomBytes(32).toString("base64url");
  const { error: sessionError } = await supabase
    .from("miniapp_sessions")
    .insert({
      user_id: userId,
      token_hash: createHash("sha256").update(token).digest("hex"),
      expires_at: new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
    });
  if (sessionError) throw sessionError;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const { error: identityError } = await supabase
    .from("user_identities")
    .insert({
      user_id: userId,
      provider: "wechat",
      provider_app_id: "miniapp-experience-verifier",
      provider_user_id: randomUUID(),
      provider_channel: "mini_program",
      identity_data: {},
      last_seen_at: new Date().toISOString(),
    });
  if (identityError) throw identityError;

  const unauthorized = await request("/api/miniapp/profile");
  assert.equal(unauthorized.response.status, 401);
  pass("unauthorized_session_rejected");

  const profileGet = await request("/api/miniapp/profile", {
    headers: authHeaders,
  });
  assert.equal(profileGet.response.status, 200);
  assert.ok(profileGet.body?.options?.industries?.length > 0);
  assert.ok(profileGet.body?.options?.cities?.length > 0);
  assert.ok(profileGet.body?.options?.roles?.length > 0);
  assert.ok(profileGet.body?.options?.monthlyTimes?.length > 0);
  assert.equal(profileGet.body?.profile?.isPubliclyVisible, true);
  pass("profile_loaded");
  pass("new_profile_visibility_defaults_on");

  const legacyBootstrapPut = await request("/api/miniapp/profile", {
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
      status: "admin",
      isCoBuilder: true,
      privacyAccepted: true,
    }),
  });
  assert.equal(legacyBootstrapPut.response.status, 200);
  assert.equal(legacyBootstrapPut.body?.user?.profileComplete, true);
  assert.equal(legacyBootstrapPut.body?.user?.capabilityProfileComplete, false);
  const { data: bootstrapMember, error: bootstrapMemberError } = await supabase
    .from("members")
    .select("status, is_co_builder, is_publicly_visible")
    .eq("id", userId)
    .single();
  if (bootstrapMemberError) throw bootstrapMemberError;
  assert.equal(bootstrapMember.is_publicly_visible, false);
  assert.notEqual(bootstrapMember.status, "admin");
  assert.equal(bootstrapMember.is_co_builder, false);
  pass("legacy_profile_keeps_registration_ready");
  pass("incomplete_profile_not_published_before_completion");
  pass("self_profile_cannot_grant_member_identity");

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
      industryTags: ["软件与信息服务"],
      skills: ["测试"],
      interests: ["社区活动"],
      capabilitySummary: "可以协助自动化验收",
      seekingSummary: "",
      willingToAttend: true,
      willingToShare: false,
      willingToJoinProjects: false,
      isPubliclyVisible: true,
      privacyAccepted: true,
    }),
  });
  assert.equal(profilePut.response.status, 200);
  assert.equal(profilePut.body?.user?.registrationReady, true);
  assert.equal(profilePut.body?.user?.profileComplete, true);
  assert.equal(profilePut.body?.user?.capabilityProfileComplete, true);
  assert.equal(profilePut.body?.profile?.completion?.percent, 100);
  assert.equal(profilePut.body?.profile?.shareHandle, userId);
  pass("profile_saved_with_consent");

  const sharedProfile = await request(
    `/api/miniapp/members/${encodeURIComponent(userId)}`,
  );
  assert.equal(sharedProfile.response.status, 200);
  assert.equal(sharedProfile.body?.profile?.displayName, "体验版测试用户");
  assert.equal(sharedProfile.body?.profile?.capabilitySummary, "可以协助自动化验收");
  assert.equal("wechat" in (sharedProfile.body?.profile ?? {}), false);
  pass("public_member_profile_loaded_without_private_fields");

  const { error: hideProfileError } = await supabase
    .from("members")
    .update({ is_publicly_visible: false })
    .eq("id", userId);
  if (hideProfileError) throw hideProfileError;
  const hiddenProfile = await request(
    `/api/miniapp/members/${encodeURIComponent(userId)}`,
  );
  assert.equal(hiddenProfile.response.status, 404);
  pass("private_member_profile_hidden");

  const { error: restoreProfileError } = await supabase
    .from("members")
    .update({ is_publicly_visible: true })
    .eq("id", userId);
  if (restoreProfileError) throw restoreProfileError;

  const legacyProfilePut = await request("/api/miniapp/profile", {
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
  assert.equal(legacyProfilePut.response.status, 200);
  assert.equal(legacyProfilePut.body?.profile?.completion?.percent, 100);
  pass("legacy_profile_payload_preserves_capability_fields");

  const avatarForm = new FormData();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  avatarForm.append(
    "file",
    new Blob([png], { type: "image/png" }),
    "avatar.png",
  );
  avatarForm.append("privacyAccepted", "true");
  avatarForm.append("policyVersion", "2026-07-18");
  const avatarUpload = await request("/api/miniapp/profile/avatar", {
    method: "POST",
    headers: authHeaders,
    body: avatarForm,
  });
  assert.equal(avatarUpload.response.status, 200);
  assert.match(avatarUpload.body?.avatarUrl ?? "", /member-avatars/);
  avatarPath = `${userId}/avatar`;
  pass("avatar_uploaded");

  const slug = `miniapp-verify-${randomUUID()}`;
  const { data: event, error: createEventError } = await supabase
    .from("events")
    .insert({
      slug,
      title: "小程序体验版自动验收活动",
      summary: "仅用于自动化验收，完成后自动删除。",
      status: "scheduled",
      event_type: "community",
      registration_mode: "review",
      registration_capacity: 1,
      event_at: new Date(Date.now() + 48 * 60 * 60 * 1_000).toISOString(),
      city: "常州",
      venue: "自动化测试场地",
    })
    .select("id, slug")
    .single();
  if (createEventError) throw createEventError;
  temporaryEventId = event.id;
  eventGroupQrPath = `events/${event.slug}/group-qr/verification.png`;
  const { error: groupQrUploadError } = await supabase.storage
    .from("event-private-assets")
    .upload(eventGroupQrPath, png, { contentType: "image/png" });
  if (groupQrUploadError) throw groupQrUploadError;
  const { error: groupQrCreateError } = await supabase
    .from("event_group_qr_codes")
    .insert({
      event_id: event.id,
      storage_path: eventGroupQrPath,
      note: "自动化验收入群说明",
      expires_at: new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
      is_active: true,
    });
  if (groupQrCreateError) throw groupQrCreateError;

  const { error: badgeError } = await supabase
    .from("member_badge_awards")
    .insert({
      user_id: userId,
      badge_code: "verification_badge",
      label: "验收徽章",
      description: "仅用于自动化验收",
      source: "admin",
    });
  if (badgeError) throw badgeError;

  const registrationWithoutConsent = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ note: "未同意协议" }),
    },
  );
  assert.equal(registrationWithoutConsent.response.status, 400);
  assert.equal(
    registrationWithoutConsent.body?.error,
    "registration_consent_required",
  );
  pass("event_registration_requires_consent");

  const registrationPut = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        note: "自动化验收",
        registrationConsentAccepted: true,
        portraitConsentAccepted: true,
        registrationConsentVersion: eventRegistrationConsentVersion,
        portraitConsentVersion: eventPortraitConsentVersion,
      }),
    },
  );
  assert.equal(registrationPut.response.status, 200);
  assert.equal(registrationPut.body?.registration?.status, "pending");
  pass("event_registration_pending_review");

  const pendingGroupQr = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/group-qr`,
    { headers: authHeaders },
  );
  assert.equal(pendingGroupQr.response.status, 404);
  pass("event_group_qr_hidden_before_confirmation");

  const { data: approvedRegistration, error: approveRegistrationError } =
    await supabase
      .rpc("set_event_registration_status", {
        p_event_id: event.id,
        p_registration_id: registrationPut.body?.registration?.id,
        p_status: "registered",
      })
      .single();
  if (approveRegistrationError) throw approveRegistrationError;
  assert.equal(approvedRegistration?.status, "registered");

  const confirmedGroupQr = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/group-qr`,
    { headers: authHeaders },
  );
  assert.equal(confirmedGroupQr.response.status, 200);
  assert.equal(confirmedGroupQr.body?.groupQr?.note, "自动化验收入群说明");
  assert.match(confirmedGroupQr.body?.groupQr?.imageUrl ?? "", /token=/);
  pass("event_group_qr_visible_after_confirmation");

  const repeatedRegistrationPut = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        note: "自动化验收",
        registrationConsentAccepted: true,
        portraitConsentAccepted: true,
        registrationConsentVersion: eventRegistrationConsentVersion,
        portraitConsentVersion: eventPortraitConsentVersion,
      }),
    },
  );
  assert.equal(repeatedRegistrationPut.response.status, 200);
  assert.equal(
    repeatedRegistrationPut.body?.registration?.status,
    "registered",
  );
  pass("event_registered_idempotently");

  const { data: eventConsents, error: eventConsentsError } = await supabase
    .from("miniapp_consents")
    .select("policy_version, accepted_at")
    .eq("user_id", userId)
    .in("policy_version", [
      `event-registration:${eventRegistrationConsentVersion}:${event.id}`,
      `event-portrait:${eventPortraitConsentVersion}:${event.id}`,
    ]);
  if (eventConsentsError) throw eventConsentsError;
  assert.equal(eventConsents?.length, 2);
  assert.ok(eventConsents?.every((consent) => consent.accepted_at));
  pass("event_registration_consents_recorded");

  const checkinToken = randomBytes(32).toString("base64url");
  const { error: checkinTokenError } = await supabase
    .from("event_checkin_tokens")
    .insert({
      event_id: event.id,
      token_hash: createHash("sha256").update(checkinToken).digest("hex"),
      starts_at: new Date(Date.now() - 60 * 1_000).toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1_000).toISOString(),
    });
  if (checkinTokenError) throw checkinTokenError;

  const checkin = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/checkin`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ token: checkinToken }),
    },
  );
  assert.equal(checkin.response.status, 200);
  assert.equal(checkin.body?.attendance?.status, "attended");
  assert.equal(checkin.body?.alreadyCheckedIn, false);
  const repeatedCheckin = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/checkin`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ token: checkinToken }),
    },
  );
  assert.equal(repeatedCheckin.response.status, 200);
  assert.equal(repeatedCheckin.body?.alreadyCheckedIn, true);
  pass("event_checkin_completed_idempotently");

  const accountSnapshot = await request("/api/miniapp/auth/me", {
    headers: authHeaders,
  });
  assert.equal(accountSnapshot.response.status, 200);
  assert.ok(accountSnapshot.body?.user?.stats?.registrationCount >= 1);
  assert.equal(accountSnapshot.body?.user?.stats?.attendanceCount, 1);
  assert.ok(
    accountSnapshot.body?.user?.badges?.some(
      (badge) => badge.code === "first_meetup",
    ),
  );
  assert.ok(
    accountSnapshot.body?.user?.badges?.some(
      (badge) => badge.code === "verification_badge",
    ),
  );
  const membershipBadgeCodes = new Set([
    "co_builder",
    "core_builder",
    "honor_builder",
  ]);
  assert.equal(
    accountSnapshot.body?.user?.stats?.badgeCount,
    accountSnapshot.body?.user?.badges?.filter(
      (badge) => !membershipBadgeCodes.has(badge.code),
    ).length,
  );
  pass("community_tag_count_excludes_membership_level");
  assert.ok(
    accountSnapshot.body?.user?.footprints?.some(
      (footprint) =>
        footprint.id === event.id && footprint.participationLabel === "已参加",
    ),
  );
  assert.equal(accountSnapshot.body?.user?.accountRecoveryAvailable, true);
  pass("member_growth_snapshot_loaded");

  const invalidRecoveryStart = await request(
    "/api/miniapp/account-recovery/start",
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email: "invalid-email" }),
    },
  );
  assert.equal(invalidRecoveryStart.response.status, 400);
  assert.equal(invalidRecoveryStart.body?.error, "invalid_email");

  const recoveryToken = randomBytes(32).toString("base64url");
  const { error: recoveryIntentError } = await supabase
    .from("account_recovery_intents")
    .insert({
      token_hash: createHash("sha256").update(recoveryToken).digest("hex"),
      source_user_id: userId,
      target_email_hash: createHash("sha256")
        .update(email.toLowerCase())
        .digest("hex"),
      expires_at: new Date(Date.now() + 15 * 60 * 1_000).toISOString(),
    });
  if (recoveryIntentError) throw recoveryIntentError;

  const invalidRecoveryCode = await request(
    "/api/miniapp/account-recovery/verify",
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        code: "000000",
        email,
        recoveryToken,
      }),
    },
  );
  assert.equal(invalidRecoveryCode.response.status, 400);
  assert.equal(
    invalidRecoveryCode.body?.error,
    "invalid_verification_code",
  );

  const unverifiedRecoveryConfirm = await request(
    "/api/miniapp/account-recovery/confirm",
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ recoveryToken, choices: {} }),
    },
  );
  assert.equal(unverifiedRecoveryConfirm.response.status, 409);
  assert.equal(
    unverifiedRecoveryConfirm.body?.error,
    "account_merge_failed",
  );
  pass("account_recovery_guards_enforced");

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

  const cancelledGroupQr = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/group-qr`,
    { headers: authHeaders },
  );
  assert.equal(cancelledGroupQr.response.status, 404);
  pass("event_group_qr_hidden_after_cancellation");

  const { data: portraitConsentAfterCancel, error: portraitConsentLoadError } =
    await supabase
      .from("miniapp_consents")
      .select("policy_version")
      .eq("user_id", userId)
      .eq(
        "policy_version",
        `event-portrait:${eventPortraitConsentVersion}:${event.id}`,
      )
      .maybeSingle();
  if (portraitConsentLoadError) throw portraitConsentLoadError;
  assert.equal(portraitConsentAfterCancel, null);
  pass("event_portrait_consent_withdrawn_on_cancel");

  if (reminder.body?.available && reminder.body?.templateId) {
    const { data: cancelledReminder, error: cancelledReminderError } =
      await supabase
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

  const { error: completeEventError } = await supabase
    .from("events")
    .update({ status: "completed" })
    .eq("id", event.id);
  if (completeEventError) throw completeEventError;

  const feedbackPut = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/feedback`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ rating: 5, comment: "自动化验收反馈" }),
    },
  );
  assert.equal(feedbackPut.response.status, 200);
  assert.equal(feedbackPut.body?.feedback?.rating, 5);
  const feedbackGet = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/feedback`,
    { headers: authHeaders },
  );
  assert.equal(feedbackGet.response.status, 200);
  assert.equal(feedbackGet.body?.attendance?.status, "attended");
  assert.equal(feedbackGet.body?.feedback?.comment, "自动化验收反馈");
  pass("event_feedback_saved_and_loaded");

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

  const contentRead = await request("/api/miniapp/content-interactions", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      action: "read",
      contentType: "news",
      contentId: "verification-news-item",
    }),
  });
  assert.equal(contentRead.response.status, 200);
  assert.ok(contentRead.body?.interaction?.lastReadAt);

  const contentFavorite = await request("/api/miniapp/content-interactions", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      action: "favorite",
      contentType: "news",
      contentId: "verification-news-item",
    }),
  });
  assert.equal(contentFavorite.response.status, 200);
  assert.equal(contentFavorite.body?.interaction?.isFavorited, true);

  const contentInteractions = await request(
    "/api/miniapp/content-interactions?contentType=news&contentIds=verification-news-item",
    { headers: authHeaders },
  );
  assert.equal(contentInteractions.response.status, 200);
  assert.equal(
    contentInteractions.body?.interactions?.["verification-news-item"]?.isFavorited,
    true,
  );
  pass("content_interactions_saved_and_loaded");

  const news = await request("/api/miniapp/news", { headers: authHeaders });
  assert.equal(news.response.status, 200);
  assert.ok(Array.isArray(news.body?.categories));
  assert.ok(Array.isArray(news.body?.hotTopics));
  assert.ok(Array.isArray(news.body?.items));
  if (news.body.hotTopics.length > 0) {
    assert.ok(news.body.hotTopics[0]?.id);
    assert.ok(news.body.hotTopics[0]?.sourceCount >= 1);
  }
  pass("news_feed_loaded_with_fallback_contract");

  const dailyBrief = await request("/api/miniapp/news/daily", {
    headers: authHeaders,
  });
  assert.equal(dailyBrief.response.status, 200);
  pass("daily_brief_loaded_with_fallback_contract");

  const groupDigests = await request("/api/miniapp/group-digests", {
    headers: authHeaders,
  });
  assert.equal(groupDigests.response.status, 200);
  assert.ok(Array.isArray(groupDigests.body?.items));
  if (groupDigests.body.items.length > 0) {
    const digestDetail = await request(
      `/api/miniapp/group-digests/${encodeURIComponent(groupDigests.body.items[0].id)}`,
      { headers: authHeaders },
    );
    assert.equal(digestDetail.response.status, 200);
    assert.equal(digestDetail.body?.digest?.id, groupDigests.body.items[0].id);
    assert.ok(Array.isArray(digestDetail.body?.digest?.highlights));
  }
  pass("synced_group_digests_loaded");

  console.log(JSON.stringify({ ok: true, checks }, null, 2));
} finally {
  if (eventGroupQrPath) {
    await supabase.storage
      .from("event-private-assets")
      .remove([eventGroupQrPath]);
  }
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
