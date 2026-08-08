import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AppToaster } from "@/components/app-toaster";
import { StaleBuildReloadGuard } from "@/components/stale-build-reload-guard";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SOCIAL_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";

import "./globals.css";

function shouldRenderVercelInsights() {
  const configured = process.env.ENABLE_VERCEL_INSIGHTS;

  if (configured) {
    return configured === "true";
  }

  return process.env.VERCEL === "1";
}

function getUmamiConfig() {
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL?.trim();
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

  if (!scriptUrl || !websiteId) {
    return null;
  }

  return {
    scriptUrl,
    websiteId,
    domains: process.env.NEXT_PUBLIC_UMAMI_DOMAINS?.trim() || undefined,
  };
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
  },
  alternates: {
    canonical: SITE_URL,
  },
  description: DEFAULT_SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_SOCIAL_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_SOCIAL_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const renderVercelInsights = shouldRenderVercelInsights();
  const umamiConfig = getUmamiConfig();

  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      data-theme="warm"
      suppressHydrationWarning
    >
      <body>
        <AppToaster />
        <StaleBuildReloadGuard />
        {children}
        {umamiConfig ? (
          <Script
            id="umami-analytics"
            src={umamiConfig.scriptUrl}
            strategy="afterInteractive"
            data-website-id={umamiConfig.websiteId}
            data-domains={umamiConfig.domains}
          />
        ) : null}
        {renderVercelInsights ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
