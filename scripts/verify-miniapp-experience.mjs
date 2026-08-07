import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import COS from "cos-nodejs-sdk-v5";

const apiBaseUrl =
  process.env.MINIAPP_VERIFY_API_BASE_URL?.trim() || "http://localhost:3000";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const cosBucket = process.env.TENCENT_COS_BUCKET?.trim();
const cosRegion = process.env.TENCENT_COS_REGION?.trim();
const cosSecretId = process.env.TENCENT_COS_SECRET_ID?.trim();
const cosSecretKey = process.env.TENCENT_COS_SECRET_KEY?.trim();
const eventRegistrationConsentVersion = "2026-07-30-v2";
const eventPortraitConsentVersion = "2026-07-30";

if (
  !supabaseUrl ||
  !serviceRoleKey ||
  !cosBucket ||
  !cosRegion ||
  !cosSecretId ||
  !cosSecretKey
) {
  throw new Error("Missing Supabase or Tencent COS server configuration.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cos = new COS({ SecretId: cosSecretId, SecretKey: cosSecretKey });
const checks = [];
let userId = null;
let avatarPath = null;
let temporaryEventId = null;
let temporaryDraftEventId = null;
let temporaryCompletedWaitlistEventId = null;
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

async function waitForUpcomingEventPreview(eventId) {
  const deadline = Date.now() + 70_000;

  while (Date.now() < deadline) {
    const catalog = await request("/api/miniapp/events?mode=upcoming&limit=20");
    const preview = catalog.body?.events?.find((item) => item.id === eventId);
    if (preview) return preview;
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }

  return null;
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

  const preConsentBasicProfilePut = await request(
    "/api/miniapp/profile/basic",
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ displayName: "免隐私弹窗测试用户" }),
    },
  );
  assert.equal(preConsentBasicProfilePut.response.status, 200);
  assert.equal(
    preConsentBasicProfilePut.body?.user?.displayName,
    "免隐私弹窗测试用户",
  );
  assert.equal(preConsentBasicProfilePut.body?.user?.privacyAccepted, false);
  pass("display_name_quick_edit_does_not_require_privacy_consent");

  const privacyConsentPost = await request("/api/miniapp/profile/privacy", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      accepted: true,
      policyVersion: "2026-07-18",
    }),
  });
  assert.equal(privacyConsentPost.response.status, 200);
  assert.equal(privacyConsentPost.body?.user?.privacyAccepted, true);
  pass("basic_privacy_consent_saved_outside_capability_profile");

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
  assert.equal(legacyBootstrapPut.body?.user?.registrationReady, false);
  assert.equal(legacyBootstrapPut.body?.user?.basicProfileReady, true);
  assert.equal(legacyBootstrapPut.body?.user?.profileComplete, false);
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
  pass("incomplete_profile_blocks_registration");
  pass("incomplete_profile_not_published_before_completion");
  pass("self_profile_cannot_grant_member_identity");

  const completeProfilePayload = {
    wechat: "",
    city: "常州",
    roleLabel: "测试",
    organization: "常州 AI Club",
    bio: "自动化验收临时账号",
    industryTags: ["软件与信息服务"],
    skills: ["测试"],
    interests: ["社区活动"],
    capabilitySummary: "可以协助自动化验收",
    seekingSummary: "",
    isPubliclyVisible: true,
    privacyAccepted: true,
  };
  const defaultNameProfilePut = await request("/api/miniapp/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      ...completeProfilePayload,
      displayName: "微信用户",
    }),
  });
  assert.equal(defaultNameProfilePut.response.status, 400);
  assert.equal(defaultNameProfilePut.body?.error, "invalid_profile");
  pass("default_display_name_rejected");

  const profilePut = await request("/api/miniapp/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      ...completeProfilePayload,
      displayName: "体验版测试用户",
    }),
  });
  assert.equal(profilePut.response.status, 200);
  assert.equal(profilePut.body?.user?.registrationReady, true);
  assert.equal(profilePut.body?.user?.basicProfileReady, true);
  assert.equal(profilePut.body?.user?.profileComplete, true);
  assert.equal(profilePut.body?.user?.capabilityProfileComplete, true);
  assert.equal(profilePut.body?.profile?.completion?.percent, 100);
  assert.equal(profilePut.body?.profile?.completion?.totalCount, 5);
  assert.equal(profilePut.body?.profile?.shareHandle, userId);
  assert.equal(profilePut.body?.profile?.isPubliclyVisible, true);
  pass("profile_saved_without_wechat");
  pass("profile_saved_without_removed_preference_fields");

  const invalidBasicProfilePut = await request("/api/miniapp/profile/basic", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ displayName: "微信用户" }),
  });
  assert.equal(invalidBasicProfilePut.response.status, 400);
  assert.equal(invalidBasicProfilePut.body?.error, "invalid_display_name");

  const basicProfilePut = await request("/api/miniapp/profile/basic", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ displayName: "快捷编辑测试用户" }),
  });
  assert.equal(basicProfilePut.response.status, 200);
  assert.equal(basicProfilePut.body?.user?.displayName, "快捷编辑测试用户");
  pass("display_name_quick_edit_saved");

  const { error: contactInsertError } = await supabase
    .from("member_private_contacts")
    .insert({
      user_id: userId,
      phone_number: "13800138000",
      phone_country_code: "86",
      phone_last4: "8000",
      phone_verified_at: new Date().toISOString(),
      phone_source: "wechat",
    });
  if (contactInsertError) throw contactInsertError;
  const accountWithPhone = await request("/api/miniapp/auth/me", {
    headers: authHeaders,
  });
  assert.equal(accountWithPhone.response.status, 200);
  assert.equal(accountWithPhone.body?.user?.phoneBound, true);
  assert.equal(accountWithPhone.body?.user?.phoneMasked, "****8000");
  assert.equal("phoneNumber" in (accountWithPhone.body?.user ?? {}), false);
  pass("private_phone_returned_masked");

  const legacyLongSkill = "旧版成员资料中的能力方向需要在小程序中继续保留".repeat(2);
  assert.ok(legacyLongSkill.length > 40);
  const legacyLongSkillPut = await request("/api/miniapp/profile", {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      ...completeProfilePayload,
      displayName: "快捷编辑测试用户",
      skills: [legacyLongSkill],
    }),
  });
  assert.equal(legacyLongSkillPut.response.status, 200);
  assert.deepEqual(legacyLongSkillPut.body?.profile?.skills, [legacyLongSkill]);
  pass("legacy_long_skill_preserved");

  const guestMemberPool = await request(
    `/api/miniapp/members?query=${encodeURIComponent("快捷编辑测试用户")}`,
  );
  assert.equal(guestMemberPool.response.status, 200);
  assert.equal(guestMemberPool.body?.authenticated, false);
  assert.equal(guestMemberPool.body?.guestPreview, true);
  assert.ok((guestMemberPool.body?.members?.length ?? 0) <= 6);
  assert.equal(
    guestMemberPool.body?.members?.some((member) => member.id === userId),
    true,
  );
  pass("member_pool_guest_preview_loaded");

  const authenticatedMemberPool = await request(
    `/api/miniapp/members?query=${encodeURIComponent("快捷编辑测试用户")}`,
    { headers: authHeaders },
  );
  assert.equal(authenticatedMemberPool.response.status, 200);
  assert.equal(authenticatedMemberPool.body?.authenticated, true);
  assert.ok(authenticatedMemberPool.body?.summary?.communityTotal >= 1);
  assert.ok(
    authenticatedMemberPool.body?.summary?.communityTotal >=
      authenticatedMemberPool.body?.summary?.publicTotal,
  );
  const verifiedMember = authenticatedMemberPool.body?.members?.find(
    (member) => member.id === userId,
  );
  assert.ok(verifiedMember);
  assert.equal("wechat" in verifiedMember, false);
  assert.equal("phone" in verifiedMember, false);
  assert.equal("email" in verifiedMember, false);
  assert.equal("bio" in verifiedMember, false);
  assert.equal("joinedAt" in verifiedMember, false);
  assert.equal("joinedLabel" in verifiedMember, false);
  assert.equal("attendanceCount" in verifiedMember, false);
  assert.equal(typeof verifiedMember.isRecommended, "boolean");
  assert.equal("directoryPriority" in verifiedMember, false);
  pass("member_pool_authenticated_search_excludes_private_fields");

  for (const sort of ["recommended", "newest", "active"]) {
    const sortedMemberPool = await request(
      `/api/miniapp/members?sort=${sort}`,
      { headers: authHeaders },
    );
    assert.equal(sortedMemberPool.response.status, 200);
    assert.equal(sortedMemberPool.body?.sort, sort);
  }
  pass("member_pool_sort_options_loaded");

  const invalidMemberFilter = await request(
    "/api/miniapp/members?intent=private-contact",
    { headers: authHeaders },
  );
  assert.equal(invalidMemberFilter.response.status, 400);
  assert.equal(invalidMemberFilter.body?.error, "invalid_member_filter");
  pass("member_pool_invalid_filter_rejected");

  const invalidMemberSort = await request(
    "/api/miniapp/members?sort=tag-count",
    { headers: authHeaders },
  );
  assert.equal(invalidMemberSort.response.status, 400);
  assert.equal(invalidMemberSort.body?.error, "invalid_member_sort");
  pass("member_pool_invalid_sort_rejected");

  const sharedProfile = await request(
    `/api/miniapp/members/${encodeURIComponent(userId)}`,
  );
  assert.equal(sharedProfile.response.status, 200);
  assert.equal(sharedProfile.body?.profile?.displayName, "快捷编辑测试用户");
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

  const hiddenMemberPool = await request(
    `/api/miniapp/members?query=${encodeURIComponent("快捷编辑测试用户")}`,
    { headers: authHeaders },
  );
  assert.equal(hiddenMemberPool.response.status, 200);
  assert.equal(
    hiddenMemberPool.body?.members?.some((member) => member.id === userId),
    false,
  );
  pass("private_member_excluded_from_member_pool");

  const { error: restoreProfileError } = await supabase
    .from("members")
    .update({ is_publicly_visible: true })
    .eq("id", userId);
  if (restoreProfileError) throw restoreProfileError;

  const communityStartsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1_000);
  communityStartsAt.setUTCHours(1, 0, 0, 0);
  const communityEndsAt = new Date(
    communityStartsAt.getTime() + 2 * 60 * 60 * 1_000,
  );
  const communityQuery = [
    `startsAt=${encodeURIComponent(communityStartsAt.toISOString())}`,
    `endsAt=${encodeURIComponent(communityEndsAt.toISOString())}`,
  ].join("&");
  const communityPublic = await request(
    `/api/miniapp/community?${communityQuery}`,
  );
  assert.equal(communityPublic.response.status, 200);
  assert.equal(
    communityPublic.body?.resources?.filter(
      (resource) => resource.resourceType === "desk",
    ).length,
    32,
  );
  assert.equal(
    communityPublic.body?.resources?.filter(
      (resource) => resource.resourceType === "meeting_room",
    ).length,
    1,
  );
  assert.ok(communityPublic.body?.spacePhotos?.length >= 2);
  assert.ok(
    communityPublic.body?.spacePhotos?.some(
      (photo) => photo.isHero && /^https:\/\//.test(photo.src),
    ),
  );
  const deskResources = communityPublic.body?.resources?.filter(
    (resource) => resource.resourceType === "desk",
  );
  assert.ok(
    deskResources?.every(
      (resource) =>
        resource.fixedApplicable ===
          !["fixed", "disabled"].includes(resource.availability),
    ),
  );
  const availableDesk = communityPublic.body?.resources?.find(
    (resource) =>
      resource.resourceType === "desk" &&
      resource.availability === "available",
  );
  const availableMeetingRoom = communityPublic.body?.resources?.find(
    (resource) =>
      resource.resourceType === "meeting_room" &&
      resource.availability === "available",
  );
  assert.ok(availableDesk?.id);
  assert.equal(availableDesk?.fixedApplicable, true);
  assert.ok(availableMeetingRoom?.id);
  pass("community_space_catalog_loaded");

  const unauthorizedCommunityBooking = await request(
    "/api/miniapp/community/bookings",
    {
      method: "POST",
      body: JSON.stringify({
        resourceId: availableDesk.id,
        startsAt: communityStartsAt.toISOString(),
        endsAt: communityEndsAt.toISOString(),
        attendeeCount: 1,
      }),
    },
  );
  assert.equal(unauthorizedCommunityBooking.response.status, 401);
  pass("community_booking_requires_login");

  const deskBooking = await request("/api/miniapp/community/bookings", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      resourceId: availableDesk.id,
      startsAt: communityStartsAt.toISOString(),
      endsAt: communityEndsAt.toISOString(),
      attendeeCount: 1,
    }),
  });
  assert.equal(deskBooking.response.status, 201);
  assert.ok(deskBooking.body?.booking?.id);

  const overlappingDeskBooking = await request(
    "/api/miniapp/community/bookings",
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        resourceId: availableDesk.id,
        startsAt: communityStartsAt.toISOString(),
        endsAt: communityEndsAt.toISOString(),
        attendeeCount: 1,
      }),
    },
  );
  assert.equal(overlappingDeskBooking.response.status, 409);
  assert.equal(
    overlappingDeskBooking.body?.error,
    "space_resource_already_booked",
  );
  pass("community_booking_overlap_rejected");

  const missingMeetingPurpose = await request(
    "/api/miniapp/community/bookings",
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        resourceId: availableMeetingRoom.id,
        startsAt: communityStartsAt.toISOString(),
        endsAt: communityEndsAt.toISOString(),
        attendeeCount: 2,
      }),
    },
  );
  assert.equal(missingMeetingPurpose.response.status, 409);
  assert.equal(missingMeetingPurpose.body?.error, "meeting_purpose_required");

  const meetingBooking = await request("/api/miniapp/community/bookings", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      resourceId: availableMeetingRoom.id,
      startsAt: communityStartsAt.toISOString(),
      endsAt: communityEndsAt.toISOString(),
      purpose: "自动化验收会议",
      attendeeCount: 2,
    }),
  });
  assert.equal(meetingBooking.response.status, 201);
  assert.ok(meetingBooking.body?.booking?.id);
  pass("community_meeting_room_booked_with_purpose");

  const communityAuthenticated = await request(
    `/api/miniapp/community?${communityQuery}`,
    { headers: authHeaders },
  );
  assert.equal(communityAuthenticated.response.status, 200);
  const bookedDeskSnapshot = communityAuthenticated.body?.resources?.find(
    (resource) => resource.id === availableDesk.id,
  );
  assert.equal(bookedDeskSnapshot?.availability, "booked");
  assert.equal(bookedDeskSnapshot?.isMine, true);
  assert.equal("userId" in (bookedDeskSnapshot ?? {}), false);
  assert.ok(communityAuthenticated.body?.myBookings?.length >= 2);
  pass("community_booking_snapshot_preserves_privacy");

  const accessRequest = await request(
    "/api/miniapp/community/access-requests",
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        contact: "miniapp_verify",
        note: "自动化验收门禁申领",
      }),
    },
  );
  assert.equal(accessRequest.response.status, 201);
  assert.equal(accessRequest.body?.accessRequest?.status, "submitted");
  const duplicateAccessRequest = await request(
    "/api/miniapp/community/access-requests",
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ contact: "miniapp_verify" }),
    },
  );
  assert.equal(duplicateAccessRequest.response.status, 200);
  assert.equal(
    duplicateAccessRequest.body?.accessRequest?.id,
    accessRequest.body?.accessRequest?.id,
  );
  pass("community_access_request_recorded_once");

  for (const bookingId of [
    deskBooking.body.booking.id,
    meetingBooking.body.booking.id,
  ]) {
    const cancelled = await request(
      `/api/miniapp/community/bookings/${encodeURIComponent(bookingId)}`,
      { method: "DELETE", headers: authHeaders },
    );
    assert.equal(cancelled.response.status, 200);
    assert.equal(cancelled.body?.booking?.status, "cancelled");
  }
  pass("community_bookings_cancelled");

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
    new Blob([png], { type: "application/octet-stream" }),
    "avatar.tmp",
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
  pass("avatar_with_unknown_mime_uploaded");

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

  const draftSlug = `miniapp-verify-draft-${randomUUID()}`;
  const { data: draftEvent, error: createDraftEventError } = await supabase
    .from("events")
    .insert({
      slug: draftSlug,
      title: "小程序管理员草稿预览活动",
      summary: "仅用于验证管理员草稿预览，完成后自动删除。",
      status: "draft",
      event_type: "community",
      registration_mode: "instant",
      registration_capacity: 12,
      event_at: new Date(Date.now() + 72 * 60 * 60 * 1_000).toISOString(),
      city: "常州",
      venue: "自动化测试场地",
    })
    .select("id, slug")
    .single();
  if (createDraftEventError) throw createDraftEventError;
  temporaryDraftEventId = draftEvent.id;

  const publicDraftCatalog = await request("/api/miniapp/events?mode=draft");
  assert.equal(publicDraftCatalog.response.status, 200);
  assert.equal(publicDraftCatalog.body?.canPreviewDrafts, false);
  assert.equal(
    publicDraftCatalog.body?.events?.some((item) => item.id === draftEvent.id),
    false,
  );
  const publicDraftDetail = await request(
    `/api/miniapp/events/${encodeURIComponent(draftEvent.slug)}`,
  );
  assert.equal(publicDraftDetail.response.status, 404);
  pass("event_draft_hidden_from_public");

  const { error: promoteAdminError } = await supabase
    .from("members")
    .update({ status: "admin" })
    .eq("id", userId);
  if (promoteAdminError) throw promoteAdminError;
  const adminDraftCatalog = await request(
    "/api/miniapp/events?mode=draft&limit=20",
    { headers: authHeaders },
  );
  assert.equal(adminDraftCatalog.response.status, 200);
  assert.equal(adminDraftCatalog.body?.canPreviewDrafts, true);
  assert.equal(adminDraftCatalog.body?.mode, "draft");
  const draftSummary = adminDraftCatalog.body?.events?.find(
    (item) => item.id === draftEvent.id,
  );
  assert.equal(draftSummary?.id, draftEvent.id);
  assert.equal(draftSummary?.registration_capacity, 12);
  const adminDraftDetail = await request(
    `/api/miniapp/events/${encodeURIComponent(draftEvent.slug)}`,
    { headers: authHeaders },
  );
  assert.equal(adminDraftDetail.response.status, 200);
  assert.equal(adminDraftDetail.body?.event?.status, "draft");
  pass("event_draft_visible_to_admin");

  const { error: restoreMemberStatusError } = await supabase
    .from("members")
    .update({ status: "active" })
    .eq("id", userId);
  if (restoreMemberStatusError) throw restoreMemberStatusError;

  eventGroupQrPath = `event-private-assets/events/${event.slug}/group-qr/verification.png`;
  await cos.putObject({
    Bucket: cosBucket,
    Region: cosRegion,
    Key: eventGroupQrPath,
    Body: png,
    ContentType: "image/png",
    CacheControl: "private, max-age=300",
    ACL: "private",
  });
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

  const taggedMemberPool = await request(
    `/api/miniapp/members?query=${encodeURIComponent("体验版测试用户")}`,
  );
  assert.equal(taggedMemberPool.response.status, 200);
  const taggedMember = taggedMemberPool.body?.members?.find(
    (member) => member.id === userId,
  );
  assert.ok(taggedMember);
  assert.deepEqual(taggedMember.communityTags, ["验收徽章"]);
  assert.equal("badgeAwards" in taggedMember, false);
  assert.equal("badgeDescriptions" in taggedMember, false);
  pass("member_pool_public_community_tags_loaded");

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

  const registrationWithoutPortraitConsent = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        note: "未同意影像授权",
        registrationConsentAccepted: true,
        portraitConsentAccepted: false,
        registrationConsentVersion: eventRegistrationConsentVersion,
        portraitConsentVersion: eventPortraitConsentVersion,
      }),
    },
  );
  assert.equal(registrationWithoutPortraitConsent.response.status, 400);
  assert.equal(
    registrationWithoutPortraitConsent.body?.error,
    "portrait_consent_required",
  );
  pass("event_registration_requires_portrait_consent");

  const reviewRegistrationWithoutNote = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        note: "   ",
        registrationConsentAccepted: true,
        portraitConsentAccepted: true,
        registrationConsentVersion: eventRegistrationConsentVersion,
        portraitConsentVersion: eventPortraitConsentVersion,
      }),
    },
  );
  assert.equal(reviewRegistrationWithoutNote.response.status, 400);
  assert.equal(
    reviewRegistrationWithoutNote.body?.error,
    "registration_note_required",
  );
  pass("event_review_registration_requires_note");

  const { error: defaultNameUpdateError } = await supabase
    .from("profiles")
    .update({ display_name: "微信用户" })
    .eq("id", userId);
  if (defaultNameUpdateError) throw defaultNameUpdateError;
  const defaultNameRegistration = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({
        note: "默认昵称不应允许报名",
        registrationConsentAccepted: true,
        portraitConsentAccepted: true,
        registrationConsentVersion: eventRegistrationConsentVersion,
        portraitConsentVersion: eventPortraitConsentVersion,
      }),
    },
  );
  assert.equal(defaultNameRegistration.response.status, 409);
  assert.equal(defaultNameRegistration.body?.error, "profile_incomplete");
  const { error: displayNameRestoreError } = await supabase
    .from("profiles")
    .update({ display_name: "体验版测试用户" })
    .eq("id", userId);
  if (displayNameRestoreError) throw displayNameRestoreError;
  pass("event_registration_rejects_default_display_name");

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

  const registrationGet = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/registration`,
    { headers: authHeaders },
  );
  assert.equal(registrationGet.response.status, 200);
  assert.equal(registrationGet.body?.registration?.status, "registered");
  pass("event_registration_status_loaded");

  const { error: hideConfirmedParticipantError } = await supabase
    .from("members")
    .update({ is_publicly_visible: false })
    .eq("id", userId);
  if (hideConfirmedParticipantError) throw hideConfirmedParticipantError;

  const eventWithParticipants = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}`,
  );
  assert.equal(eventWithParticipants.response.status, 200);
  assert.equal(eventWithParticipants.body?.event?.confirmedCount, 1);
  assert.equal(eventWithParticipants.body?.event?.participants?.length, 1);
  assert.equal(
    eventWithParticipants.body?.event?.participants?.[0]?.displayName,
    "体验版测试用户",
  );
  assert.equal(
    "wechat" in (eventWithParticipants.body?.event?.participants?.[0] ?? {}),
    false,
  );

  const eventScopedProfile = await request(
    `/api/miniapp/members/${encodeURIComponent(userId)}?event=${encodeURIComponent(event.slug)}`,
  );
  assert.equal(eventScopedProfile.response.status, 200);
  assert.equal(eventScopedProfile.body?.profile?.displayName, "体验版测试用户");
  assert.equal("wechat" in (eventScopedProfile.body?.profile ?? {}), false);
  pass("confirmed_participant_visible_with_event_profile");

  const directHiddenProfile = await request(
    `/api/miniapp/members/${encodeURIComponent(userId)}`,
  );
  assert.equal(directHiddenProfile.response.status, 404);
  pass("event_profile_access_does_not_publish_member_globally");

  const eventPreview = await waitForUpcomingEventPreview(event.id);
  assert.equal(eventPreview?.confirmed_count, 1);
  assert.equal(eventPreview?.participant_preview?.length, 1);
  pass("event_card_participant_preview_loaded");

  const { error: restoreConfirmedParticipantError } = await supabase
    .from("members")
    .update({ is_publicly_visible: true })
    .eq("id", userId);
  if (restoreConfirmedParticipantError) throw restoreConfirmedParticipantError;

  const confirmedGroupQr = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/group-qr`,
    { headers: authHeaders },
  );
  assert.equal(confirmedGroupQr.response.status, 200);
  assert.equal(confirmedGroupQr.body?.groupQr?.note, "自动化验收入群说明");
  const groupQrImageUrl = confirmedGroupQr.body?.groupQr?.imageUrl ?? "";
  const groupQrImageLocation = new URL(groupQrImageUrl);
  assert.match(
    groupQrImageLocation.pathname,
    /^\/api\/private-assets\/event-group-qr\//,
  );
  assert.ok(groupQrImageLocation.searchParams.has("expires"));
  assert.ok(groupQrImageLocation.searchParams.has("signature"));
  const groupQrImage = await fetch(groupQrImageUrl, {
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(groupQrImage.status, 200);
  assert.match(groupQrImage.headers.get("content-type") ?? "", /^image\//);
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
  assert.equal(registrationDelete.response.status, 409);
  assert.equal(
    registrationDelete.body?.error,
    "registration_locked_after_checkin",
  );
  pass("event_registration_locked_after_checkin");

  const eventAfterLockedCancellation = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}`,
  );
  assert.equal(eventAfterLockedCancellation.response.status, 200);
  assert.equal(eventAfterLockedCancellation.body?.event?.confirmedCount, 1);
  assert.equal(eventAfterLockedCancellation.body?.event?.participants?.length, 1);
  pass("checked_in_participant_remains_confirmed");

  const checkedInGroupQr = await request(
    `/api/miniapp/events/${encodeURIComponent(event.slug)}/group-qr`,
    { headers: authHeaders },
  );
  assert.equal(checkedInGroupQr.response.status, 200);
  pass("event_group_qr_retained_after_locked_cancellation");

  const { data: portraitConsentAfterLock, error: portraitConsentLoadError } =
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
  assert.ok(portraitConsentAfterLock);
  pass("event_portrait_consent_retained_after_locked_cancellation");

  if (reminder.body?.available && reminder.body?.templateId) {
    const { data: checkedInReminder, error: checkedInReminderError } =
      await supabase
        .from("miniapp_event_subscriptions")
        .select("id, status")
        .eq("user_id", userId)
        .eq("event_id", event.id)
        .eq("template_id", reminder.body.templateId)
        .maybeSingle();
    if (checkedInReminderError) throw checkedInReminderError;
    assert.notEqual(checkedInReminder?.status, "cancelled");
    pass("reminder_retained_after_locked_cancellation");
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

  const completedWaitlistSlug = `miniapp-verify-waitlist-${randomUUID()}`;
  const { data: completedWaitlistEvent, error: completedWaitlistEventError } =
    await supabase
      .from("events")
      .insert({
        slug: completedWaitlistSlug,
        title: "小程序已结束候补状态验收活动",
        status: "completed",
        event_type: "community",
        registration_mode: "instant",
        event_at: new Date(Date.now() - 60 * 60 * 1_000).toISOString(),
        city: "常州",
      })
      .select("id")
      .single();
  if (completedWaitlistEventError) throw completedWaitlistEventError;
  temporaryCompletedWaitlistEventId = completedWaitlistEvent.id;

  const { error: completedWaitlistRegistrationError } = await supabase
    .from("event_registrations")
    .insert({
      event_id: completedWaitlistEvent.id,
      user_id: userId,
      status: "waitlisted",
    });
  if (completedWaitlistRegistrationError) {
    throw completedWaitlistRegistrationError;
  }

  const completedWaitlistSnapshot = await request("/api/miniapp/auth/me", {
    headers: authHeaders,
  });
  assert.equal(completedWaitlistSnapshot.response.status, 200);
  const completedWaitlistFootprint =
    completedWaitlistSnapshot.body?.user?.footprints?.find(
      (footprint) => footprint.id === completedWaitlistEvent.id,
    );
  assert.equal(completedWaitlistFootprint?.participationLabel, "候补结束");
  assert.equal(completedWaitlistFootprint?.participationTone, "completed");
  pass("completed_event_waitlist_status_not_active");

  const analytics = await request("/api/miniapp/analytics", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventName: "community_view",
      pagePath: "/pages/community/index",
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
    await cos.deleteObject({
      Bucket: cosBucket,
      Region: cosRegion,
      Key: eventGroupQrPath,
    });
  }
  if (avatarPath) {
    await cos.deleteObject({
      Bucket: cosBucket,
      Region: cosRegion,
      Key: `member-avatars/${avatarPath}`,
    });
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
  if (temporaryDraftEventId) {
    await supabase.from("events").delete().eq("id", temporaryDraftEventId);
  }
  if (temporaryCompletedWaitlistEventId) {
    await supabase
      .from("events")
      .delete()
      .eq("id", temporaryCompletedWaitlistEventId);
  }
}
