export const EVENT_ASSETS_BUCKET = "event-assets";
export const MEMBER_AVATARS_BUCKET = "member-avatars";
export const MEMBER_WORK_ASSETS_BUCKET = "member-work-assets";
export const COMMUNITY_UPDATE_ASSETS_BUCKET = "community-update-assets";

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

export function buildSponsorAssetPath(sponsorSlug: string, fileName: string) {
  const safeSponsorSlug = sanitizeSegment(sponsorSlug || "sponsor");
  const safeFileName = sanitizeSegment(fileName || "upload.jpg");
  const timestamp = Date.now();

  return `sponsors/${safeSponsorSlug}/${timestamp}-${safeFileName}`;
}

export function buildProjectAssetPath(projectSlug: string, fileName: string) {
  const safeProjectSlug = sanitizeSegment(projectSlug || "project");
  const safeFileName = sanitizeSegment(fileName || "upload.jpg");
  const timestamp = Date.now();

  return `projects/${safeProjectSlug}/${timestamp}-${safeFileName}`;
}

export function buildCommunityQrCodePath(fileName: string) {
  const safeFileName = sanitizeSegment(fileName || "wechat-qr.jpg");
  const timestamp = Date.now();

  return `community/wechat-qr/${timestamp}-${safeFileName}`;
}

export function buildWechatArticleAssetPath(fileName: string) {
  const safeFileName =
    sanitizeSegment(fileName || "wechat-article-image.jpg") ||
    "wechat-article-image.jpg";
  const timestamp = Date.now();
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `wechat-articles/${year}/${month}/${timestamp}-${safeFileName}`;
}

export function buildCommunityUpdateAssetPath(userId: string, fileName: string) {
  const safeUserId = sanitizeSegment(userId || "member");
  const safeFileName = sanitizeSegment(fileName || "upload.jpg") || "upload.jpg";
  const timestamp = Date.now();

  return `${safeUserId}/updates/${timestamp}-${safeFileName}`;
}

export function buildMemberWorkAssetPath(userId: string, fileName: string) {
  const safeUserId = sanitizeSegment(userId || "member");
  const safeFileName =
    sanitizeSegment(fileName || "work-image.jpg") || "work-image.jpg";
  const timestamp = Date.now();

  return `${safeUserId}/works/${timestamp}-${safeFileName}`;
}

export function buildMemberAvatarPath(userId: string) {
  const safeUserId = sanitizeSegment(userId || "member");
  return `${safeUserId}/avatar`;
}

export function getStoragePublicUrl(supabaseUrl: string, bucket: string, path: string) {
  const normalizedBase = supabaseUrl.replace(/\/$/, "");
  return `${normalizedBase}/storage/v1/object/public/${bucket}/${path}`;
}
