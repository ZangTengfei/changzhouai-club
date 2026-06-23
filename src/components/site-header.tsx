"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  ChevronDown,
  FileText,
  Info,
} from "lucide-react";
import {
  type FocusEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { MobileMenuToggle } from "@/components/mobile-menu-toggle";
import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { hasSupabaseEnv } from "@/lib/env";
import { navItems, siteNameEn, siteRepositoryUrl } from "@/lib/site-data";
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
  const [docsMenuOpen, setDocsMenuOpen] = useState(false);
  const docsDropdownRef = useRef<HTMLDivElement>(null);
  const docsTriggerRef = useRef<HTMLAnchorElement>(null);
  const shouldShowJoinButton = authReady && !isAuthenticated;
  const handleAuthStateChange = useCallback((nextIsAuthenticated: boolean) => {
    setIsAuthenticated(nextIsAuthenticated);
    setAuthReady(true);
  }, []);
  const closeAllMenus = useCallback(() => {
    setMobileMenuOpen(false);
    setDocsMenuOpen(false);
  }, []);
  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((current) => {
      const nextOpen = !current;

      if (!nextOpen) {
        setDocsMenuOpen(false);
      }

      return nextOpen;
    });
  }, []);
  const handleDocsTriggerClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (!isMobileNavigationMode()) {
      return;
    }

    event.preventDefault();
    setDocsMenuOpen((current) => !current);
  }, []);
  const handleDocsMenuBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const nextFocused = event.relatedTarget as Node | null;

    if (nextFocused && event.currentTarget.contains(nextFocused)) {
      return;
    }

    setDocsMenuOpen(false);
  }, []);

  useEffect(() => {
    closeAllMenus();
  }, [closeAllMenus, pathname]);

  useEffect(() => {
    if (!mobileMenuOpen && !docsMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const shouldFocusDocsTrigger = docsMenuOpen;

        setDocsMenuOpen(false);
        setMobileMenuOpen(false);

        if (shouldFocusDocsTrigger) {
          docsTriggerRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [docsMenuOpen, mobileMenuOpen]);

  return (
    <header className={cx("site-header")}>
      <div
        className={cx("container header-inner")}
        data-mobile-menu-open={mobileMenuOpen ? "true" : "false"}
      >
        <Link href="/" className={cx("brand")}>
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
              item.href === "/docs"
                ? pathname === "/docs" ||
                  pathname.startsWith("/docs/") ||
                  pathname === "/about"
                : item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (item.href === "/docs") {
              return (
                <div
                  key={item.href}
                  className={cx("nav-dropdown", docsMenuOpen && "nav-dropdown-open")}
                  ref={docsDropdownRef}
                  onMouseEnter={() => {
                    if (isMobileNavigationMode()) {
                      return;
                    }

                    setDocsMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    if (!isMobileNavigationMode()) {
                      setDocsMenuOpen(false);
                    }
                  }}
                  onBlur={handleDocsMenuBlur}
                >
                  <Link
                    href="/docs"
                    ref={docsTriggerRef}
                    className={cx(
                      "nav-dropdown-trigger",
                      isActive && "nav-link-active",
                    )}
                    aria-haspopup="true"
                    aria-expanded={docsMenuOpen}
                    aria-controls="docs-navigation-menu"
                    onClick={handleDocsTriggerClick}
                    onFocus={() => {
                      if (isMobileNavigationMode()) {
                        return;
                      }

                      setDocsMenuOpen(true);
                    }}
                  >
                    <span>{item.label}</span>
                    <ChevronDown aria-hidden="true" className={cx("nav-dropdown-chevron")} />
                  </Link>
                  <div
                    id="docs-navigation-menu"
                    className={cx("nav-dropdown-menu")}
                    aria-label="社区文档相关链接"
                  >
                    <Link
                      href="/docs"
                      className={cx("nav-dropdown-item mobile-dropdown-item")}
                      aria-current={pathname === "/docs" ? "page" : undefined}
                      onClick={closeAllMenus}
                    >
                      <FileText aria-hidden="true" className={cx("nav-dropdown-item-icon")} />
                      <span>文档首页</span>
                    </Link>
                    <Link
                      href="/docs/guides/co-builder-rules"
                      className={cx("nav-dropdown-item")}
                      aria-current={
                        pathname === "/docs/guides/co-builder-rules" ? "page" : undefined
                      }
                      onClick={closeAllMenus}
                    >
                      <BookOpenText
                        aria-hidden="true"
                        className={cx("nav-dropdown-item-icon")}
                      />
                      <span>共建规则</span>
                    </Link>
                    <Link
                      href="/reports"
                      className={cx("nav-dropdown-item")}
                      aria-current={pathname === "/reports" ? "page" : undefined}
                      onClick={closeAllMenus}
                    >
                      <BarChart3 aria-hidden="true" className={cx("nav-dropdown-item-icon")} />
                      <span>研究与报告</span>
                    </Link>
                    <Link
                      href="/about"
                      className={cx("nav-dropdown-item")}
                      aria-current={pathname === "/about" ? "page" : undefined}
                      onClick={closeAllMenus}
                    >
                      <Info aria-hidden="true" className={cx("nav-dropdown-item-icon")} />
                      <span>关于我们</span>
                    </Link>
                    <Link
                      href={siteRepositoryUrl}
                      className={cx("nav-dropdown-item")}
                      target="_blank"
                      rel="noreferrer"
                      onClick={closeAllMenus}
                    >
                      <SocialPlatformIcon
                        tone="github"
                        className={cx("nav-dropdown-item-icon")}
                      />
                      <span>开源仓库</span>
                    </Link>
                  </div>
                </div>
              );
            }

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

        {shouldShowJoinButton ? (
          <div className={cx("header-actions")}>
            <Link href="/join" className={cx("button header-join-button")}>
              申请加入
            </Link>
          </div>
        ) : null}

        <div className={cx("header-top-actions")}>
          <SiteAccountEntry onAuthStateChange={handleAuthStateChange} />
          <MobileMenuToggle
            controlsId="site-navigation"
            open={mobileMenuOpen}
            onToggle={handleMobileMenuToggle}
          />
        </div>
      </div>
    </header>
  );
}
