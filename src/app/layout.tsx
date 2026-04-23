import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { AppToaster } from "@/components/app-toaster";
import { ThemeQuerySync } from "@/components/theme-query-sync";
import { SITE_THEME_STORAGE_KEY, THEME_QUERY_PARAM } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://changzhouai.club"),
  title: {
    default: "常州 AI Club",
    template: "%s | 常州 AI Club",
  },
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
  },
  description:
    "连接常州的开发者、产品人、创业者、高校同学与企业伙伴，持续组织线下交流、主题分享与合作对接。",
  openGraph: {
    title: "常州 AI Club",
    description:
      "一个立足常州本地的 AI 开发者社区，关注线下交流、成员连接与企业合作。",
    url: "https://changzhouai.club",
    siteName: "常州 AI Club",
    locale: "zh_CN",
    type: "website",
  },
};

const themeInitScript = `
  (function() {
    var defaultTheme = "warm";

    try {
      var params = new URLSearchParams(window.location.search);
      var urlTheme = params.get("${THEME_QUERY_PARAM}");

      if (urlTheme === "warm" || urlTheme === "blue") {
        document.documentElement.dataset.theme = urlTheme;
        window.localStorage.setItem("${SITE_THEME_STORAGE_KEY}", urlTheme);
        return;
      }

      var storedTheme = window.localStorage.getItem("${SITE_THEME_STORAGE_KEY}");
      document.documentElement.dataset.theme =
        storedTheme === "warm" || storedTheme === "blue"
          ? storedTheme
          : defaultTheme;
    } catch {
      document.documentElement.dataset.theme = defaultTheme;
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      data-theme="warm"
      suppressHydrationWarning
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Suspense fallback={null}>
          <ThemeQuerySync />
        </Suspense>
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
