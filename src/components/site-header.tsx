"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Boxes, ChevronDown, Info } from "lucide-react";
import { type FocusEvent, useCallback, useEffect, useRef, useState } from "react";

import { MobileMenuToggle } from "@/components/mobile-menu-toggle";
import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { hasSupabaseEnv } from "@/lib/env";
import { navItems, siteRepositoryUrl } from "@/lib/site-data";
import { cssModuleCx } from "@/lib/utils";
import styles from "./site-header.module.css";

const cx = cssModuleCx.bind(null, styles);

export function SiteHeader() {
  const pathname = usePathname();
  const [authReady, setAuthReady] = useState(!hasSupabaseEnv());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [membersMenuOpen, setMembersMenuOpen] = useState(false);
  const [docsMenuOpen, setDocsMenuOpen] = useState(false);
  const membersDropdownRef = useRef<HTMLDivElement>(null);
  const membersTriggerRef = useRef<HTMLAnchorElement>(null);
  const docsDropdownRef = useRef<HTMLDivElement>(null);
  const docsTriggerRef = useRef<HTMLAnchorElement>(null);
  const shouldShowJoinButton = authReady && !isAuthenticated;
  const handleAuthStateChange = useCallback((nextIsAuthenticated: boolean) => {
    setIsAuthenticated(nextIsAuthenticated);
    setAuthReady(true);
  }, []);
  const handleMembersMenuBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const nextFocused = event.relatedTarget as Node | null;

    if (nextFocused && event.currentTarget.contains(nextFocused)) {
      return;
    }

    setMembersMenuOpen(false);
  }, []);
  const handleDocsMenuBlur = useCallback((event: FocusEvent<HTMLDivElement>) => {
    const nextFocused = event.relatedTarget as Node | null;

    if (nextFocused && event.currentTarget.contains(nextFocused)) {
      return;
    }

    setDocsMenuOpen(false);
  }, []);

  useEffect(() => {
    setMembersMenuOpen(false);
    setDocsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!membersMenuOpen && !docsMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const shouldFocusMembersTrigger = membersMenuOpen;

        setMembersMenuOpen(false);
        setDocsMenuOpen(false);

        if (shouldFocusMembersTrigger) {
          membersTriggerRef.current?.focus();
        } else {
          docsTriggerRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [docsMenuOpen, membersMenuOpen]);

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
              item.href === "/members"
                ? pathname === "/members" ||
                  pathname.startsWith("/members/") ||
                  pathname === "/works"
                : item.href === "/docs"
                ? pathname === "/docs" ||
                  pathname.startsWith("/docs/") ||
                  pathname === "/about"
                : item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (item.href === "/members") {
              return (
                <div
                  key={item.href}
                  className={cx("nav-dropdown", membersMenuOpen && "nav-dropdown-open")}
                  ref={membersDropdownRef}
                  onMouseEnter={() => {
                    setMembersMenuOpen(true);
                    setDocsMenuOpen(false);
                  }}
                  onMouseLeave={() => setMembersMenuOpen(false)}
                  onBlur={handleMembersMenuBlur}
                >
                  <Link
                    href="/members"
                    ref={membersTriggerRef}
                    className={cx(
                      "nav-dropdown-trigger",
                      isActive && "nav-link-active",
                    )}
                    aria-haspopup="true"
                    aria-expanded={membersMenuOpen}
                    aria-controls="members-navigation-menu"
                    onFocus={() => {
                      setMembersMenuOpen(true);
                      setDocsMenuOpen(false);
                    }}
                  >
                    <span>{item.label}</span>
                    <ChevronDown aria-hidden="true" className={cx("nav-dropdown-chevron")} />
                  </Link>
                  <div
                    id="members-navigation-menu"
                    className={cx("nav-dropdown-menu")}
                    aria-label="成员地图相关链接"
                  >
                    <Link
                      href="/works"
                      className={cx("nav-dropdown-item")}
                      aria-current={pathname === "/works" ? "page" : undefined}
                      onClick={() => setMembersMenuOpen(false)}
                    >
                      <Boxes aria-hidden="true" className={cx("nav-dropdown-item-icon")} />
                      <span>作品墙</span>
                    </Link>
                  </div>
                </div>
              );
            }

            if (item.href === "/docs") {
              return (
                <div
                  key={item.href}
                  className={cx("nav-dropdown", docsMenuOpen && "nav-dropdown-open")}
                  ref={docsDropdownRef}
                  onMouseEnter={() => {
                    setDocsMenuOpen(true);
                    setMembersMenuOpen(false);
                  }}
                  onMouseLeave={() => setDocsMenuOpen(false)}
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
                    onFocus={() => {
                      setDocsMenuOpen(true);
                      setMembersMenuOpen(false);
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
                      href="/docs/guides/co-builder-rules"
                      className={cx("nav-dropdown-item")}
                      aria-current={
                        pathname === "/docs/guides/co-builder-rules" ? "page" : undefined
                      }
                      onClick={() => setDocsMenuOpen(false)}
                    >
                      <BookOpenText
                        aria-hidden="true"
                        className={cx("nav-dropdown-item-icon")}
                      />
                      <span>共建规则</span>
                    </Link>
                    <Link
                      href="/about"
                      className={cx("nav-dropdown-item")}
                      aria-current={pathname === "/about" ? "page" : undefined}
                      onClick={() => setDocsMenuOpen(false)}
                    >
                      <Info aria-hidden="true" className={cx("nav-dropdown-item-icon")} />
                      <span>关于我们</span>
                    </Link>
                    <Link
                      href={siteRepositoryUrl}
                      className={cx("nav-dropdown-item")}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setDocsMenuOpen(false)}
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
              加入社区
            </Link>
          </div>
        ) : null}

        <div className={cx("header-top-actions")}>
          <SiteAccountEntry onAuthStateChange={handleAuthStateChange} />
          <MobileMenuToggle controlsId="site-navigation" />
        </div>
      </div>
    </header>
  );
}
