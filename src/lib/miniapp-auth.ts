import { createHash, randomBytes, randomUUID } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

const MINIAPP_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1_000;
const WECHAT_PROVIDER = "wechat";

type WechatChannel = "website" | "official_account" | "mini_program";

type IdentityRow = {
  user_id: string;
};

type UnionAccountRow = {
  user_id: string;
};

type MiniappSessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
};

export class MiniappAuthError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "MiniappAuthError";
  }
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function loadExactIdentity(
  supabase: SupabaseClient,
  appId: string,
  openid: string,
) {
  const { data, error } = await supabase
    .from("user_identities")
    .select("user_id")
    .eq("provider", WECHAT_PROVIDER)
    .eq("provider_app_id", appId)
    .eq("provider_user_id", openid)
    .maybeSingle<IdentityRow>();

  if (error) {
    throw new MiniappAuthError("identity_lookup_failed");
  }

  return data?.user_id ?? null;
}

async function loadUnionAccount(supabase: SupabaseClient, unionid: string) {
  const { data, error } = await supabase
    .from("wechat_union_accounts")
    .select("user_id")
    .eq("union_id", unionid)
    .maybeSingle<UnionAccountRow>();

  if (error) {
    throw new MiniappAuthError("union_account_lookup_failed");
  }

  return data?.user_id ?? null;
}

async function claimUnionAccount(
  supabase: SupabaseClient,
  unionid: string,
  userId: string,
  acceptExistingUser = false,
) {
  const existingUserId = await loadUnionAccount(supabase, unionid);

  if (existingUserId) {
    if (existingUserId !== userId && !acceptExistingUser) {
      throw new MiniappAuthError("wechat_identity_conflict");
    }

    return existingUserId;
  }

  const { error } = await supabase.from("wechat_union_accounts").insert({
    union_id: unionid,
    user_id: userId,
  });

  if (!error) {
    return userId;
  }

  if (error.code !== "23505") {
    throw new MiniappAuthError("union_account_claim_failed");
  }

  const claimedUserId = await loadUnionAccount(supabase, unionid);
  if (!claimedUserId) {
    throw new MiniappAuthError("union_account_claim_failed");
  }

  return claimedUserId;
}

async function saveWechatIdentity(
  supabase: SupabaseClient,
  input: {
    userId: string;
    appId: string;
    openid: string;
    unionid: string | null;
    channel: WechatChannel;
  },
) {
  const now = new Date().toISOString();
  const existingUserId = await loadExactIdentity(supabase, input.appId, input.openid);

  if (existingUserId) {
    if (existingUserId !== input.userId) {
      throw new MiniappAuthError("wechat_identity_conflict");
    }

    const identityUpdate: {
      provider_channel: WechatChannel;
      last_seen_at: string;
      provider_union_id?: string;
    } = {
      provider_channel: input.channel,
      last_seen_at: now,
    };

    if (input.unionid) {
      identityUpdate.provider_union_id = input.unionid;
    }

    const { error } = await supabase
      .from("user_identities")
      .update(identityUpdate)
      .eq("provider", WECHAT_PROVIDER)
      .eq("provider_app_id", input.appId)
      .eq("provider_user_id", input.openid)
      .eq("user_id", input.userId);

    if (error) {
      throw new MiniappAuthError("identity_save_failed");
    }

    return;
  }

  const { error } = await supabase.from("user_identities").insert({
    user_id: input.userId,
    provider: WECHAT_PROVIDER,
    provider_app_id: input.appId,
    provider_user_id: input.openid,
    provider_union_id: input.unionid,
    provider_channel: input.channel,
    identity_data: {},
    last_seen_at: now,
    linked_at: now,
  });

  if (!error) {
    return;
  }

  if (error.code !== "23505") {
    throw new MiniappAuthError("identity_save_failed");
  }

  const racedUserId = await loadExactIdentity(supabase, input.appId, input.openid);
  if (racedUserId !== input.userId) {
    throw new MiniappAuthError("wechat_identity_conflict");
  }
}

export async function linkWechatIdentityToCommunityUser(
  supabase: SupabaseClient,
  userId: string,
  input: {
    appId: string;
    openid: string;
    unionid: string;
    channel: WechatChannel;
  },
) {
  await claimUnionAccount(supabase, input.unionid, userId);
  await saveWechatIdentity(supabase, { ...input, userId });
}

async function createWechatAccountAnchor(supabase: SupabaseClient) {
  const internalEmail = `wechat-${randomUUID()}@users.invalid`;
  const { data, error } = await supabase.auth.admin.createUser({
    email: internalEmail,
    email_confirm: true,
    app_metadata: { account_anchor: "wechat_miniapp" },
    user_metadata: {
      name: "微信用户",
      full_name: "微信用户",
      account_anchor: "wechat_miniapp",
    },
  });

  if (error || !data.user) {
    throw new MiniappAuthError("account_create_failed");
  }

  const userId = data.user.id;
  const [{ error: linkError }, { error: profileError }] = await Promise.all([
    supabase.from("user_account_links").upsert(
      {
        auth_user_id: userId,
        canonical_user_id: userId,
        link_source: "self",
      },
      { onConflict: "auth_user_id" },
    ),
    supabase
      .from("profiles")
      .update({ email: null, display_name: "微信用户" })
      .eq("id", userId),
  ]);

  if (linkError || profileError) {
    await supabase.auth.admin.deleteUser(userId);
    throw new MiniappAuthError("account_bootstrap_failed");
  }

  return userId;
}

async function deleteWechatAccountAnchor(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Failed to clean up a duplicate WeChat account anchor.", {
      userId,
    });
  }
}

export async function resolveOrCreateWechatCommunityUser(
  supabase: SupabaseClient,
  input: {
    appId: string;
    openid: string;
    unionid: string | null;
    channel: WechatChannel;
  },
) {
  const exactUserId = await loadExactIdentity(supabase, input.appId, input.openid);

  if (exactUserId) {
    if (input.unionid) {
      await claimUnionAccount(supabase, input.unionid, exactUserId);
    }

    await saveWechatIdentity(supabase, { ...input, userId: exactUserId });
    return exactUserId;
  }

  if (input.unionid) {
    const unionUserId = await loadUnionAccount(supabase, input.unionid);

    if (unionUserId) {
      await saveWechatIdentity(supabase, { ...input, userId: unionUserId });
      return unionUserId;
    }
  }

  const createdUserId = await createWechatAccountAnchor(supabase);
  let canonicalUserId = createdUserId;

  try {
    if (input.unionid) {
      canonicalUserId = await claimUnionAccount(
        supabase,
        input.unionid,
        createdUserId,
        true,
      );
    }

    const racedIdentityUserId = await loadExactIdentity(
      supabase,
      input.appId,
      input.openid,
    );

    if (racedIdentityUserId) {
      if (input.unionid && racedIdentityUserId !== canonicalUserId) {
        throw new MiniappAuthError("wechat_identity_conflict");
      }

      canonicalUserId = racedIdentityUserId;
    } else {
      await saveWechatIdentity(supabase, { ...input, userId: canonicalUserId });
    }
  } catch (error) {
    await deleteWechatAccountAnchor(supabase, createdUserId);
    throw error;
  }

  if (canonicalUserId !== createdUserId) {
    await deleteWechatAccountAnchor(supabase, createdUserId);
  }

  return canonicalUserId;
}

export async function createMiniappSession(
  supabase: SupabaseClient,
  userId: string,
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + MINIAPP_SESSION_TTL_MS).toISOString();
  const { error } = await supabase.from("miniapp_sessions").insert({
    user_id: userId,
    token_hash: sha256Hex(token),
    expires_at: expiresAt,
  });

  if (error) {
    throw new MiniappAuthError("session_create_failed");
  }

  return { token, expiresAt };
}

export function getMiniappBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (token.length < 32 || token.length > 256) {
    return null;
  }

  return token;
}

export async function loadMiniappSession(
  supabase: SupabaseClient,
  request: Request,
) {
  const token = getMiniappBearerToken(request);
  if (!token) {
    return null;
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("miniapp_sessions")
    .select("id, user_id, expires_at")
    .eq("token_hash", sha256Hex(token))
    .is("revoked_at", null)
    .gt("expires_at", now)
    .maybeSingle<MiniappSessionRow>();

  if (error || !data) {
    return null;
  }

  void supabase
    .from("miniapp_sessions")
    .update({ last_seen_at: now })
    .eq("id", data.id);

  return data;
}

export async function revokeMiniappSession(
  supabase: SupabaseClient,
  sessionId: string,
) {
  const { error } = await supabase
    .from("miniapp_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("revoked_at", null);

  if (error) {
    throw new MiniappAuthError("session_revoke_failed");
  }
}

export async function loadMiniappAccountSnapshot(
  supabase: SupabaseClient,
  userId: string,
) {
  type FootprintEvent = {
    id: string;
    slug: string;
    title: string;
    event_at: string | null;
    venue: string | null;
    city: string | null;
    cover_image_url: string | null;
    status: string;
  };
  type RelatedEvent = FootprintEvent | FootprintEvent[] | null;
  type RegistrationRow = {
    id: string;
    event_id: string;
    status: string;
    created_at: string;
    events: RelatedEvent;
  };
  type AttendanceRow = {
    id: string;
    event_id: string;
    status: string;
    checked_in_at: string | null;
    created_at: string;
    events: RelatedEvent;
  };
  type BadgeAwardRow = {
    badge_code: string;
    label: string;
    description: string | null;
    source: string;
    awarded_at: string;
  };

  const [
    profileResult,
    memberResult,
    identityResult,
    registrationResult,
    attendanceResult,
    badgeResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, city, wechat, role_label, organization")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("members")
      .select("status, joined_at, is_co_builder")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_identities")
      .select("provider_channel, last_seen_at")
      .eq("user_id", userId)
      .eq("provider", WECHAT_PROVIDER),
    supabase
      .from("event_registrations")
      .select(
        "id, event_id, status, created_at, events(id, slug, title, event_at, venue, city, cover_image_url, status)",
      )
      .in("status", ["registered", "waitlisted"])
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("event_attendance")
      .select(
        "id, event_id, status, checked_in_at, created_at, events(id, slug, title, event_at, venue, city, cover_image_url, status)",
      )
      .in("status", ["attended", "late", "speaker"])
      .eq("user_id", userId)
      .order("checked_in_at", { ascending: false, nullsFirst: false })
      .limit(20),
    supabase
      .from("member_badge_awards")
      .select("badge_code, label, description, source, awarded_at")
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false }),
  ]);

  if (
    profileResult.error ||
    memberResult.error ||
    identityResult.error ||
    registrationResult.error ||
    attendanceResult.error ||
    badgeResult.error
  ) {
    throw new MiniappAuthError("account_snapshot_failed");
  }

  const profile = profileResult.data;
  const member = memberResult.data;
  const identities = identityResult.data;
  const registrations = (registrationResult.data ?? []) as RegistrationRow[];
  const attendances = (attendanceResult.data ?? []) as AttendanceRow[];
  const badgeAwards = (badgeResult.data ?? []) as BadgeAwardRow[];

  const channels = Array.from(
    new Set(
      (identities ?? [])
        .map((identity) => identity.provider_channel)
        .filter((channel): channel is string => Boolean(channel)),
    ),
  );
  const displayName = profile?.display_name?.trim() || "微信用户";
  const identityLabel =
    member?.status === "admin" || member?.status === "organizer"
      ? "社区主理人"
      : member?.is_co_builder
        ? "共建伙伴"
        : member?.status === "pending"
          ? "待确认成员"
          : member?.status === "paused"
            ? "暂停参与"
            : "社区成员";
  const attendanceCount = attendances.length;
  const hasSpeakerAttendance = attendances.some(
    (attendance) => attendance.status === "speaker",
  );
  const automaticBadges = [
    ...(member?.is_co_builder
      ? [
          {
            code: "co_builder",
            label: "共建伙伴",
            description: "持续参与社区建设与协作",
            source: "system",
            awardedAt: member.joined_at,
          },
        ]
      : []),
    ...(attendanceCount >= 1
      ? [
          {
            code: "first_meetup",
            label: "初见同行",
            description: "完成第一次线下活动签到",
            source: "system",
            awardedAt:
              attendances.at(-1)?.checked_in_at ?? member?.joined_at ?? null,
          },
        ]
      : []),
    ...(attendanceCount >= 3
      ? [
          {
            code: "frequent_participant",
            label: "常来常往",
            description: "已参加至少三场社区活动",
            source: "system",
            awardedAt:
              attendances[0]?.checked_in_at ?? member?.joined_at ?? null,
          },
        ]
      : []),
    ...(hasSpeakerAttendance
      ? [
          {
            code: "speaker",
            label: "分享嘉宾",
            description: "在社区活动中贡献过主题分享",
            source: "system",
            awardedAt:
              attendances.find((attendance) => attendance.status === "speaker")
                ?.checked_in_at ?? member?.joined_at ?? null,
          },
        ]
      : []),
  ];
  const badges = new Map(
    automaticBadges.map((badge) => [badge.code, badge]),
  );
  badgeAwards.forEach((badge) => {
    badges.set(badge.badge_code, {
      code: badge.badge_code,
      label: badge.label,
      description: badge.description ?? "社区授予的成员徽章",
      source: badge.source,
      awardedAt: badge.awarded_at,
    });
  });

  function readRelatedEvent(value: RelatedEvent) {
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }

  const footprints = new Map<
    string,
    FootprintEvent & {
      participationLabel: string;
      participationAt: string;
    }
  >();
  attendances.forEach((attendance) => {
    const event = readRelatedEvent(attendance.events);
    if (!event) return;
    footprints.set(event.id, {
      ...event,
      participationLabel:
        attendance.status === "speaker" ? "分享嘉宾" : "已参加",
      participationAt:
        attendance.checked_in_at ?? attendance.created_at ?? event.event_at ?? "",
    });
  });
  registrations.forEach((registration) => {
    const event = readRelatedEvent(registration.events);
    if (!event || footprints.has(event.id)) return;
    footprints.set(event.id, {
      ...event,
      participationLabel:
        registration.status === "waitlisted" ? "候补中" : "已报名",
      participationAt: registration.created_at ?? event.event_at ?? "",
    });
  });
  const recentFootprints = Array.from(footprints.values())
    .sort((left, right) =>
      right.participationAt.localeCompare(left.participationAt),
    )
    .slice(0, 6);

  return {
    id: userId,
    displayName,
    avatarUrl: profile?.avatar_url ?? null,
    city: profile?.city?.trim() || "常州",
    roleLabel: profile?.role_label?.trim() || null,
    organization: profile?.organization?.trim() || null,
    memberStatus: member?.status ?? "active",
    identityLabel,
    joinedAt: member?.joined_at ?? null,
    isCoBuilder: Boolean(member?.is_co_builder),
    profileComplete: Boolean(
      profile?.display_name?.trim() && profile?.wechat?.trim(),
    ),
    channels,
    stats: {
      registrationCount: registrations.length,
      attendanceCount,
      badgeCount: badges.size,
    },
    badges: Array.from(badges.values()),
    footprints: recentFootprints,
  };
}
