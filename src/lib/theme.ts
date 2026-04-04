export const THEME_QUERY_PARAM = "theme";
export const SITE_THEME_STORAGE_KEY = "site-theme";

export const siteThemes = ["warm", "blue"] as const;

export type SiteTheme = (typeof siteThemes)[number];

export function parseSiteTheme(
  value: string | null | undefined,
): SiteTheme | null {
  return value === "warm" || value === "blue" ? value : null;
}

export function normalizeSiteTheme(value: string | null | undefined): SiteTheme {
  return parseSiteTheme(value) ?? "warm";
}
