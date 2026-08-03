#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import COS from "cos-nodejs-sdk-v5";
import sharp from "sharp";

const DEFAULT_ENV_FILE = ".env.local";
const DEFAULT_BUCKET = "event-assets";

function printHelp() {
  console.log(`Optimize an event poster/cover to WebP and upload it to Tencent COS.

Usage:
  node .codex/skills/changzhou-event-publisher/scripts/upload-event-cover.mjs \\
    --slug 2026-06-14-aigc-video-salon \\
    --file output/posters/2026-06-14-aigc-video-salon/poster.jpg

Options:
  --slug <slug>        Event slug used in the storage path.
  --file <path>        Local image file to upload.
  --env-file <path>    Env file with Supabase config. Defaults to .env.local.
  --bucket <bucket>    Logical COS key prefix. Defaults to event-assets.
  --dry-run            Validate and optimize input without uploading.
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

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required Tencent COS environment variable: ${name}.`);
  }

  return value;
}

function buildStoragePath(slug, fileName) {
  const safeSlug = sanitizeSegment(slug);
  const safeFileName = sanitizeSegment(fileName) || "poster.jpg";

  if (!safeSlug) {
    throw new Error("Slug must contain at least one lowercase ASCII letter, number, dash, dot, or underscore.");
  }

  return `events/${safeSlug}/${Date.now()}-${safeFileName}`;
}

function buildPublicUrl(key) {
  const baseUrl = getRequiredEnv("NEXT_PUBLIC_IMAGE_CDN_URL").replace(/\/$/, "");
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/${encodedKey}`;
}

async function optimizeCover(filePath) {
  const input = readFileSync(filePath);
  const body = await sharp(input)
    .rotate()
    .resize(2200, 2200, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toBuffer();

  return {
    body,
    originalBytes: input.byteLength,
    optimizedBytes: body.byteLength,
    optimizedFileName: `${path.basename(filePath, path.extname(filePath))}.webp`,
  };
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

  const optimized = await optimizeCover(filePath);
  const storagePath = buildStoragePath(options.slug, optimized.optimizedFileName);
  const key = `${sanitizeSegment(options.bucket)}/${storagePath}`;
  const publicUrl = buildPublicUrl(key);

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          contentType: "image/webp",
          file: filePath,
          key,
          mode: "dry-run",
          optimizedBytes: optimized.optimizedBytes,
          originalBytes: optimized.originalBytes,
          publicUrl,
          storagePath,
        },
        null,
        2,
      ),
    );
    return;
  }

  const cos = new COS({
    SecretId: getRequiredEnv("TENCENT_COS_SECRET_ID"),
    SecretKey: getRequiredEnv("TENCENT_COS_SECRET_KEY"),
  });
  await cos.putObject({
    Bucket: getRequiredEnv("TENCENT_COS_BUCKET"),
    Region: getRequiredEnv("TENCENT_COS_REGION"),
    Key: key,
    Body: optimized.body,
    ContentLength: optimized.optimizedBytes,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  });

  console.log(
    JSON.stringify(
      {
        contentType: "image/webp",
        key,
        optimizedBytes: optimized.optimizedBytes,
        originalBytes: optimized.originalBytes,
        publicUrl,
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
