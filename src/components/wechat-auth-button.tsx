"use client";

import { useMemo, useState } from "react";

import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { getPublicSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type WechatAuthButtonProps = {
  enabled: boolean;
  mode: "sign-in" | "link";
  nextPath?: string;
  linked?: boolean;
  className?: string;
};

function getSafeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/account";
  }

  return nextPath;
}

function getSiteOrigin() {
  return getPublicSiteUrl() ?? (typeof window === "undefined" ? "" : window.location.origin);
}

function getAuthCallbackUrl(nextPath: string) {
  const siteOrigin = getSiteOrigin();

  if (!siteOrigin) {
    return "";
  }

  const callbackUrl = new URL("/auth/callback", siteOrigin);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}

export function WechatAuthButton({
  enabled,
  mode,
  nextPath = "/account",
  linked = false,
  className = "button button-secondary auth-button",
}: WechatAuthButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const safeNextPath = getSafeNextPath(nextPath);
  const redirectTo = useMemo(() => getAuthCallbackUrl(safeNextPath), [safeNextPath]);
  const disabled = !enabled || linked || pending || !redirectTo;

  async function handleClick() {
    if (disabled) {
      return;
    }

    setPending(true);
    setError(null);

    const supabase = createClient();
    const options = {
      redirectTo,
      scopes: "snsapi_login",
    };
    const credentials = {
      provider: "custom:wechat",
      options,
    } as const;

    const { data, error: authError } =
      mode === "link"
        ? await supabase.auth.linkIdentity(credentials)
        : await supabase.auth.signInWithOAuth(credentials);

    if (authError) {
      setError(authError.message || "微信认证暂时不可用。");
      setPending(false);
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    setPending(false);
  }

  const label =
    linked
      ? "已绑定微信"
      : pending
        ? mode === "link"
          ? "跳转绑定中..."
          : "跳转微信中..."
        : mode === "link"
          ? "绑定微信"
          : "微信登录";

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        disabled={disabled}
      >
        <SocialPlatformIcon tone="wechat" />
        {label}
      </button>
      {error ? <p className="note-strip">{error}</p> : null}
    </>
  );
}
