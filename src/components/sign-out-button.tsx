"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ enabled }: { enabled: boolean }) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (!enabled) {
      return;
    }

    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      className="button button-secondary auth-button"
      onClick={handleSignOut}
      disabled={!enabled || pending}
    >
      {pending ? "退出中..." : "退出登录"}
    </button>
  );
}
