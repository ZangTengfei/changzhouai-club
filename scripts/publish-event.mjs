import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILE = ".env.local";
const CONTACT_INFO_PATTERN = /(?:\+?86[-\s]?)?1[3-9]\d{9}/;
const DATETIME_LOCAL_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;
const STATUS_VALUES = new Set(["draft", "scheduled", "completed", "cancelled"]);
const EVENT_TYPE_VALUES = new Set(["community", "external"]);
const CHANGZHOU_TIMEZONE_OFFSET = "+08:00";
const TEXT_LIST_FIELDS = new Set(["agenda", "speaker_lineup"]);
const PARAGRAPH_FIELDS = new Set(["description", "recap"]);
const EVENT_FIELDS = new Set([
  "title",
  "slug",
  "summary",
  "description",
  "agenda",
  "speaker_lineup",
  "registration_note",
  "registration_url",
  "event_type",
  "recap",
  "docs_url",
  "video_url",
  "video_provider",
  "video_file_id",
  "video_title",
  "video_cover_url",
  "event_at",
  "venue",
  "city",
  "cover_image_url",
  "status",
]);
const PUBLIC_TEXT_FIELDS = [
  "title",
  "summary",
  "description",
  "agenda",
  "speaker_lineup",
  "registration_note",
  "recap",
  "video_title",
  "venue",
];

function printHelp() {
  console.log(`Publish a Changzhou AI Club event to Supabase.

Usage:
  node scripts/publish-event.mjs --file output/event.json --dry-run
  node scripts/publish-event.mjs --file output/event.json
  node scripts/publish-event.mjs --stdin --dry-run

Options:
  --file <path>          Read event JSON from a file.
  --stdin                Read event JSON from stdin.
  --dry-run              Validate and print the normalized payload without writing.
  --upsert               Update an existing event with the same slug, or insert it.
  --env-file <path>      Load environment variables from a file. Defaults to .env.local.
  --allow-contact-info   Allow phone-like contact info in public event fields.
  --help                 Show this help.

Required JSON fields:
  title, slug

Common JSON fields:
  summary, description, event_at, venue, city, agenda, speaker_lineup,
  registration_note, registration_url, event_type, cover_image_url,
  video_url, video_provider, video_file_id, video_title, video_cover_url, status
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

function getTextField(payload, fieldName) {
  const value = payload[fieldName];

  if (PARAGRAPH_FIELDS.has(fieldName) && Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join("\n\n");
    return joined || null;
  }

  if (TEXT_LIST_FIELDS.has(fieldName) && Array.isArray(value)) {
    const joined = value.map((item) => String(item).trim()).filter(Boolean).join("\n");
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

function normalizeEventDateTime(value) {
  const trimmed = getOptionalString(value);

  if (!trimmed) {
    return null;
  }

  if (TIMEZONE_SUFFIX_PATTERN.test(trimmed)) {
    return trimmed;
  }

  if (!DATETIME_LOCAL_PATTERN.test(trimmed)) {
    throw new Error(
      "event_at must include date and time, for example 2026-05-15T14:00. Leave it empty if the time is not confirmed.",
    );
  }

  const normalizedSeparator = trimmed.replace(" ", "T");
  const valueWithSeconds =
    normalizedSeparator.length === "YYYY-MM-DDTHH:mm".length
      ? `${normalizedSeparator}:00`
      : normalizedSeparator;

  return `${valueWithSeconds}${CHANGZHOU_TIMEZONE_OFFSET}`;
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

function normalizeEventType(value) {
  const eventType = getOptionalString(value) ?? "community";

  if (!EVENT_TYPE_VALUES.has(eventType)) {
    throw new Error(`event_type must be one of: ${Array.from(EVENT_TYPE_VALUES).join(", ")}`);
  }

  return eventType;
}

function assertNoUnknownFields(payload) {
  const unknownFields = Object.keys(payload).filter((key) => !EVENT_FIELDS.has(key));

  if (unknownFields.length > 0) {
    throw new Error(`Unknown event JSON field(s): ${unknownFields.join(", ")}`);
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
    throw new Error("Event JSON must be an object.");
  }

  assertNoUnknownFields(rawPayload);
  assertNoContactInfo(rawPayload, options);

  const title = getOptionalString(rawPayload.title);
  const slug = normalizeSlug(rawPayload.slug);
  const status = getOptionalString(rawPayload.status) ?? "scheduled";

  if (!title) {
    throw new Error("title is required.");
  }

  if (!slug) {
    throw new Error("slug is required. Use lowercase letters, numbers, and hyphens.");
  }

  if (!STATUS_VALUES.has(status)) {
    throw new Error(`status must be one of: ${Array.from(STATUS_VALUES).join(", ")}`);
  }

  return {
    title,
    slug,
    summary: getTextField(rawPayload, "summary"),
    description: getTextField(rawPayload, "description"),
    agenda: getTextField(rawPayload, "agenda"),
    speaker_lineup: getTextField(rawPayload, "speaker_lineup"),
    registration_note: getTextField(rawPayload, "registration_note"),
    registration_url: normalizeOptionalUrlValue(rawPayload.registration_url, "registration_url"),
    event_type: normalizeEventType(rawPayload.event_type),
    recap: getTextField(rawPayload, "recap"),
    docs_url: getTextField(rawPayload, "docs_url"),
    video_url: normalizeOptionalUrlValue(rawPayload.video_url, "video_url"),
    video_provider: getTextField(rawPayload, "video_provider"),
    video_file_id: getTextField(rawPayload, "video_file_id"),
    video_title: getTextField(rawPayload, "video_title"),
    video_cover_url: normalizeOptionalUrlValue(rawPayload.video_cover_url, "video_cover_url"),
    event_at: normalizeEventDateTime(rawPayload.event_at),
    venue: getTextField(rawPayload, "venue"),
    city: getTextField(rawPayload, "city") ?? "常州",
    cover_image_url: getTextField(rawPayload, "cover_image_url"),
    status,
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
    supabaseUrl,
    serviceRoleKey,
  };
}

function buildPublicEventPath(slug) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  const path = `/events/${slug}`;

  if (!siteUrl) {
    return path;
  }

  return `${siteUrl.replace(/\/+$/, "")}${path}`;
}

async function writeEvent(payload, options) {
  const { supabaseUrl, serviceRoleKey } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const createdBy =
    process.env.ADMIN_EVENT_CREATED_BY ?? process.env.SUPABASE_ADMIN_USER_ID ?? null;
  const row = { ...payload };

  if (createdBy) {
    row.created_by = createdBy;
  }

  if (!options.upsert) {
    const { data: existingEvent, error: existingError } = await supabase
      .from("events")
      .select("id, slug")
      .eq("slug", payload.slug)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingEvent) {
      throw new Error(`Event slug already exists: ${payload.slug}. Rerun with --upsert to update.`);
    }

    const { data, error } = await supabase.from("events").insert(row).select("id").single();

    if (error) {
      throw error;
    }

    return {
      eventId: data.id,
      mode: "inserted",
    };
  }

  const { data, error } = await supabase
    .from("events")
    .upsert(row, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return {
    eventId: data.id,
    mode: "upserted",
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
        eventId: null,
      }
    : await writeEvent(payload, options);

  console.log(
    JSON.stringify(
      {
        ...result,
        event: payload,
        publicPath: buildPublicEventPath(payload.slug),
        cacheNote: options.dryRun
          ? "Dry run only. No database write was performed."
          : "Public event pages revalidate within the site cache window.",
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
