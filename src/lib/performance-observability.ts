const PUBLIC_ROUTES = new Set([
  "about",
  "cooperate",
  "events",
  "join",
  "members",
  "news",
  "projects",
  "sponsors",
  "updates",
  "works",
]);

export function normalizeObservedRoute(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const [section] = segments;

  if (PUBLIC_ROUTES.has(section)) {
    return segments.length === 1 ? `/${section}` : `/${section}/*`;
  }

  if (section === "api" || section === "admin" || section === "account") {
    return `/${section}/*`;
  }

  return "/other";
}
