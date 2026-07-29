"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MobileMenuToggle } from "@/components/mobile-menu-toggle";
import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { hasSupabaseEnv } from "@/lib/env";
import { navItems } from "@/lib/site-data";
import { cn } from "@/lib/utils";

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
      className="relative z-[200] border-b border-[rgba(var(--ink-rgb),0.08)] bg-white p-0 max-lg:border-b-0 max-lg:pt-3.5"
      data-white-header="true"
    >
      <div
        className="container group relative grid min-h-[78px] grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 border-0 bg-transparent p-0 shadow-none after:pointer-events-none after:absolute after:right-[18px] after:bottom-[-1px] after:left-[18px] after:h-0.5 after:origin-left after:scale-x-[0.24] after:rounded-[var(--radius-pill)] after:bg-[linear-gradient(90deg,transparent,#16a085,transparent)] after:opacity-0 after:content-[''] data-[nav-pending=true]:after:animate-pulse data-[nav-pending=true]:after:opacity-100 max-lg:min-h-0 max-lg:rounded-[var(--radius-lg)] max-lg:border max-lg:border-[var(--line)] max-lg:bg-white max-lg:px-[18px] max-lg:py-3.5 max-lg:shadow-[var(--shadow-md)] max-[820px]:grid-cols-[minmax(0,1fr)_auto_auto] max-[820px]:justify-between max-[820px]:gap-3.5"
        data-mobile-menu-open={mobileMenuOpen ? "true" : "false"}
        data-nav-pending={pendingNavHref ? "true" : "false"}
      >
        <Link href="/" prefetch={false} className="order-1 inline-flex min-w-0 items-center gap-3.5 max-sm:gap-2.5">
          <span className="grid size-[42px] shrink-0 place-items-center max-sm:size-[38px]">
            <SiteLogoMark className="block size-full object-contain" />
          </span>
          <span className="flex flex-col gap-0.5">
            <strong className="font-[var(--font-display)] text-base leading-[1.1] font-extrabold text-[#111b1f] max-sm:text-[0.94rem]">常州 AI Club</strong>
            <small className="font-[var(--font-display)] text-[0.8rem] leading-[1.1] font-semibold text-[rgba(var(--ink-rgb),0.6)] max-sm:text-[0.76rem]">OPC 共创社区</small>
          </span>
        </Link>

        <nav id="site-navigation" className="order-2 flex flex-nowrap items-center justify-center gap-1 max-lg:gap-0 max-[820px]:order-4 max-[820px]:col-span-full max-[820px]:hidden! max-[820px]:grid-cols-1 max-[820px]:gap-2.5 max-[820px]:border-t max-[820px]:border-[rgba(var(--accent-rgb),0.12)] max-[820px]:pt-1.5 group-data-[mobile-menu-open=true]:grid!" aria-label="主导航">
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
                className={cn(
                  "relative whitespace-nowrap px-[13px] pt-7 pb-6 text-center text-[0.92rem] leading-[1.2] font-bold text-[#111b1f] after:absolute after:right-4 after:bottom-3.5 after:left-4 after:h-[3px] after:rounded-[var(--radius-pill)] after:bg-transparent after:content-[''] hover:after:bg-[#16a085] focus-visible:after:bg-[#16a085] data-[pending=true]:after:bg-[#16a085] max-lg:px-2 max-lg:pt-6 max-lg:pb-5 max-lg:text-[0.9rem] max-[820px]:flex max-[820px]:min-h-0 max-[820px]:items-center max-[820px]:justify-between max-[820px]:whitespace-normal max-[820px]:border-b max-[820px]:border-[rgba(var(--ink-rgb),0.08)] max-[820px]:px-0.5 max-[820px]:py-2.5 max-[820px]:text-left max-[820px]:after:hidden",
                  isActive && "after:bg-[#16a085]",
                )}
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
          <div className="order-3 flex flex-wrap items-center justify-end gap-2.5 max-[820px]:order-5 max-[820px]:col-span-full max-[820px]:hidden! max-[820px]:grid-cols-1 max-[820px]:items-stretch group-data-[mobile-menu-open=true]:grid!">
            <Link href="/join" prefetch={false} className="button min-h-[42px] rounded-[var(--radius-sm)] bg-[#0b9966] px-4 shadow-none hover:bg-[#087a52] focus-visible:bg-[#087a52] max-lg:px-3.5 max-lg:text-[0.95rem] max-[820px]:w-full max-sm:min-h-[46px]">
              申请加入
            </Link>
          </div>
        ) : null}

        <div className="order-4 flex items-center gap-2.5 max-[820px]:order-2">
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
