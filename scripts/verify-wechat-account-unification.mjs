import { createHash, randomUUID } from "node:crypto";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

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
const suffix = randomUUID();
const unionId = `test-union-${suffix}`;
const appId = `test-app-${suffix}`;
const tokenHash = createHash("sha256").update(suffix).digest("hex");
let sourceUserId;
let targetUserId;
let eventId;

function requireData(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data;
}

try {
  const target = requireData(
    await supabase.auth.admin.createUser({
      email: `wechat-target-${suffix}@users.invalid`,
      email_confirm: true,
      user_metadata: { name: "Website Target", full_name: "Website Target" },
    }),
    "create target",
  );
  targetUserId = target.user.id;

  const source = requireData(
    await supabase.auth.admin.createUser({
      email: `wechat-source-${suffix}@users.invalid`,
      email_confirm: true,
      app_metadata: { account_anchor: "wechat_miniapp" },
      user_metadata: { name: "Mini Source", full_name: "Mini Source" },
    }),
    "create source",
  );
  sourceUserId = source.user.id;

  requireData(
    await supabase
      .from("profiles")
      .update({
        display_name: "Website Target",
        avatar_url: "https://example.com/target.png",
        wechat: null,
        skills: ["website-skill"],
      })
      .eq("id", targetUserId),
    "seed target profile",
  );
  requireData(
    await supabase
      .from("profiles")
      .update({ wechat: "mini-wechat", skills: ["mini-skill"] })
      .eq("id", sourceUserId),
    "seed source profile",
  );

  const event = requireData(
    await supabase
      .from("events")
      .insert({
        slug: `wechat-link-test-${suffix}`,
        title: "Wechat link test",
        status: "scheduled",
        created_by: targetUserId,
      })
      .select("id")
      .single(),
    "create event",
  );
  eventId = event.id;

  const seeds = await Promise.all([
    supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: sourceUserId,
      status: "registered",
      note: "mini-note",
    }),
    supabase.from("miniapp_sessions").insert({
      user_id: sourceUserId,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    }),
    supabase
      .from("miniapp_consents")
      .insert({ user_id: sourceUserId, policy_version: "test-v1" }),
    supabase.from("miniapp_event_subscriptions").insert({
      user_id: sourceUserId,
      event_id: eventId,
      template_id: "test-template",
      status: "accepted",
    }),
    supabase.from("user_identities").insert({
      user_id: sourceUserId,
      provider: "wechat",
      provider_app_id: appId,
      provider_user_id: `openid-${suffix}`,
      provider_union_id: unionId,
      provider_channel: "mini_program",
    }),
    supabase
      .from("wechat_union_accounts")
      .insert({ union_id: unionId, user_id: sourceUserId }),
  ]);
  seeds.forEach((result, index) => requireData(result, `seed ${index + 1}`));

  requireData(
    await supabase.rpc("promote_miniapp_anchor_to_wechat_user", {
      source_user_id: sourceUserId,
      target_user_id: targetUserId,
    }),
    "promote",
  );

  const results = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,avatar_url,wechat,skills")
      .eq("id", targetUserId)
      .single(),
    supabase
      .from("event_registrations")
      .select("user_id,note")
      .eq("event_id", eventId)
      .single(),
    supabase
      .from("miniapp_sessions")
      .select("user_id")
      .eq("token_hash", tokenHash)
      .single(),
    supabase
      .from("miniapp_consents")
      .select("user_id")
      .eq("policy_version", "test-v1")
      .single(),
    supabase
      .from("miniapp_event_subscriptions")
      .select("user_id")
      .eq("event_id", eventId)
      .single(),
    supabase
      .from("user_identities")
      .select("user_id")
      .eq("provider_app_id", appId)
      .single(),
    supabase
      .from("wechat_union_accounts")
      .select("user_id")
      .eq("union_id", unionId)
      .single(),
    supabase
      .from("user_account_links")
      .select("canonical_user_id,link_source")
      .eq("auth_user_id", sourceUserId)
      .single(),
  ]);
  const [
    profile,
    registration,
    session,
    consent,
    subscription,
    identity,
    union,
    sourceLink,
  ] = results.map((result, index) =>
    requireData(result, `verify ${index + 1}`),
  );

  const checks = {
    websiteProfilePreserved:
      profile.display_name === "Website Target" &&
      profile.avatar_url === "https://example.com/target.png",
    missingProfileMerged:
      profile.wechat === "mini-wechat" &&
      profile.skills.includes("website-skill") &&
      profile.skills.includes("mini-skill"),
    registrationMoved:
      registration.user_id === targetUserId &&
      registration.note === "mini-note",
    sessionMoved: session.user_id === targetUserId,
    consentMoved: consent.user_id === targetUserId,
    subscriptionMoved: subscription.user_id === targetUserId,
    identityMoved: identity.user_id === targetUserId,
    unionMoved: union.user_id === targetUserId,
    sourceAliased:
      sourceLink.canonical_user_id === targetUserId &&
      sourceLink.link_source === "wechat_unionid",
  };

  if (Object.values(checks).some((passed) => !passed)) {
    throw new Error(`Verification failed: ${JSON.stringify(checks)}`);
  }

  console.log(JSON.stringify(checks, null, 2));
} finally {
  if (eventId) await supabase.from("events").delete().eq("id", eventId);
  if (sourceUserId) await supabase.auth.admin.deleteUser(sourceUserId);
  if (targetUserId) await supabase.auth.admin.deleteUser(targetUserId);
}
