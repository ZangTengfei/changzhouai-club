import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://changzhouai.club"),
  title: {
    default: "常州 AI 社区",
    template: "%s | 常州 AI 社区",
  },
  description:
    "连接常州的开发者、产品人、创业者与企业需求，定期组织线下交流、主题分享与项目共建。",
  openGraph: {
    title: "常州 AI 社区",
    description:
      "一个立足常州本地的 AI 开发者社区，关注线下交流、项目共建与企业合作。",
    url: "https://changzhouai.club",
    siteName: "常州 AI 社区",
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="site-shell">
          <SiteHeader />
          <main className="container site-main">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
