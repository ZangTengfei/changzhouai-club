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

async function loadAllAuthUsers() {
  const users = [];
  const perPage = 1_000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`auth.users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < perPage) break;
  }

  return users;
}

async function loadAll(table, columns, configure = (query) => query) {
  const rows = [];
  const pageSize = 1_000;

  for (let offset = 0; ; offset += pageSize) {
    const query = configure(
      supabase
        .from(table)
        .select(columns)
        .range(offset, offset + pageSize - 1),
    );
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

const [identities, unionAccounts, accountLinks, sessions, authUsers] =
  await Promise.all([
    loadAll(
      "user_identities",
      "user_id, provider_union_id, provider_channel",
      (query) => query.eq("provider", "wechat"),
    ),
    loadAll("wechat_union_accounts", "union_id, user_id"),
    loadAll(
      "user_account_links",
      "auth_user_id, canonical_user_id, link_source",
    ),
    loadAll("miniapp_sessions", "user_id, expires_at, revoked_at", (query) =>
      query.is("revoked_at", null),
    ),
    loadAllAuthUsers(),
  ]);

const usersByUnionId = new Map();
const channelsByUser = new Map();
const channelCounts = {};

for (const identity of identities) {
  const channel = identity.provider_channel || "unknown";
  channelCounts[channel] = (channelCounts[channel] ?? 0) + 1;

  const channels = channelsByUser.get(identity.user_id) ?? new Set();
  channels.add(channel);
  channelsByUser.set(identity.user_id, channels);

  if (identity.provider_union_id) {
    const users = usersByUnionId.get(identity.provider_union_id) ?? new Set();
    users.add(identity.user_id);
    usersByUnionId.set(identity.provider_union_id, users);
  }
}

const unionConflicts = Array.from(usersByUnionId.values()).filter(
  (users) => users.size > 1,
).length;
const unionAccountMismatches = unionAccounts.filter((account) => {
  const identityUsers = usersByUnionId.get(account.union_id);
  return identityUsers && !identityUsers.has(account.user_id);
}).length;
const miniUsers = new Set(
  identities
    .filter((identity) => identity.provider_channel === "mini_program")
    .map((identity) => identity.user_id),
);
const linkedUsers = new Set(accountLinks.map((link) => link.auth_user_id));
const activeSessions = sessions.filter(
  (session) => new Date(session.expires_at).getTime() > Date.now(),
);
const websiteWechatIdentities = authUsers.flatMap((user) =>
  (user.identities ?? [])
    .filter((identity) => identity.provider === "custom:wechat")
    .map((identity) => ({
      userId: user.id,
      unionId:
        typeof identity.identity_data?.custom_claims?.unionid === "string"
          ? identity.identity_data.custom_claims.unionid
          : null,
    })),
);
const unionAccountByUnionId = new Map(
  unionAccounts.map((account) => [account.union_id, account.user_id]),
);
const canonicalByAuthUser = new Map(
  accountLinks.map((link) => [link.auth_user_id, link.canonical_user_id]),
);
const websiteWechatWithBusinessUnion = websiteWechatIdentities.filter(
  (identity) => identity.unionId && unionAccountByUnionId.has(identity.unionId),
);
const websiteWechatLinkedToCanonical = websiteWechatWithBusinessUnion.filter(
  (identity) => {
    const unionUserId = unionAccountByUnionId.get(identity.unionId);
    return (
      unionUserId === identity.userId &&
      canonicalByAuthUser.get(identity.userId) === identity.userId
    );
  },
);

console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      wechatIdentities: identities.length,
      identitiesByChannel: channelCounts,
      miniProgramUsers: miniUsers.size,
      usersWithMultipleWechatChannels: Array.from(
        channelsByUser.values(),
      ).filter((channels) => channels.size > 1).length,
      miniProgramUsersWithoutUnionId: new Set(
        identities
          .filter(
            (identity) =>
              identity.provider_channel === "mini_program" &&
              !identity.provider_union_id,
          )
          .map((identity) => identity.user_id),
      ).size,
      miniProgramUsersWithoutAccountLink: Array.from(miniUsers).filter(
        (userId) => !linkedUsers.has(userId),
      ).length,
      activeMiniappSessions: activeSessions.length,
      unionIdentityConflicts: unionConflicts,
      unionAccountMismatches,
      websiteWechatAuthIdentities: websiteWechatIdentities.length,
      websiteWechatAuthIdentitiesWithoutUnionId: websiteWechatIdentities.filter(
        (identity) => !identity.unionId,
      ).length,
      websiteWechatAuthIdentitiesWithBusinessUnion:
        websiteWechatWithBusinessUnion.length,
      websiteWechatAuthIdentitiesLinkedToCanonical:
        websiteWechatLinkedToCanonical.length,
    },
    null,
    2,
  ),
);

if (unionConflicts || unionAccountMismatches) {
  process.exitCode = 1;
}
