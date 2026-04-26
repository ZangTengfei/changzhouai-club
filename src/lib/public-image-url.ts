type PublicImageTransformOptions = {
  transform?: boolean;
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

type EventImageVariant =
  | "hero-main"
  | "hero-thumb"
  | "review-card"
  | "event-feature"
  | "event-detail-hero"
  | "gallery"
  | "archive";

const SUPABASE_OBJECT_PUBLIC_PATH = "/storage/v1/object/public/";
const SUPABASE_RENDER_PUBLIC_PATH = "/storage/v1/render/image/public/";

const eventImageVariantMap: Record<EventImageVariant, PublicImageTransformOptions> = {
  "hero-main": {
    width: 1280,
    height: 876,
    quality: 82,
    resize: "cover",
  },
  "hero-thumb": {
    width: 320,
    height: 192,
    quality: 72,
    resize: "cover",
  },
  "review-card": {
    transform: false,
  },
  "event-feature": {
    transform: false,
  },
  "event-detail-hero": {
    transform: false,
  },
  gallery: {
    transform: false,
  },
  archive: {
    transform: false,
  },
};

export function getPublicImageUrl(
  imageUrl: string | null | undefined,
  options: PublicImageTransformOptions = {},
) {
  if (!imageUrl) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(imageUrl);
  } catch {
    return imageUrl;
  }

  if (!url.hostname.endsWith(".supabase.co")) {
    return imageUrl;
  }

  if (options.transform === false) {
    if (url.pathname.startsWith(SUPABASE_RENDER_PUBLIC_PATH)) {
      url.pathname = url.pathname.replace(
        SUPABASE_RENDER_PUBLIC_PATH,
        SUPABASE_OBJECT_PUBLIC_PATH,
      );
    } else if (!url.pathname.startsWith(SUPABASE_OBJECT_PUBLIC_PATH)) {
      return imageUrl;
    }

    url.searchParams.delete("width");
    url.searchParams.delete("height");
    url.searchParams.delete("quality");
    url.searchParams.delete("resize");

    return url.toString();
  }

  if (url.pathname.startsWith(SUPABASE_OBJECT_PUBLIC_PATH)) {
    url.pathname = url.pathname.replace(
      SUPABASE_OBJECT_PUBLIC_PATH,
      SUPABASE_RENDER_PUBLIC_PATH,
    );
  } else if (!url.pathname.startsWith(SUPABASE_RENDER_PUBLIC_PATH)) {
    return imageUrl;
  }

  url.searchParams.delete("width");
  url.searchParams.delete("height");
  url.searchParams.delete("quality");
  url.searchParams.delete("resize");

  if (options.width) {
    url.searchParams.set("width", String(options.width));
  }

  if (options.height) {
    url.searchParams.set("height", String(options.height));
  }

  if (options.quality) {
    url.searchParams.set("quality", String(options.quality));
  }

  if (options.resize) {
    url.searchParams.set("resize", options.resize);
  }

  return url.toString();
}

export function getEventImageUrl(
  imageUrl: string | null | undefined,
  variant: EventImageVariant,
) {
  return getPublicImageUrl(imageUrl, eventImageVariantMap[variant]);
}
