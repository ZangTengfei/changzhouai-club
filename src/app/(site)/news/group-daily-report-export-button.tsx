"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

import type { WeDailyReport } from "@/lib/wedaily";
import { downloadWeDailyReportTemplatePng } from "@/lib/wedaily-report-export";
import { appendWeDailyReportQrCode } from "@/lib/wedaily-report-qr";

import styles from "./ai-news-page.module.css";

type ExportState = "idle" | "exporting" | "done" | "error";

type GroupDailyReportExportButtonProps = {
  report: WeDailyReport;
};

export function GroupDailyReportExportButton({ report }: GroupDailyReportExportButtonProps) {
  const [state, setState] = useState<ExportState>("idle");

  async function handleExport() {
    if (state === "exporting") {
      return;
    }

    setState("exporting");

    try {
      const response = await fetch(`/api/wedaily/reports/${encodeURIComponent(String(report.id))}/export-template`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "导出图片失败");
      }

      const template = await appendWeDailyReportQrCode(payload, { date: report.date });
      await downloadWeDailyReportTemplatePng(template, `changzhou-group-daily-${report.date || "latest"}.png`);

      setState("done");
      window.setTimeout(() => setState("idle"), 2200);
    } catch (error) {
      console.error("Failed to export group daily report", error);
      setState("error");
    }
  }

  const isExporting = state === "exporting";
  const label = isExporting ? "生成中" : state === "done" ? "已导出" : "导出图片";

  return (
    <button className={styles.dailyExportButton} type="button" onClick={handleExport} disabled={isExporting}>
      {isExporting ? (
        <LoaderCircle aria-hidden="true" data-spin="true" strokeWidth={1.9} />
      ) : (
        <Download aria-hidden="true" strokeWidth={1.9} />
      )}
      <span aria-live="polite">{label}</span>
      {state === "error" ? <small>请重试</small> : null}
    </button>
  );
}
