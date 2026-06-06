import type { ReactNode } from "react";

import { DomainTransitionNotice } from "@/components/domain-transition-notice";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <DomainTransitionNotice />
      <SiteHeader />
      <main className="container site-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
