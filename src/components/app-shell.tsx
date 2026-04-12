"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDocsRoute = pathname === "/docs" || pathname.startsWith("/docs/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isDocsRoute || isAdminRoute) {
    return children;
  }

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="container site-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
