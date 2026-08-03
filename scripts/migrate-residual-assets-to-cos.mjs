import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import COS from "cos-nodejs-sdk-v5";
import sharp from "sharp";

const SUPABASE_STORAGE_PUBLIC_PATTERN =
  /^https?:\/\/[^/]+\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+?)(?:\?.*)?$/u;
const PUBLIC_CACHE_CONTROL = "public, max-age=31536000, immutable";
const PRIVATE_CACHE_CONTROL = "private, max-age=300";
const PRIVATE_BUCKET = "event-private-assets";

function parseArgs(argv) {
  const options = { apply: false };

  for (const arg of argv) {
    if (arg === "--apply") {
      options.apply = true;
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

function encodeObjectKey(key) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getPublicUrl(cdnBaseUrl, key) {
  return `${cdnBaseUrl}/${encodeObjectKey(key)}`;
}

function parsePublicStorageUrl(value) {
  if (typeof value !== "string") return null;
  const match = value.match(SUPABASE_STORAGE_PUBLIC_PATTERN);
  if (!match) return null;

  return {
    bucket: decodeURIComponent(match[1]),
    objectPath: match[2]
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/"),
  };
}

function buildOptimizedPublicKey(source) {
  const basePath = source.objectPath.replace(/\.[^./]+$/u, "");
  return `${source.bucket}/${basePath}.webp`;
}

function getCosConfig() {
  return {
    bucket: getRequiredEnv("TENCENT_COS_BUCKET"),
    region: getRequiredEnv("TENCENT_COS_REGION"),
  };
}

async function verifyCosObject(cos, cosConfig, key, expectedBytes) {
  const result = await cos.headObject({
    Bucket: cosConfig.bucket,
    Region: cosConfig.region,
    Key: key,
  });
  const actualBytes = Number(result.headers?.["content-length"]);

  if (actualBytes !== expectedBytes) {
    throw new Error(
      `COS verification failed for ${key}: expected ${expectedBytes}, received ${actualBytes}.`,
    );
  }
}

async function verifyPublicCdnObject(publicUrl, expectedBytes) {
  let lastError = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
      const actualBytes = Number(response.headers.get("content-length"));

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (actualBytes !== expectedBytes) {
        throw new Error(`expected ${expectedBytes} bytes, received ${actualBytes}`);
      }
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  const reason = lastError instanceof Error ? lastError.message : "unknown_error";
  throw new Error(`CDN verification failed for ${publicUrl}: ${reason}.`);
}

async function preparePublicChanges(supabase, cdnBaseUrl) {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, slug, cover_image_url, video_cover_url");
  if (error) throw new Error(`Failed to load events: ${error.message}`);

  const sources = new Map();
  const rowChanges = [];

  for (const event of events ?? []) {
    const fields = {};

    for (const field of ["cover_image_url", "video_cover_url"]) {
      const currentUrl = event[field];
      const source = parsePublicStorageUrl(currentUrl);
      if (!source) continue;

      const sourceId = `${source.bucket}/${source.objectPath}`;
      if (!sources.has(sourceId)) {
        const { data: blob, error: downloadError } = await supabase.storage
          .from(source.bucket)
          .download(source.objectPath);
        if (downloadError) {
          throw new Error(`Failed to download ${sourceId}: ${downloadError.message}`);
        }

        const input = Buffer.from(await blob.arrayBuffer());
        const body = await sharp(input)
          .rotate()
          .resize(2200, 2200, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82, effort: 5, smartSubsample: true })
          .toBuffer();
        const key = buildOptimizedPublicKey(source);

        sources.set(sourceId, {
          body,
          key,
          publicUrl: getPublicUrl(cdnBaseUrl, key),
          sourceBytes: input.byteLength,
          uploadedBytes: body.byteLength,
        });
      }

      fields[field] = {
        previous: currentUrl,
        next: sources.get(sourceId).publicUrl,
      };
    }

    if (Object.keys(fields).length > 0) {
      rowChanges.push({ id: event.id, slug: event.slug, fields });
    }
  }

  return { sources: [...sources.values()], rowChanges };
}

async function preparePrivateChanges(supabase) {
  const { data: rows, error } = await supabase
    .from("event_group_qr_codes")
    .select("event_id, storage_path");
  if (error) throw new Error(`Failed to load event group QR codes: ${error.message}`);

  const changes = [];

  for (const row of rows ?? []) {
    if (
      !row.storage_path ||
      row.storage_path.startsWith(`${PRIVATE_BUCKET}/`) ||
      row.storage_path.includes("://") ||
      row.storage_path.includes("..")
    ) {
      continue;
    }

    const { data: blob, error: downloadError } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .download(row.storage_path);
    if (downloadError) {
      throw new Error(
        `Failed to download private QR ${row.storage_path}: ${downloadError.message}`,
      );
    }

    const body = Buffer.from(await blob.arrayBuffer());
    const extension = path.extname(row.storage_path) || ".webp";
    changes.push({
      eventId: row.event_id,
      previous: row.storage_path,
      next: `${PRIVATE_BUCKET}/events/${row.event_id}/group-qr/${Date.now()}-${randomUUID()}${extension}`,
      body,
      bytes: body.byteLength,
      contentType: blob.type || "image/webp",
    });
  }

  return changes;
}

async function writeBackup(publicChanges, privateChanges) {
  const outputDirectory = path.resolve("output/cos-migration");
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const outputPath = path.join(outputDirectory, `${timestamp}-residual-assets.json`);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        publicSources: publicChanges.sources.map(({ body: _body, ...source }) => source),
        publicRows: publicChanges.rowChanges,
        privateRows: privateChanges.map(({ body: _body, ...change }) => change),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  return outputPath;
}

async function applyChanges({
  supabase,
  cos,
  cosConfig,
  publicChanges,
  privateChanges,
}) {
  for (const source of publicChanges.sources) {
    await cos.putObject({
      Bucket: cosConfig.bucket,
      Region: cosConfig.region,
      Key: source.key,
      Body: source.body,
      ContentLength: source.uploadedBytes,
      ContentType: "image/webp",
      CacheControl: PUBLIC_CACHE_CONTROL,
    });
    await verifyCosObject(cos, cosConfig, source.key, source.uploadedBytes);
    await verifyPublicCdnObject(source.publicUrl, source.uploadedBytes);
  }

  for (const change of privateChanges) {
    await cos.putObject({
      Bucket: cosConfig.bucket,
      Region: cosConfig.region,
      Key: change.next,
      Body: change.body,
      ContentLength: change.bytes,
      ContentType: change.contentType,
      CacheControl: PRIVATE_CACHE_CONTROL,
      ACL: "private",
    });
    await verifyCosObject(cos, cosConfig, change.next, change.bytes);
  }

  for (const change of publicChanges.rowChanges) {
    const patch = Object.fromEntries(
      Object.entries(change.fields).map(([field, values]) => [field, values.next]),
    );
    const { error } = await supabase.from("events").update(patch).eq("id", change.id);
    if (error) throw new Error(`Failed to update event ${change.slug}: ${error.message}`);
  }

  for (const change of privateChanges) {
    const { error } = await supabase
      .from("event_group_qr_codes")
      .update({ storage_path: change.next })
      .eq("event_id", change.eventId)
      .eq("storage_path", change.previous);
    if (error) {
      throw new Error(`Failed to update private QR ${change.eventId}: ${error.message}`);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const supabase = createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const cos = new COS({
    SecretId: getRequiredEnv("TENCENT_COS_SECRET_ID"),
    SecretKey: getRequiredEnv("TENCENT_COS_SECRET_KEY"),
  });
  const cosConfig = getCosConfig();
  const cdnBaseUrl = getRequiredEnv("NEXT_PUBLIC_IMAGE_CDN_URL").replace(/\/$/u, "");
  const publicChanges = await preparePublicChanges(supabase, cdnBaseUrl);
  const privateChanges = await preparePrivateChanges(supabase);
  const backupPath = await writeBackup(publicChanges, privateChanges);

  console.log(
    JSON.stringify(
      {
        mode: options.apply ? "apply" : "dry-run",
        publicObjects: publicChanges.sources.map(({ body: _body, ...source }) => source),
        publicRows: publicChanges.rowChanges,
        privateRows: privateChanges.map(({ body: _body, ...change }) => change),
        backupPath,
      },
      null,
      2,
    ),
  );

  if (!options.apply) {
    console.log("Dry-run only. Re-run with --apply to upload and update the database.");
    return;
  }

  await applyChanges({
    supabase,
    cos,
    cosConfig,
    publicChanges,
    privateChanges,
  });
  console.log(
    `Applied ${publicChanges.sources.length} public object(s), ${publicChanges.rowChanges.length} event row(s), and ${privateChanges.length} private QR row(s).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
