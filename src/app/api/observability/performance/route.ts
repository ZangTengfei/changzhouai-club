import { NextResponse, type NextRequest } from "next/server";

import { normalizeObservedRoute } from "@/lib/performance-observability";

const ALLOWED_EVENTS = new Set([
  "client_error",
  "document_load_sample",
  "document_load_slow",
  "document_load_stalled",
  "navigation_sample",
  "navigation_slow",
  "navigation_stalled",
  "navigation_recovered",
  "stale_build_error",
]);
const ALLOWED_NAVIGATION_TYPES = new Set(["push", "replace", "traverse"]);
const ALLOWED_CONNECTION_TYPES = new Set(["slow-2g", "2g", "3g", "4g"]);
const ALLOWED_PROTOCOLS = new Set(["h3", "h2", "http/1.1"]);
const ALLOWED_RESOURCE_KINDS = new Set([
  "first_party",
  "asset_cdn",
  "third_party",
]);
const ALLOWED_ERROR_TYPES = new Set([
  "Error",
  "TypeError",
  "ReferenceError",
  "RangeError",
  "SyntaxError",
]);

function optionalBoundedNumber(value: unknown, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.min(Math.round(value), maximum)
    : undefined;
}

export async function POST(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") !== "same-origin") {
    return new NextResponse(null, { status: 204 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > 2_048) {
    return new NextResponse(null, { status: 413 });
  }

  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!input || !ALLOWED_EVENTS.has(String(input.event))) {
    return NextResponse.json({ error: "invalid_observation" }, { status: 400 });
  }

  const isDocumentEvent = String(input.event).startsWith("document_load_");
  const maximumDurationMs = isDocumentEvent ? 300_000 : 120_000;
  const durationMs = optionalBoundedNumber(input.durationMs, maximumDurationMs);

  if (durationMs === undefined) {
    return NextResponse.json({ error: "invalid_observation" }, { status: 400 });
  }

  console.warn("Web navigation performance observation.", {
    event: input.event,
    from: normalizeObservedRoute(String(input.from ?? "/other")),
    to: normalizeObservedRoute(String(input.to ?? "/other")),
    navigationType: ALLOWED_NAVIGATION_TYPES.has(String(input.navigationType))
      ? input.navigationType
      : "unknown",
    durationMs,
    ttfbMs: optionalBoundedNumber(input.ttfbMs, 300_000),
    responseEndMs: optionalBoundedNumber(input.responseEndMs, 300_000),
    domContentLoadedMs: optionalBoundedNumber(input.domContentLoadedMs, 300_000),
    loadMs: optionalBoundedNumber(input.loadMs, 300_000),
    rscDurationMs: optionalBoundedNumber(input.rscDurationMs, 120_000),
    rscStatus: optionalBoundedNumber(input.rscStatus, 599),
    rscProtocol: ALLOWED_PROTOCOLS.has(String(input.rscProtocol))
      ? input.rscProtocol
      : undefined,
    slowestResourceDurationMs: optionalBoundedNumber(
      input.slowestResourceDurationMs,
      maximumDurationMs,
    ),
    slowestResourceKind: ALLOWED_RESOURCE_KINDS.has(
      String(input.slowestResourceKind),
    )
      ? input.slowestResourceKind
      : undefined,
    slowestResourceProtocol: ALLOWED_PROTOCOLS.has(
      String(input.slowestResourceProtocol),
    )
      ? input.slowestResourceProtocol
      : undefined,
    documentProtocol: ALLOWED_PROTOCOLS.has(String(input.documentProtocol))
      ? input.documentProtocol
      : undefined,
    connectionType: ALLOWED_CONNECTION_TYPES.has(String(input.connectionType))
      ? input.connectionType
      : undefined,
    visibility: input.visibility === "hidden" ? "hidden" : "visible",
    errorType: ALLOWED_ERROR_TYPES.has(String(input.errorType))
      ? input.errorType
      : undefined,
    recoveryAttempted: input.recoveryAttempted === true ? true : undefined,
    deploymentId:
      typeof input.deploymentId === "string" &&
      /^[a-f0-9]{32}$/i.test(input.deploymentId)
        ? input.deploymentId
        : undefined,
  });

  return new NextResponse(null, { status: 204 });
}
