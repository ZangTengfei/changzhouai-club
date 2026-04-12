"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, SVGProps } from "react";
import { useEffect, useRef, useState } from "react";

import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { navItems, type NavItemIcon } from "@/lib/site-data";

type IconProps = SVGProps<SVGSVGElement>;

const navIcons: Record<NavItemIcon, (props: IconProps) => ReactElement> = {
  home: function HomeIcon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
        <path d="M4.75 10.25L12 4.75l7.25 5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.75 9.75v8.5h8.5v-8.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  },
  events: function EventsIcon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
        <rect x="4.75" y="6.75" width="14.5" height="12.5" rx="2.5" />
        <path d="M8 4.75v4M16 4.75v4M4.75 10.25h14.5" strokeLinecap="round" />
      </svg>
    );
  },
  members: function MembersIcon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
        <path d="M12 12.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5z" />
        <path d="M6.75 18.25a5.25 5.25 0 0110.5 0" strokeLinecap="round" />
      </svg>
    );
  },
  projects: function ProjectsIcon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
        <rect x="4.75" y="5.75" width="6.5" height="6.5" rx="1.5" />
        <rect x="12.75" y="5.75" width="6.5" height="6.5" rx="1.5" />
        <rect x="8.75" y="13.75" width="6.5" height="6.5" rx="1.5" />
        <path d="M12 12.25v1.5M9.5 12.25l-.75 1.5M14.5 12.25l.75 1.5" strokeLinecap="round" />
      </svg>
    );
  },
  cooperate: function CooperateIcon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
        <path
          d="M8.75 8.25l2.1-2.1a2.75 2.75 0 013.9 0l1.2 1.2a2.75 2.75 0 010 3.9l-2.1 2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.25 15.75l-2.1 2.1a2.75 2.75 0 01-3.9 0l-1.2-1.2a2.75 2.75 0 010-3.9l2.1-2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9.75 14.25l4.5-4.5" strokeLinecap="round" />
      </svg>
    );
  },
  docs: function DocsIcon(props) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
        <path d="M7.25 5.75h7.5l3 3v9.5a2 2 0 01-2 2h-8.5a2 2 0 01-2-2v-10.5a2 2 0 012-2z" />
        <path d="M14.75 5.75v3h3M8.75 12h6.5M8.75 15.25h4.25" strokeLinecap="round" />
      </svg>
    );
  },
};

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className={`container header-inner${menuOpen ? " header-inner-open" : ""}`}>
        <Link href="/" className="brand">
          <span className="brand-mark">
            <SiteLogoMark className="brand-mark-icon" />
          </span>
          <span className="brand-copy">
            <strong>常州 AI 社区</strong>
            <small>Changzhou AI Club</small>
          </span>
        </Link>

        <nav id="site-navigation" className="nav-links" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = navIcons[item.icon];

            return (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                <span className="nav-link-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <Link href="/join" className="button button-secondary" onClick={() => setMenuOpen(false)}>
            加入社区
          </Link>
        </div>

        <div className="header-top-actions">
          <SiteAccountEntry />
          <button
            type="button"
            className={`mobile-menu-toggle${menuOpen ? " mobile-menu-toggle-active" : ""}`}
            aria-label={menuOpen ? "收起主导航" : "展开主导航"}
            aria-controls="site-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
