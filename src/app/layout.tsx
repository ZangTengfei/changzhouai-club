import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppToaster } from "@/components/app-toaster";

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
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
