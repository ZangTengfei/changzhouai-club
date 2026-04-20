import Link from "next/link";

import { MobileMenuToggle } from "@/components/mobile-menu-toggle";
import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { navItems, siteRepositoryUrl } from "@/lib/site-data";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <SiteLogoMark className="brand-mark-icon" />
          </span>
          <span className="brand-copy">
            <strong>常州 AI Club</strong>
            <small>Changzhou AI Club</small>
          </span>
        </Link>

        <nav id="site-navigation" className="nav-links" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link
            href={siteRepositoryUrl}
            className="github-nav-button"
            target="_blank"
            rel="noreferrer"
            aria-label="打开 GitHub 仓库"
            title="GitHub 仓库"
          >
            <SocialPlatformIcon tone="github" className="github-nav-icon" />
            <span>GitHub</span>
          </Link>
          <Link href="/join" className="button button-secondary">
            加入社区
          </Link>
        </div>

        <div className="header-top-actions">
          <SiteAccountEntry />
          <MobileMenuToggle controlsId="site-navigation" />
        </div>
      </div>
    </header>
  );
}
