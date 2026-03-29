import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const EVENT_ASSETS_BUCKET = "event-assets";
const HISTORICAL_PREFIX = "events/historical";
const EVENTS_DIR = path.resolve(process.cwd(), "public/events");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function getContentType(fileName) {
  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

function buildHistoricalPath(fileName) {
  return `${HISTORICAL_PREFIX}/${fileName.toLowerCase()}`;
}

function buildPublicUrl(storagePath) {
  const normalizedBase = SUPABASE_URL.replace(/\/$/, "");
  return `${normalizedBase}/storage/v1/object/public/${EVENT_ASSETS_BUCKET}/${storagePath}`;
}

async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw error;
  }

  const existing = buckets.find((bucket) => bucket.id === EVENT_ASSETS_BUCKET);

  if (!existing) {
    const { error: createError } = await supabase.storage.createBucket(
      EVENT_ASSETS_BUCKET,
      {
        public: true,
      },
    );

    if (createError) {
      throw createError;
    }
  }
}

async function uploadHistoricalImages() {
  const fileNames = (await readdir(EVENTS_DIR)).filter((fileName) =>
    /\.(jpe?g|png|webp)$/i.test(fileName),
  );

  const uploads = [];

  for (const fileName of fileNames) {
    const filePath = path.join(EVENTS_DIR, fileName);
    const storagePath = buildHistoricalPath(fileName);
    const fileBuffer = await readFile(filePath);
    const { error } = await supabase.storage
      .from(EVENT_ASSETS_BUCKET)
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType: getContentType(fileName.toLowerCase()),
      });

    if (error) {
      throw error;
    }

    uploads.push({
      fileName,
      slug: fileName.replace(/\.[^.]+$/, ""),
      storagePath,
      publicUrl: buildPublicUrl(storagePath),
    });
  }

  return uploads;
}

async function syncDatabase(uploads) {
  const slugs = uploads.map((item) => item.slug);
  const { data: events, error } = await supabase
    .from("events")
    .select("id, slug, title")
    .in("slug", slugs);

  if (error) {
    throw error;
  }

  for (const upload of uploads) {
    const event = events.find((item) => item.slug === upload.slug);

    if (!event) {
      throw new Error(`Event not found for slug: ${upload.slug}`);
    }

    const { error: updateError } = await supabase
      .from("events")
      .update({ cover_image_url: upload.publicUrl })
      .eq("id", event.id);

    if (updateError) {
      throw updateError;
    }

    const { error: deleteError } = await supabase
      .from("event_photos")
      .delete()
      .eq("event_id", event.id);

    if (deleteError) {
      throw deleteError;
    }

    const { error: insertError } = await supabase.from("event_photos").insert({
      event_id: event.id,
      image_url: upload.publicUrl,
      caption: event.title,
      sort_order: 0,
    });

    if (insertError) {
      throw insertError;
    }
  }
}

async function main() {
  await ensureBucket();
  const uploads = await uploadHistoricalImages();
  await syncDatabase(uploads);

  console.log(
    JSON.stringify(
      uploads.map((item) => ({
        slug: item.slug,
        publicUrl: item.publicUrl,
      })),
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
