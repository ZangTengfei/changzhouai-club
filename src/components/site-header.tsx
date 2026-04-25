"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileMenuToggle } from "@/components/mobile-menu-toggle";
import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { navItems, siteRepositoryUrl } from "@/lib/site-data";
import { cssModuleCx } from "@/lib/utils";
import styles from "./site-header.module.css";

const cx = cssModuleCx.bind(null, styles);

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={cx("site-header")}>
      <div className={cx("container header-inner")}>
        <Link href="/" className={cx("brand")}>
          <span className={cx("brand-mark")}>
            <SiteLogoMark className={cx("brand-mark-icon")} />
          </span>
          <span className={cx("brand-copy")}>
            <strong>常州 AI Club</strong>
            <small>ChangzhouAI.Club</small>
          </span>
        </Link>

        <nav id="site-navigation" className={cx("nav-links")} aria-label="主导航">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? styles["nav-link-active"] : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={cx("header-actions")}>
          <Link
            href={siteRepositoryUrl}
            className={cx("github-nav-button")}
            target="_blank"
            rel="noreferrer"
            aria-label="打开 GitHub 仓库"
            title="GitHub 仓库"
          >
            <SocialPlatformIcon tone="github" className={cx("github-nav-icon")} />
            <span>GitHub</span>
          </Link>
          <Link href="/join" className={cx("button header-join-button")}>
            加入社区
          </Link>
        </div>

        <div className={cx("header-top-actions")}>
          <SiteAccountEntry />
          <MobileMenuToggle controlsId="site-navigation" />
        </div>
      </div>
    </header>
  );
}
