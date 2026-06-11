import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILE = ".env.local";
const CHANGZHOU_TIMEZONE_OFFSET = "+08:00";
const CONTACT_INFO_PATTERN = /(?:\+?86[-\s]?)?1[3-9]\d{9}/;
const DATETIME_LOCAL_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const OPPORTUNITY_TYPE_VALUES = new Set([
  "crowdsource",
  "project",
  "project_manager",
  "enterprise",
  "role",
  "idea",
]);
const STATUS_VALUES = new Set([
  "draft",
  "recruiting",
  "matching",
  "in_progress",
  "filled",
  "closed",
  "archived",
]);
const VISIBILITY_VALUES = new Set(["public", "members", "private"]);
const PROJECT_FIELDS = new Set([
  "title",
  "slug",
  "summary",
  "description",
  "opportunity_type",
  "status",
  "visibility",
  "role_tags",
  "topic_tags",
  "headcount_label",
  "time_commitment",
  "compensation",
  "deadline_at",
  "location",
  "application_cta",
  "application_note",
  "external_application_url",
  "application_requires_login",
  "source_lead_id",
  "owner_id",
  "sort_order",
  "is_featured",
]);
const PUBLIC_TEXT_FIELDS = [
  "title",
  "summary",
  "description",
  "headcount_label",
  "time_commitment",
  "compensation",
  "location",
  "application_cta",
  "application_note",
];

function printHelp() {
  console.log(`Publish a Changzhou AI Club project opportunity to Supabase.

Usage:
  node scripts/publish-project-opportunity.mjs --file output/project-publish/opportunity.json --dry-run
  node scripts/publish-project-opportunity.mjs --file output/project-publish/opportunity.json
  node scripts/publish-project-opportunity.mjs --stdin --dry-run

Options:
  --file <path>          Read project opportunity JSON from a file.
  --stdin                Read project opportunity JSON from stdin.
  --dry-run              Validate and print the normalized payload without writing.
  --upsert               Update an existing opportunity with the same slug, or insert it.
  --env-file <path>      Load environment variables from a file. Defaults to .env.local.
  --allow-contact-info   Allow phone-like contact info in public project fields.
  --help                 Show this help.

Required JSON fields:
  title, slug, summary

Common JSON fields:
  description, opportunity_type, status, visibility, role_tags, topic_tags,
  headcount_label, time_commitment, compensation, deadline_at, location,
  application_cta, application_note, external_application_url,
  application_requires_login, is_featured, sort_order
`);
}

function parseArgs(argv) {
  const options = {
    allowContactInfo: false,
    dryRun: false,
    envFile: DEFAULT_ENV_FILE,
    file: null,
    stdin: false,
    upsert: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--upsert") {
      options.upsert = true;
      continue;
    }

    if (arg === "--stdin") {
      options.stdin = true;
      continue;
    }

    if (arg === "--allow-contact-info") {
      options.allowContactInfo = true;
      continue;
    }

    if (arg === "--file") {
      const value = argv[index + 1]?.trim();

      if (!value) {
        throw new Error("--file requires a path.");
      }

      options.file = value;
      index += 1;
      continue;
    }

    if (arg === "--env-file") {
      const value = argv[index + 1]?.trim();

      if (!value) {
        throw new Error("--env-file requires a path.");
      }

      options.envFile = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.help && Boolean(options.file) === options.stdin) {
    throw new Error("Provide exactly one of --file or --stdin.");
  }

  return options;
}

function unquoteEnvValue(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1).replaceAll("\\n", "\n");
  }

  return trimmed;
}

function loadEnvFile(filePath) {
  if (!filePath || !existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = unquoteEnvValue(trimmed.slice(separatorIndex + 1));

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

async function readStdin() {
  let content = "";

  for await (const chunk of process.stdin) {
    content += chunk;
  }

  return content;
}

function getOptionalString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join("\n");
    return joined || null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function getParagraphField(value) {
  if (Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join("\n\n");
    return joined || null;
  }

  return getOptionalString(value);
}

function normalizeSlug(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeStringArray(value, fieldName) {
  if (value === null || value === undefined) {
    return [];
  }

  const rawItems = Array.isArray(value) ? value : String(value).split(/[、,，;；\n]/);
  const items = rawItems.map((item) => String(item).trim()).filter(Boolean);
  const seen = new Set();

  return items.filter((item) => {
    const key = item.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeOptionalUrlValue(value, fieldName) {
  const trimmed = getOptionalString(value);

  if (!trimmed) {
    return null;
  }

  let url;

  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${fieldName} must be a valid http(s) URL.`);
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${fieldName} must be a valid http(s) URL.`);
  }

  return url.toString();
}

function normalizeDateTime(value, fieldName) {
  const trimmed = getOptionalString(value);

  if (!trimmed) {
    return null;
  }

  if (TIMEZONE_SUFFIX_PATTERN.test(trimmed)) {
    return trimmed;
  }

  if (!DATETIME_LOCAL_PATTERN.test(trimmed)) {
    throw new Error(
      `${fieldName} must include date and time, for example 2026-06-25T23:59. Leave it empty if the time is not confirmed.`,
    );
  }

  const normalizedSeparator = trimmed.replace(" ", "T");
  const valueWithSeconds =
    normalizedSeparator.length === "YYYY-MM-DDTHH:mm".length
      ? `${normalizedSeparator}:00`
      : normalizedSeparator;

  return `${valueWithSeconds}${CHANGZHOU_TIMEZONE_OFFSET}`;
}

function normalizeUuid(value, fieldName) {
  const trimmed = getOptionalString(value);

  if (!trimmed) {
    return null;
  }

  if (!UUID_PATTERN.test(trimmed)) {
    throw new Error(`${fieldName} must be a UUID.`);
  }

  return trimmed;
}

function normalizeBoolean(value, defaultValue, fieldName) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes", "y", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`${fieldName} must be a boolean.`);
}

function normalizeInteger(value, defaultValue, fieldName) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  const number = Number(value);

  if (!Number.isInteger(number)) {
    throw new Error(`${fieldName} must be an integer.`);
  }

  return number;
}

function normalizeEnum(value, defaultValue, allowedValues, fieldName) {
  const normalized = getOptionalString(value) ?? defaultValue;

  if (!allowedValues.has(normalized)) {
    throw new Error(`${fieldName} must be one of: ${Array.from(allowedValues).join(", ")}`);
  }

  return normalized;
}

function assertNoUnknownFields(payload) {
  const unknownFields = Object.keys(payload).filter((key) => !PROJECT_FIELDS.has(key));

  if (unknownFields.length > 0) {
    throw new Error(`Unknown project opportunity JSON field(s): ${unknownFields.join(", ")}`);
  }
}

function assertNoContactInfo(payload, options) {
  if (options.allowContactInfo) {
    return;
  }

  const leakingFields = PUBLIC_TEXT_FIELDS.filter((fieldName) => {
    const value = payload[fieldName];

    if (value === null || value === undefined) {
      return false;
    }

    return CONTACT_INFO_PATTERN.test(Array.isArray(value) ? value.join("\n") : String(value));
  });

  if (leakingFields.length > 0) {
    throw new Error(
      `Phone-like contact info detected in public field(s): ${leakingFields.join(
        ", ",
      )}. Remove it or rerun with --allow-contact-info.`,
    );
  }
}

function normalizePayload(rawPayload, options) {
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    throw new Error("Project opportunity JSON must be an object.");
  }

  assertNoUnknownFields(rawPayload);
  assertNoContactInfo(rawPayload, options);

  const title = getOptionalString(rawPayload.title);
  const slug = normalizeSlug(rawPayload.slug);
  const summary = getOptionalString(rawPayload.summary);

  if (!title) {
    throw new Error("title is required.");
  }

  if (!slug) {
    throw new Error("slug is required. Use lowercase letters, numbers, and hyphens.");
  }

  if (!summary) {
    throw new Error("summary is required.");
  }

  return {
    title,
    slug,
    summary,
    description: getParagraphField(rawPayload.description),
    opportunity_type: normalizeEnum(
      rawPayload.opportunity_type,
      "project",
      OPPORTUNITY_TYPE_VALUES,
      "opportunity_type",
    ),
    status: normalizeEnum(rawPayload.status, "recruiting", STATUS_VALUES, "status"),
    visibility: normalizeEnum(rawPayload.visibility, "public", VISIBILITY_VALUES, "visibility"),
    role_tags: normalizeStringArray(rawPayload.role_tags, "role_tags"),
    topic_tags: normalizeStringArray(rawPayload.topic_tags, "topic_tags"),
    headcount_label: getOptionalString(rawPayload.headcount_label),
    time_commitment: getOptionalString(rawPayload.time_commitment),
    compensation: getOptionalString(rawPayload.compensation),
    deadline_at: normalizeDateTime(rawPayload.deadline_at, "deadline_at"),
    location: getOptionalString(rawPayload.location),
    application_cta: getOptionalString(rawPayload.application_cta),
    application_note: getOptionalString(rawPayload.application_note),
    external_application_url: normalizeOptionalUrlValue(
      rawPayload.external_application_url,
      "external_application_url",
    ),
    application_requires_login: normalizeBoolean(
      rawPayload.application_requires_login,
      false,
      "application_requires_login",
    ),
    source_lead_id: normalizeUuid(rawPayload.source_lead_id, "source_lead_id"),
    owner_id: normalizeUuid(rawPayload.owner_id, "owner_id"),
    sort_order: normalizeInteger(rawPayload.sort_order, 0, "sort_order"),
    is_featured: normalizeBoolean(rawPayload.is_featured, false, "is_featured"),
  };
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY.",
    );
  }

  return {
    serviceRoleKey,
    supabaseUrl,
  };
}

function buildPublicProjectPath(slug) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  const path = `/projects/${slug}`;

  if (!siteUrl) {
    return path;
  }

  return `${siteUrl.replace(/\/+$/, "")}${path}`;
}

async function writeProjectOpportunity(payload, options) {
  const { serviceRoleKey, supabaseUrl } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const createdBy =
    process.env.ADMIN_PROJECT_CREATED_BY ?? process.env.SUPABASE_ADMIN_USER_ID ?? null;
  const ownerId = payload.owner_id ?? process.env.ADMIN_PROJECT_OWNER_ID ?? createdBy;
  const row = {
    ...payload,
    owner_id: ownerId,
  };

  if (createdBy) {
    row.created_by = createdBy;
  }

  if (!options.upsert) {
    const { data: existingOpportunity, error: existingError } = await supabase
      .from("project_opportunities")
      .select("id, slug")
      .eq("slug", payload.slug)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingOpportunity) {
      throw new Error(
        `Project opportunity slug already exists: ${payload.slug}. Rerun with --upsert to update.`,
      );
    }

    const { data, error } = await supabase
      .from("project_opportunities")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return {
      mode: "inserted",
      projectId: data.id,
    };
  }

  const { data, error } = await supabase
    .from("project_opportunities")
    .upsert(row, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return {
    mode: "upserted",
    projectId: data.id,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.dryRun) {
    loadEnvFile(options.envFile);
  }

  const source = options.stdin ? await readStdin() : readFileSync(options.file, "utf8");
  const rawPayload = JSON.parse(source);
  const payload = normalizePayload(rawPayload, options);
  const result = options.dryRun
    ? {
        mode: "dry-run",
        projectId: null,
      }
    : await writeProjectOpportunity(payload, options);

  console.log(
    JSON.stringify(
      {
        ...result,
        opportunity: payload,
        publicPath: buildPublicProjectPath(payload.slug),
        cacheNote: options.dryRun
          ? "Dry run only. No database write was performed."
          : "Verify /projects and the detail page after publish.",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
