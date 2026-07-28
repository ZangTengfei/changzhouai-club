import { createHash, randomBytes } from "crypto";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { resolveCommunityUserId } from "@/lib/community-user";

const RECOVERY_TTL_MS = 15 * 60 * 1_000;

type RecoveryIntentRow = {
  id: string;
  source_user_id: string;
  target_email_hash: string;
  target_user_id: string | null;
  expires_at: string;
  consumed_at: string | null;
};

type RecoveryProfile = {
  display_name: string | null;
  avatar_url: string | null;
  wechat: string | null;
};

export type AccountRecoveryPreview = {
  intentId: string;
  sourceUserId: string;
  targetUserId: string;
  targetEmail: string;
  sourceProfile: RecoveryProfile;
  targetProfile: RecoveryProfile;
  sourceCounts: {
    registrations: number;
    works: number;
  };
  targetCounts: {
    registrations: number;
    works: number;
  };
};

type RecoveryPreviewOptions = {
  expectedSourceUserId?: string;
};

export function normalizeRecoveryEmail(value: string) {
  return value.trim().toLowerCase();
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createRecoveryToken() {
  return randomBytes(32).toString("base64url");
}

export function getRecoveryExpiry() {
  return new Date(Date.now() + RECOVERY_TTL_MS).toISOString();
}

export function isWechatAuthUser(user: User) {
  return Boolean(
    user.identities?.some((identity) => identity.provider === "custom:wechat"),
  );
}

export function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) {
    return "已验证邮箱";
  }

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${"*".repeat(Math.max(2, localPart.length - visible.length))}@${domain}`;
}

export async function isMiniappAccountRecoveryAvailable(
  admin: SupabaseClient,
  userId: string,
) {
  const [canonicalUserId, identityResult, mergeAuditResult] =
    await Promise.all([
      resolveCommunityUserId(admin, userId),
      admin
        .from("user_identities")
        .select("user_id")
        .eq("user_id", userId)
        .eq("provider", "wechat")
        .limit(1)
        .maybeSingle(),
      admin
        .from("account_merge_audits")
        .select("id", { count: "exact", head: true })
        .or(`source_user_id.eq.${userId},target_user_id.eq.${userId}`),
    ]);

  if (identityResult.error || mergeAuditResult.error) {
    throw new Error("recovery_availability_failed");
  }

  return Boolean(
    canonicalUserId === userId &&
      identityResult.data &&
      (mergeAuditResult.count ?? 0) === 0,
  );
}

async function loadRecoveryIntent(
  admin: SupabaseClient,
  recoveryToken: string,
) {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(recoveryToken)) {
    throw new Error("invalid_recovery_intent");
  }

  const { data, error } = await admin
    .from("account_recovery_intents")
    .select(
      "id, source_user_id, target_email_hash, target_user_id, expires_at, consumed_at",
    )
    .eq("token_hash", sha256Hex(recoveryToken))
    .maybeSingle<RecoveryIntentRow>();

  if (error || !data) {
    throw new Error("invalid_recovery_intent");
  }

  if (data.consumed_at) {
    throw new Error("recovery_intent_consumed");
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    throw new Error("recovery_intent_expired");
  }

  return data;
}

export async function assertAccountRecoveryIntentSource(
  admin: SupabaseClient,
  recoveryToken: string,
  sourceUserId: string,
) {
  const intent = await loadRecoveryIntent(admin, recoveryToken);
  if (intent.source_user_id !== sourceUserId) {
    throw new Error("recovery_source_mismatch");
  }

  return intent;
}

async function loadProfile(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin
    .from("profiles")
    .select("display_name, avatar_url, wechat")
    .eq("id", userId)
    .maybeSingle<RecoveryProfile>();

  if (error) {
    throw new Error("recovery_profile_load_failed");
  }

  return data ?? { display_name: null, avatar_url: null, wechat: null };
}

async function loadOwnedCounts(admin: SupabaseClient, userId: string) {
  const [registrations, works] = await Promise.all([
    admin
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("member_works")
      .select("id", { count: "exact", head: true })
      .eq("member_id", userId),
  ]);

  if (registrations.error || works.error) {
    throw new Error("recovery_counts_load_failed");
  }

  return {
    registrations: registrations.count ?? 0,
    works: works.count ?? 0,
  };
}

export async function loadAccountRecoveryPreview(
  admin: SupabaseClient,
  recoveryToken: string,
  targetUser: User,
  options: RecoveryPreviewOptions = {},
): Promise<AccountRecoveryPreview> {
  const intent = await loadRecoveryIntent(admin, recoveryToken);
  const targetEmail = normalizeRecoveryEmail(targetUser.email ?? "");

  if (
    (options.expectedSourceUserId &&
      intent.source_user_id !== options.expectedSourceUserId) ||
    !targetEmail ||
    !targetUser.email_confirmed_at ||
    sha256Hex(targetEmail) !== intent.target_email_hash ||
    targetUser.id === intent.source_user_id
  ) {
    throw new Error("recovery_target_mismatch");
  }

  const [canonicalTargetId, sourceUserResult, miniappIdentityResult] =
    await Promise.all([
      resolveCommunityUserId(admin, targetUser.id),
      admin.auth.admin.getUserById(intent.source_user_id),
      admin
        .from("user_identities")
        .select("user_id")
        .eq("user_id", intent.source_user_id)
        .eq("provider", "wechat")
        .limit(1)
        .maybeSingle(),
    ]);

  if (
    canonicalTargetId !== targetUser.id ||
    sourceUserResult.error ||
    !sourceUserResult.data.user ||
    miniappIdentityResult.error ||
    (!isWechatAuthUser(sourceUserResult.data.user) &&
      !miniappIdentityResult.data)
  ) {
    throw new Error("recovery_accounts_not_mergeable");
  }

  const [sourceProfile, targetProfile, sourceCounts, targetCounts] =
    await Promise.all([
      loadProfile(admin, intent.source_user_id),
      loadProfile(admin, targetUser.id),
      loadOwnedCounts(admin, intent.source_user_id),
      loadOwnedCounts(admin, targetUser.id),
    ]);

  return {
    intentId: intent.id,
    sourceUserId: intent.source_user_id,
    targetUserId: targetUser.id,
    targetEmail: maskEmail(targetEmail),
    sourceProfile,
    targetProfile,
    sourceCounts,
    targetCounts,
  };
}

export async function bindRecoveryIntentTarget(
  admin: SupabaseClient,
  recoveryToken: string,
  targetUser: User,
  options: RecoveryPreviewOptions = {},
) {
  const preview = await loadAccountRecoveryPreview(
    admin,
    recoveryToken,
    targetUser,
    options,
  );
  const { error } = await admin
    .from("account_recovery_intents")
    .update({ target_user_id: targetUser.id })
    .eq("id", preview.intentId)
    .is("consumed_at", null);

  if (error) {
    throw new Error("recovery_intent_bind_failed");
  }

  return preview;
}

export async function loadBoundAccountRecoveryPreview(
  admin: SupabaseClient,
  recoveryToken: string,
  sourceUserId: string,
) {
  const intent = await loadRecoveryIntent(admin, recoveryToken);
  if (intent.source_user_id !== sourceUserId || !intent.target_user_id) {
    throw new Error("recovery_target_mismatch");
  }

  const { data, error } = await admin.auth.admin.getUserById(
    intent.target_user_id,
  );
  if (error || !data.user) {
    throw new Error("recovery_target_not_found");
  }

  return loadAccountRecoveryPreview(admin, recoveryToken, data.user, {
    expectedSourceUserId: sourceUserId,
  });
}

export async function loadCompletedAccountRecoveryTarget(
  admin: SupabaseClient,
  recoveryToken: string,
  currentUserId: string,
) {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(recoveryToken)) {
    return null;
  }

  const { data, error } = await admin
    .from("account_recovery_intents")
    .select("target_user_id, consumed_at")
    .eq("token_hash", sha256Hex(recoveryToken))
    .maybeSingle<Pick<RecoveryIntentRow, "target_user_id" | "consumed_at">>();

  if (
    error ||
    !data?.consumed_at ||
    data.target_user_id !== currentUserId
  ) {
    return null;
  }

  return currentUserId;
}
