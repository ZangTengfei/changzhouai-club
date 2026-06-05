type PublicImageTransformOptions = {
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
    width: 1120,
    height: 768,
    quality: 78,
    resize: "cover",
  },
  "hero-thumb": {
    width: 320,
    height: 192,
    quality: 72,
    resize: "cover",
  },
  "review-card": {
    width: 720,
    height: 480,
    quality: 74,
    resize: "cover",
  },
  "event-feature": {
    width: 960,
    height: 540,
    quality: 78,
    resize: "cover",
  },
  "event-detail-hero": {
    width: 1600,
    height: 900,
    quality: 82,
    resize: "cover",
  },
  gallery: {
    width: 1280,
    quality: 76,
  },
  archive: {
    width: 720,
    height: 405,
    quality: 74,
    resize: "cover",
  },
};

function getConfiguredSupabaseOrigin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return null;
  }
}

function isKnownSupabaseStorageUrl(url: URL) {
  if (url.hostname.endsWith(".supabase.co")) {
    return true;
  }

  return url.origin === getConfiguredSupabaseOrigin();
}

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

  if (!isKnownSupabaseStorageUrl(url)) {
    return imageUrl;
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

export function getAvatarImageUrl(imageUrl: string | null | undefined) {
  return getPublicImageUrl(imageUrl, {
    width: 160,
    height: 160,
    quality: 72,
    resize: "cover",
  });
}

export function getWorkCoverImageUrl(imageUrl: string | null | undefined) {
  return getPublicImageUrl(imageUrl, {
    width: 720,
    height: 405,
    quality: 76,
    resize: "cover",
  });
}

export function getCommunityUpdateImageUrl(imageUrl: string | null | undefined) {
  return getPublicImageUrl(imageUrl, {
    width: 960,
    quality: 76,
  });
}

export function getSponsorLogoImageUrl(imageUrl: string | null | undefined) {
  return getPublicImageUrl(imageUrl, {
    width: 320,
    height: 160,
    quality: 78,
    resize: "contain",
  });
}

export function getSponsorImageUrl(imageUrl: string | null | undefined) {
  return getPublicImageUrl(imageUrl, {
    width: 1200,
    quality: 76,
  });
}

export function getWechatQrCodeImageUrl(imageUrl: string | null | undefined) {
  return getPublicImageUrl(imageUrl, {
    width: 720,
    quality: 78,
  });
}
