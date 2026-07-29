"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  getLegacyAdminPermissionsForMemberStatus,
  hasAdminPermission,
} from "@/lib/admin/permissions";
import { hasSupabaseEnv } from "@/lib/env";
import { getAvatarImageUrl } from "@/lib/public-image-url";
import { createClient } from "@/lib/supabase/client";
import { resolveCommunityUserId } from "@/lib/community-user";
import { cn } from "@/lib/utils";

type AdminPermissionRow = {
  permission_key: string | null;
};

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

const accountEntryClassName =
  "inline-flex size-11.5 cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] border border-[rgba(var(--accent-rgb),0.16)] bg-[rgba(var(--surface-muted-rgb),0.84)] p-0 shadow-[var(--shadow-md)] transition-[transform,border-color,background-color] duration-[180ms] hover:-translate-y-px hover:border-[rgba(var(--accent-rgb),0.28)] hover:bg-primary-soft focus-visible:-translate-y-px focus-visible:border-[rgba(var(--accent-rgb),0.28)] focus-visible:bg-primary-soft";

const accountDropdownItemClassName =
  "inline-flex min-h-10.5 w-full cursor-pointer items-center rounded-sm border-0 bg-transparent px-3.5 py-0 text-left font-[inherit] font-semibold text-ink transition-[background-color,color,transform] duration-[180ms] hover:-translate-y-px hover:bg-primary-soft hover:text-ink focus-visible:-translate-y-px focus-visible:bg-primary-soft focus-visible:text-ink disabled:cursor-not-allowed disabled:opacity-68";

export function SiteAccountEntry({
  onAuthStateChange,
}: {
  onAuthStateChange?: (isAuthenticated: boolean) => void;
}) {
  const [account, setAccount] = useState<AccountState>(defaultState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      onAuthStateChange?.(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function syncAccountState(sessionUser: {
      id: string;
      email?: string | null;
      user_metadata?: {
        full_name?: string;
        name?: string;
        avatar_url?: string;
      };
    } | null) {
      const user = sessionUser;

      if (!user) {
        if (!cancelled) {
          setAccount(defaultState);
          onAuthStateChange?.(false);
        }
        return;
      }

      const communityUserId = await resolveCommunityUserId(supabase, user.id);

      const [{ data: profile }, { data: member }, { data: adminPermissions }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", communityUserId)
          .maybeSingle(),
        supabase
          .from("members")
          .select("status")
          .eq("id", communityUserId)
          .maybeSingle(),
        supabase.rpc("list_current_admin_permissions"),
      ]);
      const permissionKeys = new Set<string>(
        getLegacyAdminPermissionsForMemberStatus(member?.status),
      );

      ((adminPermissions ?? []) as AdminPermissionRow[]).forEach((permission) => {
        if (permission.permission_key) {
          permissionKeys.add(permission.permission_key);
        }
      });

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
          avatarUrl: getAvatarImageUrl(avatarUrl),
          isStaff: hasAdminPermission(permissionKeys, "admin.access"),
        });
        onAuthStateChange?.(true);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAccountState(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [onAuthStateChange]);

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
        prefetch={false}
        className={cn(
          accountEntryClassName,
          "h-10.5 w-auto min-w-17 overflow-visible border-[rgba(var(--accent-rgb),0.2)] bg-[rgba(var(--surface-soft-rgb),0.9)] px-4.5 text-[0.94rem] font-extrabold leading-none text-primary-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_10px_22px_rgba(var(--ink-rgb),0.07)] hover:border-[rgba(var(--accent-rgb),0.34)] hover:bg-[rgba(var(--accent-rgb),0.1)] hover:text-primary-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_12px_24px_rgba(var(--accent-rgb),0.11)] focus-visible:border-[rgba(var(--accent-rgb),0.34)] focus-visible:bg-[rgba(var(--accent-rgb),0.1)] focus-visible:text-primary-strong focus-visible:shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_12px_24px_rgba(var(--accent-rgb),0.11)]",
        )}
        aria-label={account.label}
        title={account.label}
      >
        <span>{account.label}</span>
      </Link>
    );
  }

  return (
    <div className="relative z-210" ref={menuRef}>
      <button
        type="button"
        className={cn(
          accountEntryClassName,
          menuOpen && "-translate-y-px border-[rgba(var(--accent-rgb),0.28)] bg-primary-soft",
        )}
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
            className="block size-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="grid size-full place-items-center bg-[linear-gradient(135deg,rgba(var(--accent-rgb),0.92),rgba(var(--accent-warm-rgb),0.88))] text-[0.82rem] font-extrabold tracking-[0.04em] text-white">
            {getAccountInitials(account.name)}
          </span>
        )}
        <span className="sr-only">{account.label}</span>
      </button>

      {menuOpen ? (
        <div
          className="absolute top-[calc(100%+10px)] right-0 z-220 grid min-w-45 gap-1.5 rounded-md border border-primary-border bg-[rgba(var(--surface-muted-rgb),0.98)] p-2.5 shadow-[var(--shadow-lg)] backdrop-blur-2xl max-[820px]:min-w-42"
          role="menu"
          aria-label="账号菜单"
        >
          <Link
            href="/account"
            prefetch={false}
            className={accountDropdownItemClassName}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            进入用户主页
          </Link>

          {account.isStaff ? (
            <Link
              href="/admin"
              prefetch={false}
              className={accountDropdownItemClassName}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              管理后台
            </Link>
          ) : null}

          <button
            type="button"
            className={accountDropdownItemClassName}
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
