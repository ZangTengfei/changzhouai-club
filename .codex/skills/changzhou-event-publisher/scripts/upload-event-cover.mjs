#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_ENV_FILE = ".env.local";
const DEFAULT_BUCKET = "event-assets";

function printHelp() {
  console.log(`Upload an event poster/cover image to Supabase Storage.

Usage:
  node .codex/skills/changzhou-event-publisher/scripts/upload-event-cover.mjs \\
    --slug 2026-06-14-aigc-video-salon \\
    --file output/posters/2026-06-14-aigc-video-salon/poster.jpg

Options:
  --slug <slug>        Event slug used in the storage path.
  --file <path>        Local image file to upload.
  --env-file <path>    Env file with Supabase config. Defaults to .env.local.
  --bucket <bucket>    Storage bucket. Defaults to event-assets.
  --dry-run            Validate input and print the planned storage path only.
  --help               Show this help.
`);
}

function parseArgs(argv) {
  const options = {
    bucket: DEFAULT_BUCKET,
    dryRun: false,
    envFile: DEFAULT_ENV_FILE,
    file: null,
    slug: null,
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

    if (["--slug", "--file", "--env-file", "--bucket"].includes(arg)) {
      const value = argv[index + 1]?.trim();

      if (!value) {
        throw new Error(`${arg} requires a value.`);
      }

      const optionKeyMap = {
        "--bucket": "bucket",
        "--env-file": "envFile",
        "--file": "file",
        "--slug": "slug",
      };

      options[optionKeyMap[arg]] = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.help && (!options.slug || !options.file)) {
    throw new Error("Provide both --slug and --file.");
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

function sanitizeSegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_.]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".png") {
    return "image/png";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
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

function buildStoragePath(slug, fileName) {
  const safeSlug = sanitizeSegment(slug);
  const safeFileName = sanitizeSegment(fileName) || "poster.jpg";

  if (!safeSlug) {
    throw new Error("Slug must contain at least one lowercase ASCII letter, number, dash, dot, or underscore.");
  }

  return `events/${safeSlug}/${Date.now()}-${safeFileName}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const filePath = path.resolve(process.cwd(), options.file);

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${options.file}`);
  }

  loadEnvFile(options.envFile);

  const storagePath = buildStoragePath(options.slug, path.basename(filePath));
  const contentType = getContentType(filePath);

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          bucket: options.bucket,
          contentType,
          file: filePath,
          mode: "dry-run",
          storagePath,
        },
        null,
        2,
      ),
    );
    return;
  }

  const { serviceRoleKey, supabaseUrl } = getSupabaseConfig();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const file = readFileSync(filePath);
  const { error } = await supabase.storage.from(options.bucket).upload(storagePath, file, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(options.bucket).getPublicUrl(storagePath);

  console.log(
    JSON.stringify(
      {
        bucket: options.bucket,
        contentType,
        publicUrl: data.publicUrl,
        storagePath,
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
