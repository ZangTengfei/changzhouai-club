import "server-only";

import { uploadTencentCosObject } from "@/lib/tencent-cos";
import { optimizePublicImageUpload } from "@/lib/uploaded-image-optimization";

type UploadPublicAssetOptions = {
  bucket: string;
  path: string;
  file: File;
  cacheControl?: string;
  optimizeImage?: boolean;
};

const DEFAULT_PUBLIC_ASSET_CACHE_CONTROL =
  "public, max-age=31536000, immutable";

function getPublicAssetBaseUrl() {
  const value = process.env.NEXT_PUBLIC_IMAGE_CDN_URL?.trim();

  if (!value) {
    throw new Error(
      "Missing required public asset environment variable: NEXT_PUBLIC_IMAGE_CDN_URL",
    );
  }

  return value.replace(/\/$/, "");
}

function normalizeKeySegment(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function replacePathExtension(path: string, extension: string) {
  const normalizedExtension = extension.replace(/^\./, "");
  const pathWithoutExtension = path.replace(/\.[^./]+$/, "");
  return `${pathWithoutExtension}.${normalizedExtension}`;
}

export function buildPublicAssetKey(bucket: string, path: string) {
  const normalizedBucket = normalizeKeySegment(bucket);
  const normalizedPath = normalizeKeySegment(path);

  if (!normalizedBucket || !normalizedPath) {
    throw new Error("Public asset bucket and path must be non-empty.");
  }

  return `${normalizedBucket}/${normalizedPath}`;
}

export function getPublicAssetUrl(key: string) {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${getPublicAssetBaseUrl()}/${encodedKey}`;
}

export async function uploadPublicAsset({
  bucket,
  path,
  file,
  cacheControl = DEFAULT_PUBLIC_ASSET_CACHE_CONTROL,
  optimizeImage = true,
}: UploadPublicAssetOptions) {
  const uploadFile = optimizeImage ? await optimizePublicImageUpload(file) : file;
  const uploadPath = uploadFile.type === "image/webp"
    ? replacePathExtension(path, "webp")
    : path;
  const key = buildPublicAssetKey(bucket, uploadPath);
  const body = Buffer.from(await uploadFile.arrayBuffer());

  await uploadTencentCosObject({
    key,
    body,
    contentLength: body.byteLength,
    contentType: uploadFile.type || "application/octet-stream",
    cacheControl,
  });

  return {
    key,
    publicUrl: getPublicAssetUrl(key),
    sourceBytes: file.size,
    uploadedBytes: body.byteLength,
  };
}
