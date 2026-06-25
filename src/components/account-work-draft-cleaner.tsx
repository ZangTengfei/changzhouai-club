"use client";

import { useEffect } from "react";

const ACCOUNT_WORK_DRAFT_KEY = "changzhouai.account.member-work.new.v1";

export function AccountWorkDraftCleaner({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    try {
      window.localStorage.removeItem(ACCOUNT_WORK_DRAFT_KEY);
    } catch {
      // Local storage can be unavailable in private browsing contexts.
    }
  }, [enabled]);

  return null;
}
