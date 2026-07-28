import { randomUUID } from "node:crypto";

import COS from "cos-nodejs-sdk-v5";

const REQUIRED_ENV_NAMES = [
  "TENCENT_COS_SECRET_ID",
  "TENCENT_COS_SECRET_KEY",
  "TENCENT_COS_REGION",
  "TENCENT_COS_BUCKET",
  "NEXT_PUBLIC_IMAGE_CDN_URL",
];

function getRequiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required Tencent COS environment variable: ${name}`);
  }

  return value;
}

async function main() {
  for (const name of REQUIRED_ENV_NAMES) {
    getRequiredEnv(name);
  }

  const bucket = getRequiredEnv("TENCENT_COS_BUCKET");
  const region = getRequiredEnv("TENCENT_COS_REGION");
  const cdnBaseUrl = getRequiredEnv("NEXT_PUBLIC_IMAGE_CDN_URL").replace(/\/$/, "");
  const body = Buffer.from(`changzhouai-club COS SDK verification ${new Date().toISOString()}\n`);
  const key = `system/sdk-verification/${Date.now()}-${randomUUID()}.txt`;
  const cos = new COS({
    SecretId: getRequiredEnv("TENCENT_COS_SECRET_ID"),
    SecretKey: getRequiredEnv("TENCENT_COS_SECRET_KEY"),
  });
  let uploaded = false;
  let verificationResult = null;

  try {
    const uploadResult = await cos.putObject({
      Bucket: bucket,
      Region: region,
      Key: key,
      Body: body,
      ContentLength: body.byteLength,
      ContentType: "text/plain; charset=utf-8",
      CacheControl: "no-store",
    });
    uploaded = true;

    const [headResult, downloadResult] = await Promise.all([
      cos.headObject({ Bucket: bucket, Region: region, Key: key }),
      cos.getObject({ Bucket: bucket, Region: region, Key: key }),
    ]);

    if (!Buffer.isBuffer(downloadResult.Body) || !downloadResult.Body.equals(body)) {
      throw new Error("Tencent COS downloaded content did not match the uploaded object.");
    }

    const originUrl = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
    const originResponse = await fetch(originUrl);

    if (originResponse.status !== 403) {
      throw new Error(
        `Tencent COS origin unexpectedly returned HTTP ${originResponse.status}; expected 403 for a private bucket.`,
      );
    }

    const cdnResponse = await fetch(`${cdnBaseUrl}/${key}`);
    const cdnBody = Buffer.from(await cdnResponse.arrayBuffer());

    if (!cdnResponse.ok || !cdnBody.equals(body)) {
      throw new Error(
        `Tencent CDN verification failed with HTTP ${cdnResponse.status}.`,
      );
    }

    verificationResult = {
      ok: true,
      bucket,
      region,
      uploadStatus: uploadResult.statusCode ?? 200,
      headStatus: headResult.statusCode ?? 200,
      downloadStatus: downloadResult.statusCode ?? 200,
      privateOriginStatus: originResponse.status,
      cdnStatus: cdnResponse.status,
    };
  } finally {
    if (uploaded) {
      const deleteResult = await cos.deleteObject({ Bucket: bucket, Region: region, Key: key });

      if (verificationResult) {
        verificationResult.deleteStatus = deleteResult.statusCode ?? 204;
      }
    }
  }

  console.log(JSON.stringify(verificationResult, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Tencent COS verification failed.";
  console.error(message);
  process.exitCode = 1;
});
