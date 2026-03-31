"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SiteAccountEntry } from "@/components/site-account-entry";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { navItems } from "@/lib/site-data";

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
            <strong>常州 AI 开发者社区</strong>
            <small>Changzhou AI Club</small>
          </span>
        </Link>

        <nav id="site-navigation" className="nav-links" aria-label="主导航">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link href="/join" className="button button-secondary" onClick={() => setMenuOpen(false)}>
            加入社群
          </Link>
          <Link href="/cooperate" className="button" onClick={() => setMenuOpen(false)}>
            提交合作需求
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
