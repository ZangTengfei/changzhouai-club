import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { getPublicSiteUrl } from "@/lib/env";

const SIGNATURE_TTL_SECONDS = 5 * 60;
const MAX_SIGNATURE_TTL_SECONDS = 10 * 60;

function getSigningSecret() {
  const secret = process.env.TENCENT_COS_SECRET_KEY?.trim();
  if (!secret) throw new Error("private_asset_signing_not_configured");
  return secret;
}

function createSignature(eventId: string, expiresAt: number) {
  return createHmac("sha256", getSigningSecret())
    .update(`${eventId}\n${expiresAt}`)
    .digest("hex");
}

export function buildPrivateEventGroupQrUrl(eventId: string) {
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) throw new Error("site_url_not_configured");

  const expiresAt = Math.floor(Date.now() / 1000) + SIGNATURE_TTL_SECONDS;
  const url = new URL(
    `/api/private-assets/event-group-qr/${encodeURIComponent(eventId)}`,
    siteUrl,
  );
  url.searchParams.set("expires", String(expiresAt));
  url.searchParams.set("signature", createSignature(eventId, expiresAt));
  return url.toString();
}

export function verifyPrivateEventGroupQrUrl(
  eventId: string,
  expiresValue: string | null,
  signature: string | null,
) {
  const expiresAt = Number(expiresValue);
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isInteger(expiresAt) ||
    expiresAt < now ||
    expiresAt > now + MAX_SIGNATURE_TTL_SECONDS ||
    !signature
  ) {
    return false;
  }

  const expected = Buffer.from(createSignature(eventId, expiresAt), "utf8");
  const received = Buffer.from(signature, "utf8");
  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}
