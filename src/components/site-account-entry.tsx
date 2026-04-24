"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type AccountState = {
  href: string;
  label: string;
  name: string;
  avatarUrl: string | null;
  isStaff: boolean;
};

function getAccountInitials(name: string) {
  const trimmed = name.trim();

  if (!trimmed) {
    return "AI";
  }

  const latin = trimmed.replace(/[^a-zA-Z0-9]/g, "");

  if (latin.length >= 2) {
    return latin.slice(0, 2).toUpperCase();
  }

  if (trimmed.length >= 2) {
    return trimmed.slice(0, 2).toUpperCase();
  }

  return trimmed.slice(0, 1).toUpperCase();
}

const defaultState: AccountState = {
  href: "/login?next=/account",
  label: "登录",
  name: "登录",
  avatarUrl: null,
  isStaff: false,
};

export function SiteAccountEntry() {
  const pathname = usePathname();
  const [account, setAccount] = useState<AccountState>(defaultState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function syncAccountState(sessionUser?: {
      id: string;
      email?: string | null;
      user_metadata?: {
        full_name?: string;
        name?: string;
        avatar_url?: string;
      };
    } | null) {
      const user =
        sessionUser ??
        (await supabase.auth.getSession()).data.session?.user ??
        null;

      if (!user) {
        if (!cancelled) {
          setAccount(defaultState);
        }
        return;
      }

      const [{ data: profile }, { data: member }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("members").select("status").eq("id", user.id).maybeSingle(),
      ]);

      const displayName =
        profile?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "账号";
      const avatarUrl =
        profile?.avatar_url ||
        (typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null);

      if (!cancelled) {
        setAccount({
          href: "/account",
          label: "账号中心",
          name: displayName,
          avatarUrl,
          isStaff: ["organizer", "admin"].includes(member?.status ?? ""),
        });
      }
    }

    void syncAccountState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAccountState(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
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

  async function handleSignOut() {
    if (pending || account.href !== "/account") {
      return;
    }

    setPending(true);
    setMenuOpen(false);

    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (account.href !== "/account") {
    return (
      <Link
        href={account.href}
        className="account-entry account-entry-login"
        aria-label={account.label}
        title={account.label}
      >
        <span>{account.label}</span>
      </Link>
    );
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className={`account-entry${menuOpen ? " account-entry-active" : ""}`}
        aria-label={account.label}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={account.label}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {account.avatarUrl ? (
          <img
            src={account.avatarUrl}
            alt={account.name}
            className="account-avatar-image"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="account-avatar-fallback">
            {getAccountInitials(account.name)}
          </span>
        )}
        <span className="sr-only">{account.label}</span>
      </button>

      {menuOpen ? (
        <div className="account-dropdown" role="menu" aria-label="账号菜单">
          <Link
            href="/account"
            className="account-dropdown-item"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            进入用户主页
          </Link>

          {account.isStaff ? (
            <Link
              href="/admin"
              className="account-dropdown-item"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              管理后台
            </Link>
          ) : null}

          <button
            type="button"
            className="account-dropdown-item"
            role="menuitem"
            onClick={handleSignOut}
            disabled={pending}
          >
            {pending ? "退出中..." : "退出登录"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
