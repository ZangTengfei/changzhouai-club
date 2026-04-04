"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import {
  normalizeSiteTheme,
  parseSiteTheme,
  SITE_THEME_STORAGE_KEY,
  THEME_QUERY_PARAM,
} from "@/lib/theme";

export function ThemeQuerySync() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlTheme = parseSiteTheme(searchParams.get(THEME_QUERY_PARAM));

    try {
      if (urlTheme) {
        document.documentElement.dataset.theme = urlTheme;
        window.localStorage.setItem(SITE_THEME_STORAGE_KEY, urlTheme);
        return;
      }

      const storedTheme = normalizeSiteTheme(
        window.localStorage.getItem(SITE_THEME_STORAGE_KEY),
      );
      document.documentElement.dataset.theme = storedTheme;
    } catch {
      document.documentElement.dataset.theme = "warm";
    }
  }, [searchParams]);

  return null;
}
