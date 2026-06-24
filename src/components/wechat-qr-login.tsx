"use client";

import { useEffect, useMemo, useState } from "react";

import { WechatAuthButton } from "@/components/wechat-auth-button";
import { getPublicSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import styles from "./wechat-qr-login.module.css";

type WechatQrLoginProps = {
  enabled: boolean;
  nextPath?: string;
};

type EmbeddedUrlResponse = {
  url?: string;
  error?: string;
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

function getEmbeddedFrameUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.searchParams.set("login_type", "jssdk");
  url.searchParams.set("self_redirect", "false");
  url.searchParams.set("stylelite", "1");
  url.searchParams.set("ts", Date.now().toString());
  return url.toString();
}

export function WechatQrLogin({
  enabled,
  nextPath = "/account",
}: WechatQrLoginProps) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const safeNextPath = getSafeNextPath(nextPath);
  const redirectTo = useMemo(() => getAuthCallbackUrl(safeNextPath), [safeNextPath]);

  useEffect(() => {
    if (!enabled || !redirectTo) {
      setFrameUrl(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadWechatFrame() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signInWithOAuth({
          provider: "custom:wechat",
          options: {
            redirectTo,
            scopes: "snsapi_login",
            skipBrowserRedirect: true,
          },
        });

        if (authError || !data?.url) {
          throw new Error(authError?.message || "wechat_authorize_url_unavailable");
        }

        const response = await fetch("/api/auth/wechat/embedded-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ authorizeUrl: data.url }),
        });
        const body = (await response.json()) as EmbeddedUrlResponse;

        if (!response.ok || !body.url) {
          throw new Error(body.error || "wechat_embedded_url_unavailable");
        }

        if (!cancelled) {
          setFrameUrl(getEmbeddedFrameUrl(body.url));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFrameUrl(null);
          setError("微信二维码暂时加载失败，可以改用下方按钮打开微信登录。");
          setLoading(false);
        }
      }
    }

    void loadWechatFrame();

    return () => {
      cancelled = true;
    };
  }, [enabled, redirectTo]);

  return (
    <div className={styles.stack}>
      <div className={styles.qrBox}>
        {frameUrl ? (
          <iframe
            title="微信扫码登录"
            src={frameUrl}
            className={styles.frame}
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className={styles.placeholder}>
            {loading ? "正在准备微信二维码..." : "微信二维码暂不可用"}
          </div>
        )}
      </div>

      <p className={styles.caption}>用微信扫码确认后，会自动回到社区账号页面。</p>

      {error ? <p className="note-strip">{error}</p> : null}

      <WechatAuthButton
        enabled={enabled}
        mode="sign-in"
        nextPath={safeNextPath}
        className="button button-secondary auth-button"
      />
    </div>
  );
}
