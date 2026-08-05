import { normalizeObservedRoute } from "@/lib/performance-observability";

const SLOW_NAVIGATION_MS = 1_500;
const STALLED_NAVIGATION_MS = 5_000;
const SLOW_DOCUMENT_CONTENT_MS = 3_000;
const SLOW_DOCUMENT_LOAD_MS = 5_000;
const STALLED_DOCUMENT_CONTENT_MS = 10_000;
const STALLED_DOCUMENT_LOAD_MS = 15_000;
const PERFORMANCE_SAMPLE_RATE = 0.1;

type PendingNavigation = {
  from: string;
  to: string;
  navigationType: string;
  startedAt: number;
  startingTitle: string;
  timeoutId: number;
  stalledReported: boolean;
};

type NavigationEvent =
  | "navigation_sample"
  | "navigation_slow"
  | "navigation_stalled"
  | "navigation_recovered";
type DocumentEvent =
  | "document_load_sample"
  | "document_load_slow"
  | "document_load_stalled";
type ObservedProtocol = "h3" | "h2" | "http/1.1";

let pendingNavigation: PendingNavigation | null = null;
let clientErrorReported = false;
let documentLoadReported = false;

const staleBuildErrorPatterns = [
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
  /Loading CSS chunk [\w-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
];

function normalizeProtocol(value?: string): ObservedProtocol | undefined {
  return value === "h3" || value === "h2" || value === "http/1.1"
    ? value
    : undefined;
}

function getDocumentProtocol() {
  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;

  return normalizeProtocol(navigation?.nextHopProtocol);
}

function getDeploymentId() {
  for (const script of document.scripts) {
    try {
      const deploymentId = new URL(script.src).searchParams.get("dpl");

      if (deploymentId && /^[a-f0-9]{32}$/i.test(deploymentId)) {
        return deploymentId;
      }
    } catch {
      // Ignore inline scripts and malformed extension-injected script URLs.
    }
  }

  return undefined;
}

function getConnectionType() {
  const connection = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };
  const effectiveType = connection.connection?.effectiveType;

  return ["slow-2g", "2g", "3g", "4g"].includes(effectiveType ?? "")
    ? effectiveType
    : undefined;
}

function getResourceKind(resource?: PerformanceResourceTiming) {
  if (!resource) {
    return undefined;
  }

  const url = new URL(resource.name);

  return url.origin === window.location.origin
    ? "first_party"
    : url.hostname === "assets.changzhouai.club"
      ? "asset_cdn"
      : "third_party";
}

function getSlowestResource(resources: PerformanceResourceTiming[]) {
  return [...resources].sort((left, right) => right.duration - left.duration)[0];
}

function getResourceSummary(startedAt: number, destination: string) {
  const destinationPath = new URL(destination, window.location.origin).pathname;
  const resources = performance
    .getEntriesByType("resource")
    .filter((entry) => entry.startTime >= startedAt - 250) as PerformanceResourceTiming[];
  const routeRequest = resources
    .filter((entry) => {
      const url = new URL(entry.name);
      return (
        url.origin === window.location.origin &&
        url.pathname === destinationPath &&
        url.searchParams.has("_rsc")
      );
    })
    .sort((left, right) => right.duration - left.duration)[0];
  const slowestResource = getSlowestResource(resources);

  return {
    rscDurationMs: routeRequest ? Math.round(routeRequest.duration) : undefined,
    rscStatus: routeRequest?.responseStatus || undefined,
    rscProtocol: normalizeProtocol(routeRequest?.nextHopProtocol),
    slowestResourceDurationMs: slowestResource
      ? Math.round(slowestResource.duration)
      : undefined,
    slowestResourceKind: getResourceKind(slowestResource),
    slowestResourceProtocol: normalizeProtocol(slowestResource?.nextHopProtocol),
  };
}

function getDocumentResourceSummary() {
  const resources = performance.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];
  const slowestResource = getSlowestResource(resources);

  return {
    slowestResourceDurationMs: slowestResource
      ? Math.round(slowestResource.duration)
      : undefined,
    slowestResourceKind: getResourceKind(slowestResource),
    slowestResourceProtocol: normalizeProtocol(slowestResource?.nextHopProtocol),
  };
}

function shouldSamplePerformance(kind: "document" | "navigation") {
  const key = `caic:performance-sample:${kind}`;

  try {
    const existingValue = sessionStorage.getItem(key);

    if (existingValue) {
      return existingValue === "1";
    }

    const sampled = Math.random() < PERFORMANCE_SAMPLE_RATE;
    sessionStorage.setItem(key, sampled ? "1" : "0");
    return sampled;
  } catch {
    return Math.random() < PERFORMANCE_SAMPLE_RATE;
  }
}

function sendObservation(payload: Record<string, unknown>) {
  void fetch("/api/observability/performance", {
    method: "POST",
    credentials: "omit",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}

function reportNavigation(
  event: NavigationEvent,
  navigation: PendingNavigation,
  measuredDurationMs?: number,
) {
  const durationMs =
    measuredDurationMs ?? Math.round(performance.now() - navigation.startedAt);
  const payload = {
    event,
    from: normalizeObservedRoute(new URL(navigation.from, window.location.origin).pathname),
    to: normalizeObservedRoute(new URL(navigation.to, window.location.origin).pathname),
    navigationType: navigation.navigationType,
    durationMs,
    connectionType: getConnectionType(),
    documentProtocol: getDocumentProtocol(),
    visibility: document.visibilityState,
    deploymentId: getDeploymentId(),
    ...getResourceSummary(navigation.startedAt, navigation.to),
  };

  sendObservation(payload);
}

function reportDocumentLoad() {
  if (documentLoadReported) {
    return;
  }

  documentLoadReported = true;
  const navigation = performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined;

  if (!navigation) {
    return;
  }

  const ttfbMs = Math.round(navigation.responseStart);
  const responseEndMs = Math.round(navigation.responseEnd);
  const domContentLoadedMs = Math.round(navigation.domContentLoadedEventEnd);
  const loadMs = Math.round(navigation.loadEventEnd || navigation.duration);
  const event: DocumentEvent | null =
    domContentLoadedMs >= STALLED_DOCUMENT_CONTENT_MS ||
    loadMs >= STALLED_DOCUMENT_LOAD_MS
      ? "document_load_stalled"
      : domContentLoadedMs >= SLOW_DOCUMENT_CONTENT_MS ||
          loadMs >= SLOW_DOCUMENT_LOAD_MS
        ? "document_load_slow"
        : shouldSamplePerformance("document")
          ? "document_load_sample"
          : null;

  if (!event) {
    return;
  }

  const route = normalizeObservedRoute(window.location.pathname);

  sendObservation({
    event,
    from: route,
    to: route,
    navigationType: "unknown",
    durationMs: loadMs,
    ttfbMs,
    responseEndMs,
    domContentLoadedMs,
    loadMs,
    connectionType: getConnectionType(),
    documentProtocol: normalizeProtocol(navigation.nextHopProtocol),
    visibility: document.visibilityState,
    deploymentId: getDeploymentId(),
    ...getDocumentResourceSummary(),
  });
}

function isSameOriginChunkFilename(filename?: string) {
  if (!filename) {
    return false;
  }

  try {
    const url = new URL(filename, window.location.origin);

    return (
      url.origin === window.location.origin &&
      url.pathname.startsWith("/_next/static/chunks/")
    );
  } catch {
    return false;
  }
}

function reserveStaleBuildRecovery(route: string, deploymentId?: string) {
  if (!navigator.onLine) {
    return false;
  }

  const recoveryKey = [
    "caic:stale-build-recovery",
    deploymentId ?? "unknown",
    route,
  ].join(":");

  try {
    if (sessionStorage.getItem(recoveryKey)) {
      return false;
    }

    sessionStorage.setItem(recoveryKey, "1");
    return true;
  } catch {
    return false;
  }
}

function reportClientError(value: unknown, filename?: string) {
  if (clientErrorReported) {
    return;
  }

  const errorText =
    value instanceof Error
      ? `${value.name}\n${value.message}`
      : typeof value === "string"
        ? value
        : "";
  const staleBuildError =
    staleBuildErrorPatterns.some((pattern) => pattern.test(errorText)) ||
    (isSameOriginChunkFilename(filename) &&
      /(ChunkLoadError|Loading|Failed|Script error)/i.test(errorText));

  if (!staleBuildError) {
    if (!filename) {
      return;
    }

    try {
      if (new URL(filename).origin !== window.location.origin) {
        return;
      }
    } catch {
      return;
    }
  }

  clientErrorReported = true;
  const route = normalizeObservedRoute(window.location.pathname);
  const errorName = value instanceof Error ? value.name : "Error";
  const deploymentId = getDeploymentId();
  const recoveryAttempted =
    staleBuildError && reserveStaleBuildRecovery(route, deploymentId);

  sendObservation({
    event: staleBuildError ? "stale_build_error" : "client_error",
    from: route,
    to: route,
    navigationType: "unknown",
    durationMs: 0,
    errorType: ["Error", "TypeError", "ReferenceError", "RangeError", "SyntaxError"].includes(
      errorName,
    )
      ? errorName
      : "Error",
    visibility: document.visibilityState,
    deploymentId,
    recoveryAttempted,
  });

  if (recoveryAttempted) {
    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  }
}

function finishNavigation() {
  const navigation = pendingNavigation;

  if (!navigation) {
    return;
  }

  const destinationPath = new URL(navigation.to, window.location.origin).pathname;

  if (window.location.pathname !== destinationPath) {
    return;
  }

  const routeRequestCompleted =
    getResourceSummary(navigation.startedAt, navigation.to).rscDurationMs !== undefined;

  if (document.title === navigation.startingTitle && !routeRequestCompleted) {
    return;
  }

  window.clearTimeout(navigation.timeoutId);
  pendingNavigation = null;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const durationMs = performance.now() - navigation.startedAt;

      const event: NavigationEvent | null = navigation.stalledReported
        ? "navigation_recovered"
        : durationMs >= SLOW_NAVIGATION_MS
          ? "navigation_slow"
          : shouldSamplePerformance("navigation")
            ? "navigation_sample"
            : null;

      if (event) {
        window.setTimeout(() => {
          reportNavigation(event, navigation, Math.round(durationMs));
        }, 250);
      }
    });
  });
}

if (process.env.NODE_ENV === "production") {
  new MutationObserver(finishNavigation).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("error", (event) => {
    reportClientError(event.error ?? event.message, event.filename);
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(event.reason);
  });
  if (document.readyState === "complete") {
    window.setTimeout(reportDocumentLoad, 0);
  } else {
    window.addEventListener(
      "load",
      () => {
        window.setTimeout(reportDocumentLoad, 0);
      },
      { once: true },
    );
  }
}

export function onRouterTransitionStart(url: string, navigationType: string) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (pendingNavigation) {
    window.clearTimeout(pendingNavigation.timeoutId);
  }

  const navigation: PendingNavigation = {
    from: window.location.href,
    to: url,
    navigationType,
    startedAt: performance.now(),
    startingTitle: document.title,
    timeoutId: 0,
    stalledReported: false,
  };

  navigation.timeoutId = window.setTimeout(() => {
    if (pendingNavigation !== navigation) {
      return;
    }

    navigation.stalledReported = true;
    reportNavigation("navigation_stalled", navigation);
  }, STALLED_NAVIGATION_MS);
  pendingNavigation = navigation;
}
