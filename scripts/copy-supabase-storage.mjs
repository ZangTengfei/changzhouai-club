import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUCKETS = [
  "event-assets",
  "member-avatars",
  "community-update-assets",
];
const LIST_LIMIT = 1000;

function parseArgs(argv) {
  const options = {
    buckets: [],
    dryRun: false,
    upsert: false,
    concurrency: 4,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--upsert") {
      options.upsert = true;
      continue;
    }

    if (arg === "--bucket") {
      const bucket = argv[index + 1]?.trim();

      if (!bucket) {
        throw new Error("--bucket requires a bucket name.");
      }

      options.buckets.push(bucket);
      index += 1;
      continue;
    }

    if (arg === "--concurrency") {
      const rawValue = argv[index + 1]?.trim();
      const value = Number(rawValue);

      if (!Number.isInteger(value) || value < 1 || value > 20) {
        throw new Error("--concurrency requires an integer from 1 to 20.");
      }

      options.concurrency = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    ...options,
    buckets: options.buckets.length > 0 ? options.buckets : DEFAULT_BUCKETS,
  };
}

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSupabaseClient(prefix) {
  const url = getRequiredEnv(`${prefix}_SUPABASE_URL`);
  const serviceRoleKey = getRequiredEnv(`${prefix}_SUPABASE_SERVICE_ROLE_KEY`);

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
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
      const path = joinStoragePath(prefix, entry.name);

      if (isFolderEntry(entry)) {
        objects.push(...(await listObjects(client, bucket, path)));
      } else {
        objects.push({
          path,
          metadata: entry.metadata ?? {},
          updatedAt: entry.updated_at,
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

function inferContentType(path, metadata) {
  const metadataType =
    metadata?.mimetype ?? metadata?.mimeType ?? metadata?.contentType ?? metadata?.type;

  if (typeof metadataType === "string" && metadataType.trim()) {
    return metadataType;
  }

  const lowerPath = path.toLowerCase();

  if (lowerPath.endsWith(".avif")) {
    return "image/avif";
  }

  if (lowerPath.endsWith(".webp")) {
    return "image/webp";
  }

  if (lowerPath.endsWith(".png")) {
    return "image/png";
  }

  if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lowerPath.endsWith(".gif")) {
    return "image/gif";
  }

  if (lowerPath.endsWith(".svg")) {
    return "image/svg+xml";
  }

  return "application/octet-stream";
}

async function ensureBucket(sourceClient, targetClient, bucket) {
  const [{ data: sourceBuckets, error: sourceError }, { data: targetBuckets, error: targetError }] =
    await Promise.all([
      sourceClient.storage.listBuckets(),
      targetClient.storage.listBuckets(),
    ]);

  if (sourceError) {
    throw new Error(`Failed to list source buckets: ${sourceError.message}`);
  }

  if (targetError) {
    throw new Error(`Failed to list target buckets: ${targetError.message}`);
  }

  const sourceBucket = (sourceBuckets ?? []).find((item) => item.id === bucket);

  if (!sourceBucket) {
    throw new Error(`Source bucket does not exist: ${bucket}`);
  }

  const targetBucket = (targetBuckets ?? []).find((item) => item.id === bucket);

  if (targetBucket) {
    return;
  }

  const { error: createError } = await targetClient.storage.createBucket(bucket, {
    public: Boolean(sourceBucket.public),
  });

  if (createError) {
    throw new Error(`Failed to create target bucket ${bucket}: ${createError.message}`);
  }
}

async function copyObject(sourceClient, targetClient, bucket, object, options) {
  const { data: blob, error: downloadError } = await sourceClient.storage
    .from(bucket)
    .download(object.path);

  if (downloadError) {
    throw new Error(`Download failed for ${bucket}/${object.path}: ${downloadError.message}`);
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  const contentType = inferContentType(object.path, object.metadata);
  const { error: uploadError } = await targetClient.storage
    .from(bucket)
    .upload(object.path, buffer, {
      contentType,
      upsert: options.upsert,
    });

  if (uploadError) {
    throw new Error(`Upload failed for ${bucket}/${object.path}: ${uploadError.message}`);
  }

  return buffer.byteLength;
}

async function copyWithConcurrency(items, concurrency, worker) {
  const results = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
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
  const sourceClient = createSupabaseClient("SOURCE");
  const targetClient = createSupabaseClient("TARGET");
  const summary = [];

  console.log(
    `Copying Supabase Storage buckets: ${options.buckets.join(", ")}${options.dryRun ? " (dry run)" : ""}`,
  );

  for (const bucket of options.buckets) {
    await ensureBucket(sourceClient, targetClient, bucket);

    const objects = await listObjects(sourceClient, bucket);
    const totalSize = objects.reduce((total, object) => {
      const size = Number(object.metadata?.size ?? object.metadata?.contentLength ?? 0);
      return total + (Number.isFinite(size) ? size : 0);
    }, 0);

    console.log(
      `Bucket ${bucket}: ${objects.length} object(s), listed size ${formatBytes(totalSize)}`,
    );

    if (options.dryRun || objects.length === 0) {
      summary.push({ bucket, copied: 0, bytes: 0, listed: objects.length });
      continue;
    }

    let copied = 0;
    let copiedBytes = 0;

    await copyWithConcurrency(objects, options.concurrency, async (object, index) => {
      const bytes = await copyObject(sourceClient, targetClient, bucket, object, options);
      copied += 1;
      copiedBytes += bytes;

      if (copied === objects.length || copied % 10 === 0) {
        console.log(
          `Bucket ${bucket}: copied ${copied}/${objects.length} (${formatBytes(copiedBytes)})`,
        );
      }

      return { index, path: object.path, bytes };
    });

    summary.push({ bucket, copied, bytes: copiedBytes, listed: objects.length });
  }

  console.log("Storage copy summary:");

  for (const item of summary) {
    console.log(
      `- ${item.bucket}: listed ${item.listed}, copied ${item.copied}, bytes ${formatBytes(item.bytes)}`,
    );
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
