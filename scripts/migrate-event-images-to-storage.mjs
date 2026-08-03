import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import COS from "cos-nodejs-sdk-v5";
import sharp from "sharp";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const EVENT_ASSETS_BUCKET = "event-assets";
const HISTORICAL_PREFIX = "events/historical";
const EVENTS_DIR = path.resolve(process.cwd(), "public/events");
const COS_BUCKET = process.env.TENCENT_COS_BUCKET;
const COS_REGION = process.env.TENCENT_COS_REGION;
const COS_SECRET_ID = process.env.TENCENT_COS_SECRET_ID;
const COS_SECRET_KEY = process.env.TENCENT_COS_SECRET_KEY;
const IMAGE_CDN_URL = process.env.NEXT_PUBLIC_IMAGE_CDN_URL?.replace(/\/$/, "");

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !COS_BUCKET ||
  !COS_REGION ||
  !COS_SECRET_ID ||
  !COS_SECRET_KEY ||
  !IMAGE_CDN_URL
) {
  throw new Error(
    "Missing Supabase database or Tencent COS configuration.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
const cos = new COS({ SecretId: COS_SECRET_ID, SecretKey: COS_SECRET_KEY });

function buildHistoricalPath(fileName) {
  const baseName = fileName.replace(/\.[^.]+$/, "").toLowerCase();
  return `${HISTORICAL_PREFIX}/${baseName}.webp`;
}

function buildPublicUrl(storagePath) {
  return `${IMAGE_CDN_URL}/${EVENT_ASSETS_BUCKET}/${storagePath}`;
}

async function uploadHistoricalImages() {
  const fileNames = (await readdir(EVENTS_DIR)).filter((fileName) =>
    /\.(jpe?g|png|webp)$/i.test(fileName),
  );

  const uploads = [];

  for (const fileName of fileNames) {
    const filePath = path.join(EVENTS_DIR, fileName);
    const storagePath = buildHistoricalPath(fileName);
    const input = await readFile(filePath);
    const body = await sharp(input)
      .rotate()
      .resize(2200, 2200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5, smartSubsample: true })
      .toBuffer();
    await cos.putObject({
      Bucket: COS_BUCKET,
      Region: COS_REGION,
      Key: `${EVENT_ASSETS_BUCKET}/${storagePath}`,
      Body: body,
      ContentLength: body.byteLength,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    });

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
