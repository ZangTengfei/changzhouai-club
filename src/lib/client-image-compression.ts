type ImageCompressionOptions = {
  maxDimension?: number;
  minDimension?: number;
  initialQuality?: number;
  minQuality?: number;
  targetBytes?: number;
  compressAboveBytes?: number;
  mimeType?: "image/jpeg" | "image/webp";
};

type LoadedImage =
  | {
      kind: "bitmap";
      source: ImageBitmap;
      width: number;
      height: number;
      cleanup: () => void;
    }
  | {
      kind: "element";
      source: HTMLImageElement;
      width: number;
      height: number;
      cleanup: () => void;
    };

export type CompressedImageResult = {
  file: File;
  didCompress: boolean;
  originalSize: number;
  compressedSize: number;
};

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxDimension: 2200,
  minDimension: 1200,
  initialQuality: 0.82,
  minQuality: 0.68,
  targetBytes: 2.5 * 1024 * 1024,
  compressAboveBytes: 1.5 * 1024 * 1024,
  mimeType: "image/jpeg",
};

const UNSAFE_CANVAS_TYPES = new Set(["image/gif", "image/svg+xml"]);

function shouldAttemptCompression(file: File, options: Required<ImageCompressionOptions>) {
  return (
    file.type.startsWith("image/") &&
    !UNSAFE_CANVAS_TYPES.has(file.type) &&
    file.size > options.compressAboveBytes
  );
}

function getCompressedFileName(fileName: string, mimeType: string) {
  const extension = mimeType === "image/webp" ? "webp" : "jpg";
  const baseName = fileName.replace(/\.[^.]+$/, "") || "upload";

  return `${baseName}-compressed.${extension}`;
}

function getTargetSize(width: number, height: number, maxDimension: number) {
  const largestSide = Math.max(width, height);

  if (largestSide <= maxDimension) {
    return { width, height };
  }

  const ratio = maxDimension / largestSide;

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function loadImage(file: File): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    try {
      const source = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });

      return {
        kind: "bitmap",
        source,
        width: source.width,
        height: source.height,
        cleanup: () => source.close(),
      };
    } catch {
      // Fall through to the image element path for browsers or file types that
      // do not support createImageBitmap decoding.
    }
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const source = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image_decode_failed"));
      image.src = objectUrl;
    });

    return {
      kind: "element",
      source,
      width: source.naturalWidth,
      height: source.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

async function renderCompressedBlob({
  image,
  width,
  height,
  mimeType,
  quality,
}: {
  image: LoadedImage;
  width: number;
  height: number;
  mimeType: string;
  quality: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: mimeType !== "image/jpeg",
  });

  if (!context) {
    return null;
  }

  if (mimeType === "image/jpeg") {
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image.source, 0, 0, width, height);

  return canvasToBlob(canvas, mimeType, quality);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {},
): Promise<CompressedImageResult> {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };

  if (!shouldAttemptCompression(file, resolvedOptions)) {
    return {
      file,
      didCompress: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  let image: LoadedImage;

  try {
    image = await loadImage(file);
  } catch {
    return {
      file,
      didCompress: false,
      originalSize: file.size,
      compressedSize: file.size,
    };
  }

  try {
    let { width, height } = getTargetSize(
      image.width,
      image.height,
      resolvedOptions.maxDimension,
    );
    let quality = resolvedOptions.initialQuality;
    let bestBlob = await renderCompressedBlob({
      image,
      width,
      height,
      mimeType: resolvedOptions.mimeType,
      quality,
    });

    while (
      bestBlob &&
      bestBlob.size > resolvedOptions.targetBytes &&
      quality > resolvedOptions.minQuality
    ) {
      quality = Math.max(resolvedOptions.minQuality, quality - 0.08);
      bestBlob = await renderCompressedBlob({
        image,
        width,
        height,
        mimeType: resolvedOptions.mimeType,
        quality,
      });
    }

    while (
      bestBlob &&
      bestBlob.size > resolvedOptions.targetBytes &&
      Math.max(width, height) > resolvedOptions.minDimension
    ) {
      const nextSize = getTargetSize(
        width,
        height,
        Math.max(resolvedOptions.minDimension, Math.round(Math.max(width, height) * 0.82)),
      );

      width = nextSize.width;
      height = nextSize.height;
      bestBlob = await renderCompressedBlob({
        image,
        width,
        height,
        mimeType: resolvedOptions.mimeType,
        quality: resolvedOptions.minQuality,
      });
    }

    if (!bestBlob || bestBlob.size >= file.size) {
      return {
        file,
        didCompress: false,
        originalSize: file.size,
        compressedSize: file.size,
      };
    }

    const compressedFile = new File(
      [bestBlob],
      getCompressedFileName(file.name, resolvedOptions.mimeType),
      {
        type: bestBlob.type || resolvedOptions.mimeType,
        lastModified: file.lastModified,
      },
    );

    return {
      file: compressedFile,
      didCompress: true,
      originalSize: file.size,
      compressedSize: compressedFile.size,
    };
  } finally {
    image.cleanup();
  }
}
