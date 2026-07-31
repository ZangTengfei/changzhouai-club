import "server-only";

import sharp from "sharp";

const QR_TARGET_BYTES = 190 * 1024;

function replaceImageExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "image";
  return `${baseName}.${extension}`;
}

function createWebpFile(body: Buffer, fileName: string) {
  return new File([Uint8Array.from(body)], replaceImageExtension(fileName, "webp"), {
    type: "image/webp",
  });
}

export async function optimizeAvatarUpload(file: File) {
  const body = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate()
    .resize(320, 320, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: true,
    })
    .webp({ quality: 78, effort: 5, smartSubsample: true })
    .toBuffer();

  return createWebpFile(body, file.name);
}

export async function optimizeQrCodeUpload(file: File) {
  const input = Buffer.from(await file.arrayBuffer());
  const variants = [
    { size: 960, quality: 82 },
    { size: 720, quality: 78 },
    { size: 480, quality: 74 },
  ];
  let body: Buffer = input;

  for (const variant of variants) {
    body = await sharp(input)
      .rotate()
      .resize(variant.size, variant.size, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: variant.quality,
        effort: 5,
        smartSubsample: true,
      })
      .toBuffer();

    if (body.byteLength <= QR_TARGET_BYTES) {
      break;
    }
  }

  return createWebpFile(body, file.name);
}
