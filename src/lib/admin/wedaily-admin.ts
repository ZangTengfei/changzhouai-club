import type { WeDailyReportStats } from "@/lib/wedaily";

const DEFAULT_WEDAILY_ADMIN_BASE_URL = "https://wedaily.occcc.cc";
const WEDAILY_ADMIN_REQUEST_TIMEOUT_MS = 12_000;

export type AdminWeDailyReport = {
  id: number;
  chat: string;
  date: string;
  stats: WeDailyReportStats | null;
  generated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  markdown: string;
  local_markdown: string;
};

export type AdminWeDailyReportExportTemplate = {
  html: string;
  css: string;
  fileName: string;
  width: number;
  maxPixelRatio: number;
  maxCanvasEdge: number;
};

type AdminWeDailyReportsResponse = {
  reports?: unknown;
};

type AdminWeDailyConfig = {
  baseUrl: string;
  token: string;
};

export function getAdminWeDailyConfig(): AdminWeDailyConfig | null {
  const token = process.env.WEDAILY_ADMIN_TOKEN?.trim();

  if (!token) {
    return null;
  }

  return {
    baseUrl: (process.env.WEDAILY_ADMIN_API_BASE || DEFAULT_WEDAILY_ADMIN_BASE_URL).replace(/\/+$/g, ""),
    token,
  };
}

export async function listAdminWeDailyReports({
  date,
  limit = 20,
}: {
  date?: string | null;
  limit?: number;
} = {}) {
  const params = new URLSearchParams({
    limit: String(Math.min(200, Math.max(1, limit))),
  });

  if (date) {
    params.set("date", date);
  }

  const payload = await fetchAdminWeDailyJson<AdminWeDailyReportsResponse>(`/api/admin/reports?${params}`);
  const reports = Array.isArray(payload.reports) ? payload.reports.map(normalizeAdminWeDailyReport) : [];

  return reports.filter((report): report is AdminWeDailyReport => report !== null);
}

export async function updateAdminWeDailyReport(reportId: number, markdown: string) {
  const payload = await fetchAdminWeDailyJson<unknown>(`/api/admin/reports/${reportId}`, {
    body: JSON.stringify({ markdown }),
    method: "PATCH",
  });

  const report = normalizeAdminWeDailyReport(payload);

  if (!report) {
    throw new Error("invalid_report_response");
  }

  return report;
}

export async function restoreAdminWeDailyReport(reportId: number) {
  const payload = await fetchAdminWeDailyJson<unknown>(`/api/admin/reports/${reportId}/restore`, {
    method: "POST",
  });

  const report = normalizeAdminWeDailyReport(payload);

  if (!report) {
    throw new Error("invalid_report_response");
  }

  return report;
}

export async function fetchAdminWeDailyReportImage(reportId: number) {
  const config = requireAdminWeDailyConfig();
  const response = await fetch(`${config.baseUrl}/api/admin/reports/${reportId}/image`, {
    headers: buildAdminHeaders(config),
    signal: AbortSignal.timeout(WEDAILY_ADMIN_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(await getRemoteError(response));
  }

  return {
    contentType: response.headers.get("content-type") || "image/png",
    fileName: getContentDispositionFileName(response.headers.get("content-disposition")) ?? `group-daily-${reportId}.png`,
    bytes: await response.arrayBuffer(),
  };
}

export async function fetchAdminWeDailyReportExportTemplate(reportId: number) {
  const payload = await fetchAdminWeDailyJson<unknown>(`/api/admin/reports/${reportId}/export-template`);
  const template = normalizeAdminWeDailyReportExportTemplate(payload);

  if (!template) {
    throw new Error("invalid_report_export_template_response");
  }

  return template;
}

async function fetchAdminWeDailyJson<T>(path: string, init: RequestInit = {}) {
  const config = requireAdminWeDailyConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      ...buildAdminHeaders(config),
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(WEDAILY_ADMIN_REQUEST_TIMEOUT_MS),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getPayloadError(payload) ?? `wedaily_admin_request_failed_${response.status}`);
  }

  return payload as T;
}

function requireAdminWeDailyConfig() {
  const config = getAdminWeDailyConfig();

  if (!config) {
    throw new Error("wedaily_admin_not_configured");
  }

  return config;
}

function buildAdminHeaders(config: AdminWeDailyConfig) {
  return {
    authorization: `Bearer ${config.token}`,
    accept: "application/json",
  };
}

async function getRemoteError(response: Response) {
  const payload = await response.json().catch(() => null);
  return getPayloadError(payload) ?? `wedaily_admin_request_failed_${response.status}`;
}

function getPayloadError(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    return String(payload.error || "");
  }

  return null;
}

function normalizeAdminWeDailyReport(value: unknown): AdminWeDailyReport | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = toInteger(value.id);
  const chat = toStringValue(value.chat);
  const date = toStringValue(value.date);

  if (!id || !chat || !date) {
    return null;
  }

  return {
    id,
    chat,
    date,
    stats: isRecord(value.stats) ? (value.stats as WeDailyReportStats) : null,
    generated_by: toStringValue(value.generated_by),
    created_at: toStringValue(value.created_at),
    updated_at: toStringValue(value.updated_at),
    markdown: toStringValue(value.markdown) ?? "",
    local_markdown: toStringValue(value.local_markdown) ?? "",
  };
}

function normalizeAdminWeDailyReportExportTemplate(value: unknown): AdminWeDailyReportExportTemplate | null {
  if (!isRecord(value)) {
    return null;
  }

  const html = toStringValue(value.html);
  const css = toStringValue(value.css);
  const fileName = toStringValue(value.fileName);

  if (!html || !css || !fileName) {
    return null;
  }

  return {
    html,
    css,
    fileName,
    width: toPositiveInteger(value.width) ?? 1080,
    maxPixelRatio: toPositiveInteger(value.maxPixelRatio) ?? 2,
    maxCanvasEdge: toPositiveInteger(value.maxCanvasEdge) ?? 30000,
  };
}

function getContentDispositionFileName(value: string | null) {
  const match = value?.match(/filename="([^"]+)"/i);
  return match?.[1] ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toInteger(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveInteger(value: unknown) {
  const parsed = toInteger(value);
  return parsed && parsed > 0 ? parsed : null;
}

function toStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
