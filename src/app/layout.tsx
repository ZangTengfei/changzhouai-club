import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeQuerySync } from "@/components/theme-query-sync";
import { THEME_QUERY_PARAM } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://changzhouai.club"),
  title: {
    default: "常州 AI 社区",
    template: "%s | 常州 AI 社区",
  },
  description:
    "连接常州的开发者、产品人、创业者、高校同学与企业伙伴，持续组织线下交流、主题分享与合作对接。",
  openGraph: {
    title: "常州 AI 社区",
    description:
      "一个立足常州本地的 AI 开发者社区，关注线下交流、成员连接与企业合作。",
    url: "https://changzhouai.club",
    siteName: "常州 AI 社区",
    locale: "zh_CN",
    type: "website",
  },
};

const themeInitScript = `
  (function() {
    var params = new URLSearchParams(window.location.search);
    document.documentElement.dataset.theme =
      params.get("${THEME_QUERY_PARAM}") === "blue" ? "blue" : "warm";
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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Suspense fallback={null}>
          <ThemeQuerySync />
        </Suspense>
        <div className="site-shell">
          <SiteHeader />
          <main className="container site-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
