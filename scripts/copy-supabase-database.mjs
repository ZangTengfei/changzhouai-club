import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const PAGE_SIZE = 1000;
const DEFAULT_AUTH_PASSWORD_BYTES = 24;

const PUBLIC_TABLES = [
  { name: "profiles", conflict: "id" },
  { name: "members", conflict: "id" },
  { name: "user_identities", conflict: "id" },
  { name: "events", conflict: "id" },
  { name: "event_photos", conflict: "id" },
  { name: "event_registrations", conflict: "id" },
  { name: "event_attendance", conflict: "id" },
  { name: "talks", conflict: "id" },
  { name: "cooperation_leads", conflict: "id" },
  { name: "cooperation_lead_matches", conflict: "id" },
  { name: "community_join_requests", conflict: "id" },
  { name: "member_works", conflict: "id" },
  { name: "community_wechat_qr_codes", conflict: "id" },
  { name: "community_updates", conflict: "id" },
  { name: "community_update_images", conflict: "id" },
  { name: "community_update_likes", conflict: "update_id,user_id" },
  { name: "project_opportunities", conflict: "id" },
  { name: "project_applications", conflict: "id" },
  { name: "sponsors", conflict: "id" },
  { name: "sponsor_images", conflict: "id" },
];

function parseArgs(argv) {
  const options = {
    dryRun: false,
    replace: false,
    skipAuth: false,
    skipTables: new Set(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--replace") {
      options.replace = true;
      continue;
    }

    if (arg === "--skip-auth") {
      options.skipAuth = true;
      continue;
    }

    if (arg === "--skip-table") {
      const tableName = argv[index + 1]?.trim();

      if (!tableName) {
        throw new Error("--skip-table requires a table name.");
      }

      options.skipTables.add(tableName);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function createSupabaseClient(prefix) {
  const url = getRequiredEnv(`${prefix}_SUPABASE_URL`);
  const serviceRoleKey = getRequiredEnv(`${prefix}_SUPABASE_SERVICE_ROLE_KEY`);

  return {
    url: trimTrailingSlash(url),
    client: createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  };
}

function getConflictColumns(table) {
  return table.conflict.split(",").map((column) => column.trim()).filter(Boolean);
}

function rewriteValue(value, replacements) {
  if (typeof value === "string") {
    return replacements.reduce(
      (currentValue, [from, to]) => currentValue.split(from).join(to),
      value,
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteValue(item, replacements));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rewriteValue(item, replacements)]),
    );
  }

  return value;
}

function rewriteRows(rows, replacements) {
  if (replacements.length === 0) {
    return rows;
  }

  return rows.map((row) => rewriteValue(row, replacements));
}

async function listAuthUsers(client) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    users.push(...(data.users ?? []));

    if (!data.nextPage) {
      break;
    }

    page = data.nextPage;
  }

  return users;
}

function makeAuthCreateAttributes(user) {
  const email = typeof user.email === "string" && user.email.trim()
    ? user.email.trim()
    : undefined;
  const phone = typeof user.phone === "string" && user.phone.trim()
    ? user.phone.trim()
    : undefined;

  const attributes = {
    id: user.id,
    password: randomBytes(DEFAULT_AUTH_PASSWORD_BYTES).toString("base64url"),
    email_confirm: Boolean(user.email_confirmed_at),
    phone_confirm: Boolean(user.phone_confirmed_at),
    user_metadata: user.user_metadata ?? {},
    app_metadata: user.app_metadata ?? {},
    role: user.role ?? "authenticated",
  };

  if (email) {
    attributes.email = email;
  } else if (phone) {
    attributes.phone = phone;
  } else {
    attributes.email = `user-${user.id}@local.invalid`;
    attributes.email_confirm = true;
  }

  return attributes;
}

async function deleteTargetAuthUsers(targetClient) {
  const users = await listAuthUsers(targetClient);

  for (const user of users) {
    const { error } = await targetClient.auth.admin.deleteUser(user.id, false);

    if (error) {
      throw new Error(`Failed to delete target auth user ${user.id}: ${error.message}`);
    }
  }

  return users.length;
}

async function copyAuthUsers(sourceClient, targetClient, options) {
  const sourceUsers = await listAuthUsers(sourceClient);
  const targetUsers = options.replace ? [] : await listAuthUsers(targetClient);
  const targetIds = new Set(targetUsers.map((user) => user.id));
  let created = 0;
  let updated = 0;

  for (const user of sourceUsers) {
    if (options.dryRun) {
      if (targetIds.has(user.id)) {
        updated += 1;
      } else {
        created += 1;
      }

      continue;
    }

    if (targetIds.has(user.id)) {
      const { error } = await targetClient.auth.admin.updateUserById(user.id, {
        email: user.email || undefined,
        phone: user.phone || undefined,
        email_confirm: Boolean(user.email_confirmed_at),
        phone_confirm: Boolean(user.phone_confirmed_at),
        user_metadata: user.user_metadata ?? {},
        app_metadata: user.app_metadata ?? {},
        role: user.role ?? "authenticated",
      });

      if (error) {
        throw new Error(`Failed to update target auth user ${user.id}: ${error.message}`);
      }

      updated += 1;
      continue;
    }

    const { error } = await targetClient.auth.admin.createUser(makeAuthCreateAttributes(user));

    if (error) {
      throw new Error(`Failed to create target auth user ${user.id}: ${error.message}`);
    }

    created += 1;
  }

  return {
    source: sourceUsers.length,
    created,
    updated,
  };
}

async function fetchTableRows(client, table) {
  const rows = [];
  const conflictColumns = getConflictColumns(table);
  let from = 0;

  while (true) {
    let query = client
      .from(table.name)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);

    for (const column of conflictColumns) {
      query = query.order(column, { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${table.name}: ${error.message}`);
    }

    const batch = data ?? [];
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

async function deleteTableRows(client, table) {
  const [firstConflictColumn] = getConflictColumns(table);
  const { error } = await client
    .from(table.name)
    .delete()
    .not(firstConflictColumn, "is", null);

  if (error) {
    throw new Error(`Failed to clear ${table.name}: ${error.message}`);
  }
}

async function upsertTableRows(client, table, rows) {
  let copied = 0;

  for (let index = 0; index < rows.length; index += PAGE_SIZE) {
    const batch = rows.slice(index, index + PAGE_SIZE);

    if (batch.length === 0) {
      continue;
    }

    const { error } = await client
      .from(table.name)
      .upsert(batch, {
        onConflict: table.conflict,
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to upsert ${table.name}: ${error.message}`);
    }

    copied += batch.length;
  }

  return copied;
}

async function clearPublicTables(targetClient, tables, options) {
  const clearedTables = [];

  for (const table of [...tables].reverse()) {
    if (options.skipTables.has(table.name)) {
      continue;
    }

    if (!options.dryRun) {
      await deleteTableRows(targetClient, table);
    }

    clearedTables.push(table.name);
  }

  return clearedTables;
}

async function copyPublicTables(sourceClient, targetClient, tables, replacements, options) {
  const results = [];

  for (const table of tables) {
    if (options.skipTables.has(table.name)) {
      results.push({
        table: table.name,
        source: 0,
        copied: 0,
        skipped: true,
      });
      continue;
    }

    const sourceRows = await fetchTableRows(sourceClient, table);
    const rewrittenRows = rewriteRows(sourceRows, replacements);
    const copied = options.dryRun
      ? rewrittenRows.length
      : await upsertTableRows(targetClient, table, rewrittenRows);

    results.push({
      table: table.name,
      source: sourceRows.length,
      copied,
      skipped: false,
    });
  }

  return results;
}

function formatTable(results) {
  const width = Math.max(...results.map((result) => result.table.length), "table".length);
  const lines = [
    `${"table".padEnd(width)}  source  copied`,
    `${"-".repeat(width)}  ------  ------`,
  ];

  for (const result of results) {
    const copied = result.skipped ? "skip" : String(result.copied);
    lines.push(
      `${result.table.padEnd(width)}  ${String(result.source).padStart(6)}  ${copied.padStart(6)}`,
    );
  }

  return lines.join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const source = createSupabaseClient("SOURCE");
  const target = createSupabaseClient("TARGET");
  const targetPublicUrl = trimTrailingSlash(
    process.env.TARGET_PUBLIC_SUPABASE_URL?.trim() || target.url,
  );
  const replacements = source.url === targetPublicUrl
    ? []
    : [[source.url, targetPublicUrl]];

  console.log(`Source: ${source.url}`);
  console.log(`Target: ${target.url}`);

  if (targetPublicUrl !== target.url) {
    console.log(`Target public URL rewrite: ${targetPublicUrl}`);
  }

  if (options.dryRun) {
    console.log("Mode: dry run");
  }

  if (options.replace) {
    console.log("Clearing target public tables...");
    const clearedTables = await clearPublicTables(target.client, PUBLIC_TABLES, options);
    console.log(`Cleared public tables: ${clearedTables.length}`);

    if (!options.skipAuth) {
      console.log("Clearing target auth users...");
      const deletedUsers = options.dryRun ? (await listAuthUsers(target.client)).length : await deleteTargetAuthUsers(target.client);
      console.log(`Deleted auth users: ${deletedUsers}`);
    }
  }

  if (!options.skipAuth) {
    console.log("Copying auth users...");
    const authResult = await copyAuthUsers(source.client, target.client, options);
    console.log(
      `Auth users: source=${authResult.source}, created=${authResult.created}, updated=${authResult.updated}`,
    );
  }

  console.log("Copying public tables...");
  const tableResults = await copyPublicTables(
    source.client,
    target.client,
    PUBLIC_TABLES,
    replacements,
    options,
  );

  console.log(formatTable(tableResults));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
