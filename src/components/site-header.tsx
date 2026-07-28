"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MobileMenuToggle } from "@/components/mobile-menu-toggle";
import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { hasSupabaseEnv } from "@/lib/env";
import { navItems, siteNameEn } from "@/lib/site-data";
import { cssModuleCx } from "@/lib/utils";
import styles from "./site-header.module.css";

const cx = cssModuleCx.bind(null, styles);

function isMobileNavigationMode() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;
}

export function SiteHeader() {
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(!hasSupabaseEnv());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingNavHref, setPendingNavHref] = useState<string | null>(null);
  const shouldShowJoinButton = authReady && !isAuthenticated;
  const handleAuthStateChange = useCallback((nextIsAuthenticated: boolean) => {
    setIsAuthenticated(nextIsAuthenticated);
    setAuthReady(true);
  }, []);
  const closeAllMenus = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);
  const handleNavLinkClick = useCallback((href: string) => {
    if (isMobileNavigationMode()) {
      closeAllMenus();

      if (!href.startsWith("#") && href !== pathname) {
        setPendingNavHref(href);
      }
    }
  }, [closeAllMenus, pathname]);
  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((current) => !current);
  }, []);

  useEffect(() => {
    closeAllMenus();
    setPendingNavHref(null);
  }, [closeAllMenus, pathname]);

  useEffect(() => {
    if (!pendingNavHref) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPendingNavHref(null);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pendingNavHref]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={cx("site-header")}
      data-home-header={pathname === "/" ? "true" : undefined}
    >
      <div
        className={cx("container header-inner")}
        data-mobile-menu-open={mobileMenuOpen ? "true" : "false"}
        data-nav-pending={pendingNavHref ? "true" : "false"}
      >
        <Link href="/" prefetch={false} className={cx("brand")}>
          <span className={cx("brand-mark")}>
            <SiteLogoMark className={cx("brand-mark-icon")} />
          </span>
          <span className={cx("brand-copy")}>
            <strong>常州 AI Club</strong>
            <small>{siteNameEn}</small>
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
                prefetch={false}
                className={isActive ? styles["nav-link-active"] : undefined}
                aria-current={isActive ? "page" : undefined}
                data-pending={pendingNavHref === item.href ? "true" : undefined}
                onClick={() => handleNavLinkClick(item.href)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {shouldShowJoinButton ? (
          <div className={cx("header-actions")}>
            <Link href="/join" prefetch={false} className={cx("button header-join-button")}>
              申请加入
            </Link>
          </div>
        ) : null}

        <div className={cx("header-top-actions")}>
          <SiteAccountEntry onAuthStateChange={handleAuthStateChange} />
          <MobileMenuToggle
            controlsId="site-navigation"
            open={mobileMenuOpen}
            pending={Boolean(pendingNavHref)}
            onToggle={handleMobileMenuToggle}
          />
        </div>
      </div>
    </header>
  );
}
