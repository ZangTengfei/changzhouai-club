import "server-only";

import COS from "cos-nodejs-sdk-v5";

type TencentCosConfig = {
  secretId: string;
  secretKey: string;
  region: string;
  bucket: string;
};

type UploadTencentCosObjectOptions = {
  key: string;
  body: COS.PutObjectParams["Body"];
  contentLength?: number;
  contentType?: string;
  cacheControl?: string;
  contentDisposition?: string;
  acl?: COS.ObjectACL;
};

let cosClient: COS | null = null;

function getRequiredEnv(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required Tencent COS environment variable: ${name}`);
  }

  return value;
}

function normalizeObjectKey(key: string) {
  const normalizedKey = key.trim();

  if (!normalizedKey || normalizedKey.startsWith("/")) {
    throw new Error("Tencent COS object key must be non-empty and must not start with '/'.");
  }

  return normalizedKey;
}

export function getTencentCosConfig(): TencentCosConfig {
  return {
    secretId: getRequiredEnv("TENCENT_COS_SECRET_ID"),
    secretKey: getRequiredEnv("TENCENT_COS_SECRET_KEY"),
    region: getRequiredEnv("TENCENT_COS_REGION"),
    bucket: getRequiredEnv("TENCENT_COS_BUCKET"),
  };
}

export function getTencentCosClient() {
  if (cosClient) {
    return cosClient;
  }

  const { secretId, secretKey } = getTencentCosConfig();
  cosClient = new COS({
    SecretId: secretId,
    SecretKey: secretKey,
  });

  return cosClient;
}

export async function uploadTencentCosObject({
  key,
  body,
  contentLength,
  contentType,
  cacheControl,
  contentDisposition,
  acl,
}: UploadTencentCosObjectOptions) {
  const { bucket, region } = getTencentCosConfig();

  return getTencentCosClient().putObject({
    Bucket: bucket,
    Region: region,
    Key: normalizeObjectKey(key),
    Body: body,
    ContentLength: contentLength,
    ContentType: contentType,
    CacheControl: cacheControl,
    ContentDisposition: contentDisposition,
    ACL: acl,
  });
}

export async function headTencentCosObject(key: string) {
  const { bucket, region } = getTencentCosConfig();

  return getTencentCosClient().headObject({
    Bucket: bucket,
    Region: region,
    Key: normalizeObjectKey(key),
  });
}

export async function deleteTencentCosObject(key: string) {
  const { bucket, region } = getTencentCosConfig();

  return getTencentCosClient().deleteObject({
    Bucket: bucket,
    Region: region,
    Key: normalizeObjectKey(key),
  });
}

export async function getTencentCosObject(key: string) {
  const { bucket, region } = getTencentCosConfig();

  return getTencentCosClient().getObject({
    Bucket: bucket,
    Region: region,
    Key: normalizeObjectKey(key),
  });
}

export function getTencentCosSignedObjectUrl(
  key: string,
  expiresSeconds = 5 * 60,
) {
  const { bucket, region } = getTencentCosConfig();

  return getTencentCosClient().getObjectUrl({
    Bucket: bucket,
    Region: region,
    Key: normalizeObjectKey(key),
    Sign: true,
    Method: "GET",
    Expires: expiresSeconds,
    Protocol: "https:",
  });
}
