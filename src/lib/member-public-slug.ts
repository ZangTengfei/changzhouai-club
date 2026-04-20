export const MEMBER_PUBLIC_SLUG_RESERVED_WORDS = new Set([
  "about",
  "account",
  "admin",
  "api",
  "archive",
  "cooperate",
  "docs",
  "edit",
  "events",
  "faq",
  "join",
  "login",
  "members",
  "new",
  "projects",
  "sponsors",
]);

const MEMBER_PUBLIC_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidLike(value: string) {
  return UUID_PATTERN.test(value.trim());
}

export function normalizeMemberPublicSlug(raw: string) {
  const value = raw.trim().toLowerCase();

  return value || null;
}

export function isValidMemberPublicSlug(slug: string) {
  return (
    MEMBER_PUBLIC_SLUG_PATTERN.test(slug) &&
    !isUuidLike(slug) &&
    !MEMBER_PUBLIC_SLUG_RESERVED_WORDS.has(slug)
  );
}

export function getMemberPublicSlugPath(member: {
  id: string;
  publicSlug?: string | null;
}) {
  return `/members/${member.publicSlug?.trim() || member.id}`;
}
