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
            <strong>常州 AI 社区</strong>
            <small>Changzhou AI Club</small>
          </span>
        </Link>

        <input
          id="site-navigation-toggle"
          type="checkbox"
          className="mobile-menu-state"
          aria-hidden="true"
        />

        <nav id="site-navigation" className="nav-links" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/join" className="button button-secondary">
            加入社区
          </Link>
        </div>

        <div className="header-top-actions">
          <SiteAccountEntry />
          <label
            htmlFor="site-navigation-toggle"
            className="mobile-menu-toggle"
            aria-label="展开主导航"
          >
            <span />
            <span />
            <span />
          </label>
        </div>
      </div>
    </header>
  );
}
