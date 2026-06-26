"use client";

import { useEffect } from "react";

const RELOAD_KEY_PREFIX = "changzhouai:stale-build-reload";
const RELOAD_COOLDOWN_MS = 10 * 60 * 1000;

const staleBuildErrorPatterns = [
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
  /Loading CSS chunk [\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /_next\/static\/chunks/i,
];

function getErrorText(value: unknown): string {
  if (value instanceof Error) {
    return `${value.name}\n${value.message}\n${value.stack ?? ""}`;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    const maybeError = value as { message?: unknown; reason?: unknown; error?: unknown };

    return [
      getErrorText(maybeError.message),
      getErrorText(maybeError.reason),
      getErrorText(maybeError.error),
    ]
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function isStaleBuildError(value: unknown) {
  const text = getErrorText(value);

  return staleBuildErrorPatterns.some((pattern) => pattern.test(text));
}

function reloadOnceForCurrentPath() {
  const key = `${RELOAD_KEY_PREFIX}:${window.location.pathname}`;
  const lastReloadedAt = Number(window.sessionStorage.getItem(key) ?? 0);
  const now = Date.now();

  if (lastReloadedAt && now - lastReloadedAt < RELOAD_COOLDOWN_MS) {
    return;
  }

  window.sessionStorage.setItem(key, String(now));
  window.location.reload();
}

export function StaleBuildReloadGuard() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      if (isStaleBuildError(event.error ?? event.message)) {
        reloadOnceForCurrentPath();
      }
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      if (isStaleBuildError(event.reason)) {
        reloadOnceForCurrentPath();
      }
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
