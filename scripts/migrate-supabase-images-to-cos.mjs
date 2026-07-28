import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import COS from "cos-nodejs-sdk-v5";

const IMAGE_BUCKETS = [
  "event-assets",
  "member-avatars",
  "community-update-assets",
  "member-work-assets",
];
const DATABASE_TARGETS = [
  {
    table: "profiles",
    fields: ["avatar_url"],
  },
  {
    table: "events",
    fields: [
      "cover_image_url",
      "video_cover_url",
      "description",
      "agenda",
      "speaker_lineup",
      "registration_note",
      "recap",
    ],
  },
  {
    table: "event_photos",
    fields: ["image_url"],
  },
  {
    table: "sponsors",
    fields: ["logo_url", "description"],
  },
  {
    table: "sponsor_images",
    fields: ["image_url"],
  },
  {
    table: "community_wechat_qr_codes",
    fields: ["image_url"],
  },
  {
    table: "community_updates",
    fields: ["content"],
  },
  {
    table: "community_update_images",
    fields: ["image_url"],
  },
  {
    table: "member_works",
    fields: ["cover_image_url", "qr_code_image_url", "description"],
  },
  {
    table: "project_opportunities",
    fields: ["cover_image_url", "description", "application_note"],
  },
  {
    table: "external_case_cards",
    fields: ["cover_image_url", "description"],
  },
  {
    table: "social_materials",
    fields: ["content_markdown", "settings"],
  },
];
const LIST_LIMIT = 1000;
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";
const STORAGE_URL_PATTERN =
  /https?:\/\/[^\s"'<>()[\]{},;]+\/storage\/v1\/(?:object|render\/image)\/public\/[^\s"'<>()[\]{},;]+/giu;
const SUPABASE_STORAGE_PATH_PATTERN =
  /^\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/u;
const TRANSFORM_QUERY_NAMES = new Set(["width", "height", "quality", "resize"]);

function parseArgs(argv) {
  const options = {
    apply: false,
    concurrency: 4,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--concurrency") {
      const value = Number(argv[index + 1]);

      if (!Number.isInteger(value) || value < 1 || value > 12) {
        throw new Error("--concurrency requires an integer from 1 to 12.");
      }

      options.concurrency = value;
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

function createSupabaseAdminClient() {
  return createClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function createCosClient() {
  return new COS({
    SecretId: getRequiredEnv("TENCENT_COS_SECRET_ID"),
    SecretKey: getRequiredEnv("TENCENT_COS_SECRET_KEY"),
  });
}

function isFolderEntry(entry) {
  return !entry.id && !entry.metadata;
}

function joinStoragePath(prefix, name) {
  return prefix ? `${prefix}/${name}` : name;
}

async function listObjects(client, bucket, prefix = "") {
  const objects = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: LIST_LIMIT,
      offset,
      sortBy: {
        column: "name",
        order: "asc",
      },
    });

    if (error) {
      throw new Error(`Failed to list ${bucket}/${prefix}: ${error.message}`);
    }

    const entries = data ?? [];

    for (const entry of entries) {
      const objectPath = joinStoragePath(prefix, entry.name);

      if (isFolderEntry(entry)) {
        objects.push(...(await listObjects(client, bucket, objectPath)));
      } else {
        objects.push({
          bucket,
          path: objectPath,
          key: `${bucket}/${objectPath}`,
          metadata: entry.metadata ?? {},
        });
      }
    }

    if (entries.length < LIST_LIMIT) {
      break;
    }

    offset += LIST_LIMIT;
  }

  return objects;
}

function inferContentType(objectPath, metadata) {
  const metadataType =
    metadata?.mimetype ?? metadata?.mimeType ?? metadata?.contentType ?? metadata?.type;

  if (typeof metadataType === "string" && metadataType.trim()) {
    return metadataType;
  }

  const lowerPath = objectPath.toLowerCase();
  const extensionTypes = [
    [".avif", "image/avif"],
    [".webp", "image/webp"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".gif", "image/gif"],
    [".svg", "image/svg+xml"],
  ];
  const match = extensionTypes.find(([extension]) => lowerPath.endsWith(extension));

  return match?.[1] ?? "application/octet-stream";
}

function encodeObjectKey(key) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getPublicUrl(publicBaseUrl, key) {
  return `${publicBaseUrl}/${encodeObjectKey(key)}`;
}

function getObjectSize(object) {
  const rawSize = object.metadata?.size ?? object.metadata?.contentLength;
  const size = Number(rawSize);
  return Number.isFinite(size) ? size : null;
}

function getErrorStatus(error) {
  if (!error || typeof error !== "object") {
    return null;
  }

  return Number(error.statusCode ?? error.status) || null;
}

async function headCosObject(cos, cosConfig, key) {
  try {
    return await cos.headObject({
      Bucket: cosConfig.bucket,
      Region: cosConfig.region,
      Key: key,
    });
  } catch (error) {
    if (getErrorStatus(error) === 404 || error?.code === "NoSuchKey") {
      return null;
    }

    throw error;
  }
}

function normalizeEtag(value) {
  return typeof value === "string" ? value.replaceAll('"', "").toLowerCase() : null;
}

async function copyObject(sourceClient, cos, cosConfig, object) {
  const sourceEtag = normalizeEtag(object.metadata?.eTag ?? object.metadata?.etag);
  const sourceSize = getObjectSize(object);
  const existing = await headCosObject(cos, cosConfig, object.key);
  const existingEtag = normalizeEtag(existing?.headers?.etag);
  const existingSize = Number(existing?.headers?.["content-length"]);

  if (
    sourceEtag &&
    sourceSize !== null &&
    existingEtag === sourceEtag &&
    existingSize === sourceSize
  ) {
    return {
      bytes: sourceSize,
      uploaded: false,
    };
  }

  const { data: blob, error: downloadError } = await sourceClient.storage
    .from(object.bucket)
    .download(object.path);

  if (downloadError) {
    throw new Error(
      `Download failed for ${object.bucket}/${object.path}: ${downloadError.message}`,
    );
  }

  const body = Buffer.from(await blob.arrayBuffer());
  const sourceMd5 = createHash("md5").update(body).digest("hex");
  let uploaded = false;

  if (existingEtag !== sourceMd5) {
    await cos.putObject({
      Bucket: cosConfig.bucket,
      Region: cosConfig.region,
      Key: object.key,
      Body: body,
      ContentLength: body.byteLength,
      ContentType: inferContentType(object.path, object.metadata),
      CacheControl: DEFAULT_CACHE_CONTROL,
    });
    uploaded = true;
  }

  const verified = await headCosObject(cos, cosConfig, object.key);
  const verifiedEtag = normalizeEtag(verified?.headers?.etag);
  const verifiedSize = Number(verified?.headers?.["content-length"]);

  if (verifiedEtag !== sourceMd5 || verifiedSize !== body.byteLength) {
    throw new Error(`COS verification failed for ${object.key}.`);
  }

  return {
    bytes: body.byteLength,
    uploaded,
  };
}

async function verifyCdnObject(publicBaseUrl, object) {
  const targetUrl = getPublicUrl(publicBaseUrl, object.key);
  let lastError = null;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(targetUrl, {
        method: "HEAD",
        cache: "no-store",
      });
      const expectedSize = getObjectSize(object);
      const actualSize = Number(response.headers.get("content-length"));

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (expectedSize !== null && actualSize !== expectedSize) {
        throw new Error(`expected ${expectedSize} bytes, received ${actualSize}`);
      }

      return;
    } catch (error) {
      lastError = error;

      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  const reason = lastError instanceof Error ? lastError.message : "unknown error";
  throw new Error(`CDN verification failed for ${object.key}: ${reason}.`);
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(items.length, 1)) },
      () => runWorker(),
    ),
  );

  return results;
}

function parseStorageKey(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl);
    const match = parsedUrl.pathname.match(SUPABASE_STORAGE_PATH_PATTERN);

    if (!match) {
      return null;
    }

    const bucket = decodeURIComponent(match[1]);
    const objectPath = match[2]
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");

    return {
      key: `${bucket}/${objectPath}`,
      searchParams: parsedUrl.searchParams,
    };
  } catch {
    return null;
  }
}

function rewriteStorageUrl(rawUrl, sourceKeys, publicBaseUrl) {
  const parsed = parseStorageKey(rawUrl);

  if (!parsed || !sourceKeys.has(parsed.key)) {
    return rawUrl;
  }

  const targetUrl = new URL(getPublicUrl(publicBaseUrl, parsed.key));

  for (const [name, value] of parsed.searchParams) {
    if (!TRANSFORM_QUERY_NAMES.has(name)) {
      targetUrl.searchParams.append(name, value);
    }
  }

  return targetUrl.toString();
}

function rewriteValue(value, sourceKeys, publicBaseUrl) {
  if (typeof value === "string") {
    let replacementCount = 0;
    const rewritten = value.replace(STORAGE_URL_PATTERN, (rawUrl) => {
      const nextUrl = rewriteStorageUrl(rawUrl, sourceKeys, publicBaseUrl);

      if (nextUrl !== rawUrl) {
        replacementCount += 1;
      }

      return nextUrl;
    });

    return { value: rewritten, replacementCount };
  }

  if (Array.isArray(value)) {
    let replacementCount = 0;
    const rewritten = value.map((item) => {
      const result = rewriteValue(item, sourceKeys, publicBaseUrl);
      replacementCount += result.replacementCount;
      return result.value;
    });
    return { value: rewritten, replacementCount };
  }

  if (value && typeof value === "object") {
    let replacementCount = 0;
    const rewritten = {};

    for (const [name, item] of Object.entries(value)) {
      const result = rewriteValue(item, sourceKeys, publicBaseUrl);
      replacementCount += result.replacementCount;
      rewritten[name] = result.value;
    }

    return { value: rewritten, replacementCount };
  }

  return { value, replacementCount: 0 };
}

async function loadTableRows(client, target) {
  const rows = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client
      .from(target.table)
      .select(["id", ...target.fields].join(","))
      .range(offset, offset + LIST_LIMIT - 1);

    if (error) {
      throw new Error(`Failed to scan ${target.table}: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < LIST_LIMIT) {
      break;
    }

    offset += LIST_LIMIT;
  }

  return rows;
}

async function findDatabaseChanges(client, sourceKeys, publicBaseUrl) {
  const changes = [];

  for (const target of DATABASE_TARGETS) {
    const rows = await loadTableRows(client, target);
    let tableReplacementCount = 0;

    for (const row of rows) {
      const fields = {};
      let replacementCount = 0;

      for (const field of target.fields) {
        const result = rewriteValue(row[field], sourceKeys, publicBaseUrl);

        if (result.replacementCount > 0) {
          fields[field] = {
            previous: row[field],
            next: result.value,
          };
          replacementCount += result.replacementCount;
        }
      }

      if (replacementCount > 0) {
        changes.push({
          table: target.table,
          id: row.id,
          fields,
          replacementCount,
        });
        tableReplacementCount += replacementCount;
      }
    }

    console.log(
      `Database ${target.table}: ${rows.length} row(s), ${tableReplacementCount} URL replacement(s).`,
    );
  }

  return changes;
}

async function findAuthUserChanges(client, sourceKeys, publicBaseUrl) {
  const changes = [];
  const perPage = 1000;
  let page = 1;
  let scannedUsers = 0;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new Error(`Failed to scan auth users: ${error.message}`);
    }

    const users = data.users ?? [];
    scannedUsers += users.length;

    for (const user of users) {
      const fields = {};

      for (const field of ["avatar_url", "picture"]) {
        const currentValue = user.user_metadata?.[field];
        const result = rewriteValue(currentValue, sourceKeys, publicBaseUrl);

        if (result.replacementCount > 0) {
          fields[field] = {
            previous: currentValue,
            next: result.value,
          };
        }
      }

      if (Object.keys(fields).length > 0) {
        changes.push({
          id: user.id,
          fields,
        });
      }
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  console.log(
    `Auth users: ${scannedUsers} user(s), ${changes.length} metadata record(s) to update.`,
  );
  return changes;
}

async function writeBackupReport(objects, databaseChanges, authUserChanges) {
  const outputDirectory = path.resolve("output/cos-migration");
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const outputPath = path.join(outputDirectory, `${timestamp}-supabase-image-migration.json`);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        sourceObjects: objects.map((object) => ({
          bucket: object.bucket,
          path: object.path,
          size: getObjectSize(object),
        })),
        databaseChanges,
        authUserChanges,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return outputPath;
}

async function applyDatabaseChanges(client, changes) {
  let updatedRows = 0;

  for (const change of changes) {
    const patch = Object.fromEntries(
      Object.entries(change.fields).map(([field, values]) => [field, values.next]),
    );
    const { error } = await client.from(change.table).update(patch).eq("id", change.id);

    if (error) {
      throw new Error(
        `Failed to update ${change.table}/${change.id}: ${error.message}`,
      );
    }

    updatedRows += 1;
  }

  return updatedRows;
}

async function applyAuthUserChanges(client, changes) {
  let updatedUsers = 0;

  for (const change of changes) {
    const migratedFields = Object.fromEntries(
      Object.entries(change.fields).map(([field, values]) => [field, values.next]),
    );
    let lastError = null;
    let updated = false;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const { data: currentUserData, error: loadError } =
          await client.auth.admin.getUserById(change.id);

        if (loadError || !currentUserData.user) {
          throw new Error(loadError?.message ?? "user not found");
        }

        const { error: updateError } = await client.auth.admin.updateUserById(
          change.id,
          {
            user_metadata: {
              ...currentUserData.user.user_metadata,
              ...migratedFields,
            },
          },
        );

        if (updateError) {
          throw updateError;
        }

        updated = true;
        break;
      } catch (error) {
        lastError = error;

        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 750));
        }
      }
    }

    if (!updated) {
      const reason = lastError instanceof Error ? lastError.message : "unknown error";
      throw new Error(`Failed to update auth user ${change.id}: ${reason}`);
    }

    updatedUsers += 1;
  }

  return updatedUsers;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const supabase = createSupabaseAdminClient();
  const cos = createCosClient();
  const cosConfig = {
    bucket: getRequiredEnv("TENCENT_COS_BUCKET"),
    region: getRequiredEnv("TENCENT_COS_REGION"),
  };
  const publicBaseUrl = getRequiredEnv("NEXT_PUBLIC_IMAGE_CDN_URL").replace(/\/$/, "");
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    throw new Error(`Failed to list Supabase buckets: ${bucketError.message}`);
  }

  const availableBuckets = new Set((buckets ?? []).map((bucket) => bucket.id));
  const missingBuckets = IMAGE_BUCKETS.filter((bucket) => !availableBuckets.has(bucket));

  if (missingBuckets.length > 0) {
    throw new Error(`Missing Supabase image bucket(s): ${missingBuckets.join(", ")}`);
  }

  const objects = [];

  for (const bucket of IMAGE_BUCKETS) {
    const bucketObjects = await listObjects(supabase, bucket);
    const listedBytes = bucketObjects.reduce(
      (total, object) => total + (getObjectSize(object) ?? 0),
      0,
    );
    console.log(
      `Storage ${bucket}: ${bucketObjects.length} object(s), ${formatBytes(listedBytes)}.`,
    );
    objects.push(...bucketObjects);
  }

  const sourceKeys = new Set(objects.map((object) => object.key));
  const databaseChanges = await findDatabaseChanges(
    supabase,
    sourceKeys,
    publicBaseUrl,
  );
  const authUserChanges = await findAuthUserChanges(
    supabase,
    sourceKeys,
    publicBaseUrl,
  );
  const replacementCount = databaseChanges.reduce(
    (total, change) => total + change.replacementCount,
    0,
  );

  console.log(
    `Migration plan: ${objects.length} object(s), ${databaseChanges.length} database row(s), ${authUserChanges.length} auth user(s), ${replacementCount} database URL replacement(s).`,
  );

  if (!options.apply) {
    console.log("Dry run complete. Run again with --apply to copy and update data.");
    return;
  }

  let completed = 0;
  let uploaded = 0;
  let copiedBytes = 0;
  await mapWithConcurrency(objects, options.concurrency, async (object) => {
    const result = await copyObject(supabase, cos, cosConfig, object);
    completed += 1;
    copiedBytes += result.bytes;

    if (result.uploaded) {
      uploaded += 1;
    }

    if (completed === objects.length || completed % 10 === 0) {
      console.log(
        `COS copy: verified ${completed}/${objects.length}, uploaded ${uploaded}, ${formatBytes(copiedBytes)} checked.`,
      );
    }
  });

  let cdnVerified = 0;
  await mapWithConcurrency(objects, options.concurrency, async (object) => {
    await verifyCdnObject(publicBaseUrl, object);
    cdnVerified += 1;

    if (cdnVerified === objects.length || cdnVerified % 20 === 0) {
      console.log(`CDN verification: ${cdnVerified}/${objects.length}.`);
    }
  });

  const backupPath = await writeBackupReport(
    objects,
    databaseChanges,
    authUserChanges,
  );
  console.log(`Rollback data written before database updates: ${backupPath}`);

  const updatedRows = await applyDatabaseChanges(supabase, databaseChanges);
  const updatedAuthUsers = await applyAuthUserChanges(supabase, authUserChanges);
  console.log(
    `Migration complete: ${objects.length} COS object(s) verified, ${updatedRows} database row(s) updated, ${updatedAuthUsers} auth user(s) updated, ${replacementCount} database URL(s) replaced.`,
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
