"use client";

import { useEffect, useMemo, useState } from "react";

import { WechatAuthButton } from "@/components/wechat-auth-button";
import { getPublicSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type WechatQrLoginProps = {
  enabled: boolean;
  officialAccountEnabled: boolean;
  nextPath?: string;
};

type EmbeddedUrlResponse = {
  url?: string;
  error?: string;
};

type LoginEnvironment = "checking" | "desktop" | "wechat" | "mobile";

const mobileNoticeClassName =
  "grid gap-1.5 rounded-md border border-primary-border bg-[rgba(var(--accent-rgb),0.07)] p-4 [&_span]:text-[0.9rem] [&_span]:leading-[1.62] [&_span]:font-bold [&_span]:text-[rgba(var(--ink-rgb),0.68)] [&_strong]:text-[0.98rem] [&_strong]:leading-[1.35] [&_strong]:font-black [&_strong]:text-ink";

const fallbackButtonClassName =
  "button button-secondary auth-button min-h-9.5! w-auto! justify-center px-4! text-[0.9rem]! max-sm:w-full!";

function getSafeNextPath(nextPath: string) {
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/account";
  }

  return nextPath;
}

function getSiteOrigin() {
  return (
    getPublicSiteUrl() ??
    (typeof window === "undefined" ? "" : window.location.origin)
  );
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

function getWechatLoginEnvironment(): LoginEnvironment {
  if (typeof window === "undefined") {
    return "checking";
  }

  const userAgent = navigator.userAgent;
  const isWechatBrowser = /MicroMessenger/i.test(userAgent);
  const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
  const isNarrowViewport = window.matchMedia("(max-width: 720px)").matches;

  if (isWechatBrowser) {
    return "wechat";
  }

  return isMobileDevice || isNarrowViewport ? "mobile" : "desktop";
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
  officialAccountEnabled,
  nextPath = "/account",
}: WechatQrLoginProps) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginEnvironment, setLoginEnvironment] =
    useState<LoginEnvironment>("checking");
  const safeNextPath = getSafeNextPath(nextPath);
  const redirectTo = useMemo(
    () => getAuthCallbackUrl(safeNextPath),
    [safeNextPath],
  );

  useEffect(() => {
    function updateQrEnvironment() {
      setLoginEnvironment(getWechatLoginEnvironment());
    }

    updateQrEnvironment();

    const mediaQuery = window.matchMedia("(max-width: 720px)");
    mediaQuery.addEventListener("change", updateQrEnvironment);

    return () => {
      mediaQuery.removeEventListener("change", updateQrEnvironment);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !redirectTo || loginEnvironment !== "desktop") {
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
          throw new Error(
            authError?.message || "wechat_authorize_url_unavailable",
          );
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
  }, [enabled, redirectTo, loginEnvironment]);

  if (loginEnvironment === "wechat") {
    return (
      <div className="grid gap-2.5">
        <div className={mobileNoticeClassName}>
          <strong>微信内快捷登录</strong>
          <span>确认授权后会自动回到社区账号页。</span>
        </div>
        <WechatAuthButton
          enabled={enabled && officialAccountEnabled}
          mode="sign-in"
          nextPath={safeNextPath}
          className={fallbackButtonClassName}
        />
        {!officialAccountEnabled ? (
          <p className="note-strip">服务号登录暂未启用，请稍后再试。</p>
        ) : null}
      </div>
    );
  }

  if (loginEnvironment !== "desktop") {
    return (
      <div className={mobileNoticeClassName}>
        <strong>
          {loginEnvironment === "checking"
            ? "正在判断当前设备..."
            : "请在微信内打开官网"}
        </strong>
        <span>也可以返回邮箱方式登录。</span>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      <div className="grid min-h-68 place-items-center overflow-hidden rounded-md border border-primary-border bg-white/78 pt-4 max-sm:min-h-64.5">
        {frameUrl ? (
          <div className="h-68 w-[min(100%,300px)] overflow-hidden max-sm:h-64.5">
            <iframe
              title="微信扫码登录"
              src={frameUrl}
              className="h-100 w-75 max-w-full border-0 max-sm:scale-92 max-sm:origin-top"
              loading="eager"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="grid min-h-60 w-full place-items-center px-5.5 py-5.5 text-center text-[0.94rem] leading-[1.56] font-[750] text-[rgba(var(--ink-rgb),0.58)]">
            {loading ? "正在准备微信二维码..." : "微信二维码暂不可用"}
          </div>
        )}
      </div>

      <p className="m-0 text-[0.9rem] leading-[1.58] font-bold text-[rgba(var(--ink-rgb),0.64)]">
        扫码确认后自动回到社区账号页。
      </p>

      {error ? <p className="note-strip">{error}</p> : null}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pt-0.5 max-sm:grid-cols-1 max-sm:gap-2">
        <span className="text-[0.84rem] leading-[1.4] font-[750] text-[rgba(var(--ink-rgb),0.56)]">
          二维码加载异常时
        </span>
        <WechatAuthButton
          enabled={enabled}
          mode="sign-in"
          nextPath={safeNextPath}
          className={fallbackButtonClassName}
        />
      </div>
    </div>
  );
}
