import Link from "next/link";

import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { navItems } from "@/lib/site-data";
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <SiteLogoMark className="brand-mark-icon" />
          </span>
          <span className="brand-copy">
            <strong>常州 AI 开发者社区</strong>
            <small>Changzhou AI Club</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/join" className="button button-secondary">
            加入社群
          </Link>
          <Link href="/cooperate" className="button">
            提交合作需求
          </Link>
          <SiteAccountEntry />
        </div>
      </div>
    </header>
  );
}
