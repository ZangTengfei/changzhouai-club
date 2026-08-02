import type { NextRequest } from "next/server";

import { normalizeObservedRoute } from "@/lib/performance-observability";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const startedAt = performance.now();

  try {
    const response = await updateSession(request);
    const durationMs = Math.round(performance.now() - startedAt);

    if (durationMs >= 1_000) {
      console.warn("Slow Supabase session middleware request.", {
        route: normalizeObservedRoute(request.nextUrl.pathname),
        requestType: request.headers.has("rsc")
          ? "rsc"
          : request.nextUrl.pathname.startsWith("/api/")
            ? "api"
            : "document",
        durationMs,
      });
    }

    return response;
  } catch (error) {
    console.error("Supabase session middleware failed.", {
      route: normalizeObservedRoute(request.nextUrl.pathname),
      requestType: request.headers.has("rsc")
        ? "rsc"
        : request.nextUrl.pathname.startsWith("/api/")
          ? "api"
          : "document",
      durationMs: Math.round(performance.now() - startedAt),
      errorType:
        error instanceof Error && error.message.includes("Invalid Base64-URL")
          ? "invalid_session_cookie"
          : "session_middleware_error",
    });
    throw error;
  }
}

export const config = {
  matcher: [
    "/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
