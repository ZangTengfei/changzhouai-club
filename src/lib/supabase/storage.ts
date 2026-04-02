export const EVENT_ASSETS_BUCKET = "event-assets";
export const MEMBER_AVATARS_BUCKET = "member-avatars";

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_.]/g, "");
}

export function buildHistoricalEventAssetPath(fileName: string) {
  return `events/historical/${sanitizeSegment(fileName)}`;
}

export function buildEventAssetPath(eventSlug: string, fileName: string) {
  const safeEventSlug = sanitizeSegment(eventSlug || "event");
  const safeFileName = sanitizeSegment(fileName || "upload.jpg");
  const timestamp = Date.now();

  return `events/${safeEventSlug}/${timestamp}-${safeFileName}`;
}

export function buildMemberAvatarPath(userId: string) {
  const safeUserId = sanitizeSegment(userId || "member");
  return `${safeUserId}/avatar`;
}

export function getStoragePublicUrl(supabaseUrl: string, bucket: string, path: string) {
  const normalizedBase = supabaseUrl.replace(/\/$/, "");
  return `${normalizedBase}/storage/v1/object/public/${bucket}/${path}`;
}
