"use client";

import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type GoogleSignInButtonProps = {
  nextPath?: string;
  enabled: boolean;
};

export function GoogleSignInButton({
  nextPath = "/account",
  enabled,
}: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const redirectTo = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath);
    return callbackUrl.toString();
  }, [nextPath]);

  async function handleSignIn() {
    if (!enabled || !redirectTo) {
      return;
    }

    setPending(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setPending(false);
      window.alert(`Google 登录发起失败：${error.message}`);
    }
  }

  return (
    <button
      type="button"
      className="button auth-button"
      onClick={handleSignIn}
      disabled={!enabled || pending}
    >
      {pending ? "正在跳转到 Google..." : "使用 Google 登录"}
    </button>
  );
}
