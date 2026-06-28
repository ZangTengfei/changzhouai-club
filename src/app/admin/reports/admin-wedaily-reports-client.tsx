"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCcw, Save } from "lucide-react";

import { AdminNotice, AdminStatusBadge } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AdminWeDailyReport, AdminWeDailyReportExportTemplate } from "@/lib/admin/wedaily-admin";
import { downloadWeDailyReportTemplatePng } from "@/lib/wedaily-report-export";
import { appendWeDailyReportQrCode } from "@/lib/wedaily-report-qr";

type LoadState = "loading" | "ready" | "error";
type ActionState = "idle" | "saving" | "restoring" | "exporting";
type PreviewState = "idle" | "loading" | "ready" | "error";

type AdminWeDailyReportsClientProps = {
  initialError: string | null;
  initialReports: AdminWeDailyReport[];
  initialSelectedReportId?: number | null;
};

export function AdminWeDailyReportsClient({
  initialError,
  initialReports,
  initialSelectedReportId,
}: AdminWeDailyReportsClientProps) {
  const [reports, setReports] = useState(initialReports);
  const initialReport =
    initialReports.find((report) => report.id === initialSelectedReportId) ?? initialReports[0] ?? null;
  const [selectedReportId, setSelectedReportId] = useState(initialReport?.id ?? null);
  const [markdown, setMarkdown] = useState(initialReport?.markdown ?? "");
  const [loadState, setLoadState] = useState<LoadState>(initialError ? "error" : "ready");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [previewTemplate, setPreviewTemplate] = useState<AdminWeDailyReportExportTemplate | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [message, setMessage] = useState(initialError);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId],
  );
  const isDirty = Boolean(selectedReport && markdown !== selectedReport.markdown);

  useEffect(() => {
    if (selectedReport) {
      setMarkdown(selectedReport.markdown);
    }
  }, [selectedReport?.id]);

  useEffect(() => {
    if (!selectedReport || !markdown.trim()) {
      setPreviewTemplate(null);
      setPreviewState("idle");
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewState("loading");
      setPreviewError(null);

      try {
        const template = await fetchCurrentExportTemplate(selectedReport, markdown);
        if (!cancelled) {
          setPreviewTemplate(template);
          setPreviewState("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setPreviewTemplate(null);
          setPreviewState("error");
          setPreviewError(error instanceof Error ? error.message : "预览渲染失败");
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selectedReport?.id, markdown]);

  async function reloadReports() {
    setLoadState("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/admin/wedaily/reports?limit=30", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        error?: string;
        reports?: AdminWeDailyReport[];
      };

      if (!response.ok) {
        throw new Error(payload.error || "加载日报失败");
      }

      const nextReports = payload.reports ?? [];
      setReports(nextReports);
      setSelectedReportId((current) =>
        current && nextReports.some((report) => report.id === current)
          ? current
          : nextReports[0]?.id ?? null,
      );
      setLoadState("ready");
    } catch (error) {
      setLoadState("error");
      setMessage(error instanceof Error ? error.message : "加载日报失败");
    }
  }

  async function saveMarkdown() {
    if (!selectedReport || actionState !== "idle") {
      return;
    }

    setActionState("saving");
    setMessage(null);

    try {
      const report = await mutateReport(`/api/admin/wedaily/reports/${selectedReport.id}`, {
        body: JSON.stringify({ markdown }),
        method: "PATCH",
      });
      upsertReport(report);
      setMarkdown(report.markdown);
      setMessage("日报已更新，前台缓存已刷新。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setActionState("idle");
    }
  }

  async function restoreMarkdown() {
    if (!selectedReport || actionState !== "idle") {
      return;
    }

    setActionState("restoring");
    setMessage(null);

    try {
      const report = await mutateReport(`/api/admin/wedaily/reports/${selectedReport.id}/restore`, {
        method: "POST",
      });
      upsertReport(report);
      setMarkdown(report.markdown);
      setMessage("已恢复为初始日报正文。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "恢复失败");
    } finally {
      setActionState("idle");
    }
  }

  async function exportImage() {
    if (!selectedReport || actionState !== "idle") {
      return;
    }

    setActionState("exporting");
    setMessage(null);

    try {
      const template = await fetchCurrentExportTemplate(selectedReport, markdown);
      await downloadWeDailyReportTemplatePng(template, `changzhou-group-daily-${selectedReport.date}.png`);
      setMessage("已使用 WeDaily 后台模板导出 PNG。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出图片失败");
    } finally {
      setActionState("idle");
    }
  }

  function upsertReport(report: AdminWeDailyReport) {
    setReports((current) =>
      current.map((item) => (item.id === report.id ? report : item)),
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="grid gap-3 self-start">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Archive
            </p>
            <h2 className="text-base font-semibold text-foreground">最近日报</h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={reloadReports}
            disabled={loadState === "loading"}
          >
            <RefreshCcw className="size-4" />
            刷新
          </Button>
        </div>

        <div className="grid max-h-[72vh] gap-2 overflow-auto pr-1">
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              className={`rounded-[calc(var(--radius)-4px)] border px-3 py-2 text-left transition ${
                report.id === selectedReport?.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-background text-foreground hover:bg-muted/70"
              }`}
              onClick={() => setSelectedReportId(report.id)}
            >
              <strong className="block text-sm font-semibold">{report.date}</strong>
              <span className="block truncate text-xs text-muted-foreground">{report.chat}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="grid min-w-0 gap-3">
        {message ? <AdminNotice>{message}</AdminNotice> : null}

        {selectedReport ? (
          <>
            <header className="flex flex-col gap-3 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AdminStatusBadge tone={isDirty ? "pending" : "active"}>
                    {isDirty ? "未保存" : "已同步"}
                  </AdminStatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {selectedReport.generated_by || "WeDaily"}
                  </span>
                </div>
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {selectedReport.date} · {selectedReport.chat}
                </h2>
                <p className="text-sm text-muted-foreground">
                  更新于 {selectedReport.updated_at || "未知时间"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={saveMarkdown}
                  disabled={!isDirty || actionState !== "idle"}
                >
                  <Save className="size-4" />
                  保存 Markdown
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={restoreMarkdown}
                  disabled={!selectedReport.local_markdown || actionState !== "idle"}
                >
                  <RefreshCcw className="size-4" />
                  恢复初稿
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={exportImage}
                  disabled={actionState !== "idle"}
                >
                  <Download className="size-4" />
                  导出图片
                </Button>
              </div>
            </header>

            <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]">
              <section className="grid min-w-0 gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Markdown</h3>
                  <span className="text-xs text-muted-foreground">{markdown.length} 字符</span>
                </div>
                <Textarea
                  className="min-h-[68vh] resize-y font-mono text-[13px] leading-6"
                  value={markdown}
                  onChange={(event) => setMarkdown(event.target.value)}
                  spellCheck={false}
                />
              </section>

              <section className="grid min-w-0 gap-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">渲染预览</h3>
                  <span className="text-xs text-muted-foreground">
                    {previewState === "loading" ? "更新中" : previewState === "error" ? "渲染失败" : "WeDaily 模板"}
                  </span>
                </div>
                <div className="min-h-[68vh] overflow-hidden rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/40">
                  {previewTemplate ? (
                    <iframe
                      className="h-[68vh] w-full border-0"
                      sandbox="allow-scripts"
                      srcDoc={buildPreviewDocument(previewTemplate)}
                      title="日报渲染预览"
                    />
                  ) : (
                    <div className="grid min-h-[68vh] place-items-center px-6 text-center text-sm text-muted-foreground">
                      {previewState === "error" ? previewError || "预览渲染失败" : "暂无可预览内容"}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        ) : (
          <AdminNotice>
            {loadState === "loading" ? "正在加载日报。" : "暂时没有可编辑的群聊日报。"}
          </AdminNotice>
        )}
      </section>
    </div>
  );
}

async function fetchCurrentExportTemplate(report: AdminWeDailyReport, markdown: string) {
  const response = await fetch(`/api/admin/wedaily/reports/${report.id}/export-template`, {
    body: JSON.stringify({ markdown }),
    cache: "no-store",
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as
    | (AdminWeDailyReportExportTemplate & { error?: string })
    | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.error || "日报渲染失败");
  }

  return appendWeDailyReportQrCode(payload, { date: report.date });
}

function buildPreviewDocument(template: AdminWeDailyReportExportTemplate) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${template.css}</style>
<style>
html,body{height:auto;margin:0;background:#f1eee9;overflow:auto}
body{padding:14px}
#preview-root{transform-origin:top left}
.daily-sheet{transform-origin:top left}
</style>
</head>
<body>
<div id="preview-root">${template.html}</div>
<script>
function fitPreview(){
  var sheet=document.querySelector(".daily-sheet");
  var root=document.getElementById("preview-root");
  if(!sheet||!root)return;
  var width=${template.width || 1080};
  var scale=Math.min(1,(window.innerWidth-28)/width);
  sheet.style.transform="scale("+scale+")";
  sheet.style.transformOrigin="top left";
  root.style.width=(width*scale)+"px";
  root.style.height=Math.ceil(sheet.scrollHeight*scale)+"px";
}
window.addEventListener("resize",fitPreview);
if(document.fonts&&document.fonts.ready){document.fonts.ready.then(fitPreview);}
requestAnimationFrame(fitPreview);
</script>
</body>
</html>`;
}

async function mutateReport(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | (AdminWeDailyReport & { error?: string })
    | null;

  if (!response.ok || !payload) {
    throw new Error(payload?.error || "请求失败");
  }

  return payload;
}
