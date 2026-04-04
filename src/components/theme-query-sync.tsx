"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { normalizeSiteTheme, THEME_QUERY_PARAM } from "@/lib/theme";

export function ThemeQuerySync() {
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.dataset.theme = normalizeSiteTheme(
      searchParams.get(THEME_QUERY_PARAM),
    );
  }, [searchParams]);

  return null;
}
