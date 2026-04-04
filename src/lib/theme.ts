export const THEME_QUERY_PARAM = "theme";
export const SITE_THEME_HEADER = "x-site-theme";

export const siteThemes = ["warm", "blue"] as const;

export type SiteTheme = (typeof siteThemes)[number];

export function normalizeSiteTheme(value: string | null | undefined): SiteTheme {
  return value === "blue" ? "blue" : "warm";
}
