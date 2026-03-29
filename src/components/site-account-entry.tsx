"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type AccountState = {
  href: string;
  label: string;
  name: string;
  avatarUrl: string | null;
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
};

export function SiteAccountEntry() {
  const [account, setAccount] = useState<AccountState>(defaultState);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      return;
    }

    const supabase = createClient();

    async function syncAccountState() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAccount(defaultState);
        return;
      }

      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "账号";
      const avatarUrl =
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null;

      setAccount({
        href: "/account",
        label: "账号中心",
        name: displayName,
        avatarUrl,
      });
    }

    void syncAccountState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncAccountState();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Link
      href={account.href}
      className="account-entry"
      aria-label={account.label}
      title={account.label}
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
    </Link>
  );
}
