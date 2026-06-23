import { NextResponse } from "next/server";

const REMOTE_CASE_LIBRARY_BASE_URL = "http://abbs.fun:25181";
const REMOTE_IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
const IMAGE_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

function getAllowedRemoteImageUrl(src: string | null) {
  if (!src) {
    return null;
  }

  try {
    const url = new URL(src);
    const baseUrl = new URL(REMOTE_CASE_LIBRARY_BASE_URL);

    if (url.protocol !== "http:" || url.host !== baseUrl.host) {
      return null;
    }

    if (!url.pathname.startsWith("/uploads/")) {
      return null;
    }

    if (!REMOTE_IMAGE_EXTENSION_PATTERN.test(url.pathname)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const imageUrl = getAllowedRemoteImageUrl(requestUrl.searchParams.get("src"));

  if (!imageUrl) {
    return NextResponse.json({ error: "invalid_image_url" }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      next: { revalidate: 86400 },
    });

    if (!response.ok || !response.body) {
      return NextResponse.json({ error: "image_not_found" }, { status: 404 });
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "invalid_image_type" }, { status: 415 });
    }

    const headers = new Headers({
      "cache-control": IMAGE_CACHE_CONTROL,
      "content-type": contentType,
    });
    const contentLength = response.headers.get("content-length");

    if (contentLength) {
      headers.set("content-length", contentLength);
    }

    return new Response(response.body, { headers });
  } catch {
    return NextResponse.json({ error: "image_fetch_failed" }, { status: 502 });
  }
}
