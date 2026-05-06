"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, ExternalLink, LoaderCircle, Play, Radar, RefreshCw } from "lucide-react";

import {
  AdminField,
  AdminMetric,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

type RadarCandidate = {
  id: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string | null;
  sourceName: string;
  sourceType: string;
  score: number;
  materialValue: "高" | "中" | "低";
  suggestedColumns: string[];
  recommendedAction: string;
  reasons: string[];
  localAngle: string;
};

type SourceResult = {
  sourceId: string;
  sourceName: string;
  itemCount: number;
  error: string | null;
};

type RadarReport = {
  meta: {
    generatedAt: string;
    sinceHours: number;
    minScore: number;
    selectedSourceCount: number;
    fetchedItemCount: number;
    relevantItemCount: number;
    candidateCount: number;
  };
  candidates: RadarCandidate[];
  sourceResults: SourceResult[];
};

type RadarRunResult = {
  command: string;
  durationMs: number;
  finishedAt: string;
  report: RadarReport;
  startedAt: string;
  stderr?: string;
};

type RadarSettings = {
  sinceHours: string;
  limit: string;
  minScore: string;
  sourceType: string;
};

const defaultSettings: RadarSettings = {
  limit: "8",
  minScore: "45",
  sinceHours: "72",
  sourceType: "all",
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value?: string | null) {
  if (!value) {
    return "未知时间";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }

  return dateFormatter.format(date);
}

function formatDuration(ms: number) {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

function getValueTone(value: RadarCandidate["materialValue"]) {
  if (value === "高") {
    return "completed";
  }

  if (value === "中") {
    return "pending";
  }

  return "neutral";
}

function buildRunSteps(result: RadarRunResult | null, isRunning: boolean) {
  if (isRunning) {
    return [
      { label: "提交任务", detail: "请求已发送到后台", status: "completed" },
      { label: "抓取来源", detail: "正在拉取 RSS / Atom 来源", status: "active" },
      { label: "去重评分", detail: "等待脚本返回结构化报告", status: "pending" },
      { label: "展示结果", detail: "候选列表生成后会自动刷新", status: "pending" },
    ];
  }

  if (!result) {
    return [
      { label: "提交任务", detail: "待触发", status: "pending" },
      { label: "抓取来源", detail: "待触发", status: "pending" },
      { label: "去重评分", detail: "待触发", status: "pending" },
      { label: "展示结果", detail: "待触发", status: "pending" },
    ];
  }

  return [
    { label: "提交任务", detail: formatDate(result.startedAt), status: "completed" },
    {
      label: "抓取来源",
      detail: `${result.report.meta.selectedSourceCount} 个来源，${result.report.meta.fetchedItemCount} 条原始记录`,
      status: "completed",
    },
    {
      label: "去重评分",
      detail: `${result.report.meta.relevantItemCount} 条相关，最低分 ${result.report.meta.minScore}`,
      status: "completed",
    },
    {
      label: "展示结果",
      detail: `${result.report.meta.candidateCount} 条候选，用时 ${formatDuration(result.durationMs)}`,
      status: "completed",
    },
  ];
}

export function AdminAiNewsRadarPageClient() {
  const [settings, setSettings] = useState<RadarSettings>(defaultSettings);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RadarRunResult | null>(null);

  const runSteps = useMemo(() => buildRunSteps(result, isRunning), [isRunning, result]);
  const warningSources = result?.report.sourceResults.filter((source) => source.error) ?? [];

  async function runRadar() {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/ai-news-radar/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          limit: Number.parseInt(settings.limit, 10),
          minScore: Number.parseInt(settings.minScore, 10),
          sinceHours: Number.parseInt(settings.sinceHours, 10),
          sourceType: settings.sourceType,
        }),
      });
      const payload = (await response.json()) as RadarRunResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "抓取失败，请稍后重试。");
      }

      setResult(payload);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "抓取失败，请稍后重试。");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow="AI Radar"
          title="AI 信息雷达控制台"
          actions={
            <>
              <AdminMetric label="候选" value={result?.report.meta.candidateCount ?? "-"} />
              <AdminMetric label="原始" value={result?.report.meta.fetchedItemCount ?? "-"} />
              <Button onClick={runRadar} disabled={isRunning}>
                {isRunning ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
                一键抓取
              </Button>
            </>
          }
        />
        <AdminPanelBody>
          <div className="grid gap-3 lg:grid-cols-[0.75fr_0.75fr_0.75fr_1fr_auto] lg:items-end">
            <AdminField label="时间窗口">
              <NativeSelect
                value={settings.sinceHours}
                onChange={(event) => setSettings((current) => ({ ...current, sinceHours: event.target.value }))}
              >
                <option value="24">最近 24 小时</option>
                <option value="72">最近 3 天</option>
                <option value="168">最近 7 天</option>
                <option value="720">最近 30 天</option>
              </NativeSelect>
            </AdminField>
            <AdminField label="候选数量">
              <NativeSelect
                value={settings.limit}
                onChange={(event) => setSettings((current) => ({ ...current, limit: event.target.value }))}
              >
                <option value="5">5 条</option>
                <option value="8">8 条</option>
                <option value="12">12 条</option>
                <option value="20">20 条</option>
              </NativeSelect>
            </AdminField>
            <AdminField label="最低分">
              <NativeSelect
                value={settings.minScore}
                onChange={(event) => setSettings((current) => ({ ...current, minScore: event.target.value }))}
              >
                <option value="35">35</option>
                <option value="45">45</option>
                <option value="60">60</option>
                <option value="70">70</option>
              </NativeSelect>
            </AdminField>
            <AdminField label="来源类型">
              <NativeSelect
                value={settings.sourceType}
                onChange={(event) => setSettings((current) => ({ ...current, sourceType: event.target.value }))}
              >
                <option value="all">全部来源</option>
                <option value="official">官方源</option>
                <option value="media">媒体源</option>
                <option value="research">研究源</option>
                <option value="media-cn">中文媒体</option>
              </NativeSelect>
            </AdminField>
            <Button onClick={runRadar} disabled={isRunning} variant="secondary">
              {isRunning ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              重新抓取
            </Button>
          </div>
        </AdminPanelBody>
      </AdminPanel>

      {error ? (
        <AdminNotice className="border-rose-200 bg-rose-50 text-rose-700">
          <AlertTriangle className="mr-2 inline size-4" />
          {error}
        </AdminNotice>
      ) : null}

      <AdminPanel>
        <AdminPanelHeader eyebrow="Runbook" title="抓取过程" />
        <AdminPanelBody>
          <div className="grid gap-3 md:grid-cols-4">
            {runSteps.map((step, index) => (
              <div key={step.label} className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-background text-sm font-semibold text-foreground">
                    {index + 1}
                  </span>
                  <AdminStatusBadge tone={step.status === "completed" ? "completed" : step.status === "active" ? "active" : "pending"}>
                    {step.status === "completed" ? "完成" : step.status === "active" ? "运行中" : "等待"}
                  </AdminStatusBadge>
                </div>
                <h2 className="mt-3 text-sm font-semibold text-foreground">{step.label}</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>
              </div>
            ))}
          </div>
          {result ? (
            <div className="mt-3 rounded-[calc(var(--radius)-4px)] border border-border/70 bg-background/70 p-3 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <Clock3 className="size-4" />
                <span>生成时间：{formatDate(result.report.meta.generatedAt)}</span>
                <span>执行耗时：{formatDuration(result.durationMs)}</span>
              </div>
              <code className="mt-2 block overflow-x-auto whitespace-nowrap rounded bg-muted/50 px-2 py-1 text-[11px] text-foreground">
                {result.command}
              </code>
            </div>
          ) : null}
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader eyebrow="Sources" title="来源抓取明细" />
        <AdminPanelBody>
          {result ? (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {result.report.sourceResults.map((source) => (
                <div key={source.sourceId} className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-foreground">{source.sourceName}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{source.itemCount} 条记录</p>
                    </div>
                    <AdminStatusBadge tone={source.error ? "cancelled" : "completed"}>
                      {source.error ? "异常" : "正常"}
                    </AdminStatusBadge>
                  </div>
                  {source.error ? <p className="mt-2 text-xs leading-5 text-rose-700">{source.error}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <AdminNotice>点击一键抓取后，这里会显示每个来源的返回数量和异常信息。</AdminNotice>
          )}
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader
          eyebrow="Candidates"
          title="候选结果"
          actions={
            result ? (
              <AdminStatusBadge tone={warningSources.length > 0 ? "pending" : "completed"}>
                {warningSources.length > 0 ? `${warningSources.length} 个来源异常` : "来源正常"}
              </AdminStatusBadge>
            ) : null
          }
        />
        <AdminPanelBody>
          {result && result.report.candidates.length > 0 ? (
            <div className="grid gap-3">
              {result.report.candidates.map((candidate, index) => (
                <article key={candidate.id} className="rounded-[calc(var(--radius)-4px)] border border-border/70 bg-background/70 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                          {index + 1}
                        </span>
                        <AdminStatusBadge tone={getValueTone(candidate.materialValue)}>
                          {candidate.materialValue}价值
                        </AdminStatusBadge>
                        <AdminStatusBadge tone="neutral">{candidate.score} 分</AdminStatusBadge>
                        <span className="text-xs text-muted-foreground">{candidate.sourceName}</span>
                      </div>
                      <h2 className="text-base font-semibold leading-6 text-foreground">{candidate.title}</h2>
                      <p className="text-xs text-muted-foreground">{formatDate(candidate.publishedAt)}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={candidate.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        原文
                      </a>
                    </Button>
                  </div>

                  {candidate.summary ? (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{candidate.summary}</p>
                  ) : null}

                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <div className="rounded-[calc(var(--radius)-6px)] bg-muted/35 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        本地角度
                      </p>
                      <p className="mt-1 text-sm leading-6 text-foreground">{candidate.localAngle}</p>
                    </div>
                    <div className="rounded-[calc(var(--radius)-6px)] bg-muted/35 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        建议动作
                      </p>
                      <p className="mt-1 text-sm leading-6 text-foreground">{candidate.recommendedAction}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {candidate.suggestedColumns.map((column) => (
                      <AdminStatusBadge key={column} tone="active">
                        {column}
                      </AdminStatusBadge>
                    ))}
                    {candidate.reasons.slice(0, 5).map((reason) => (
                      <AdminStatusBadge key={reason} tone="neutral">
                        {reason}
                      </AdminStatusBadge>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : result ? (
            <AdminNotice>当前条件下没有候选结果，可以放宽时间窗口或最低分。</AdminNotice>
          ) : (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[calc(var(--radius)-4px)] border border-dashed border-border/80 bg-muted/20 p-8 text-center">
              <Radar className="size-9 text-muted-foreground" />
              <h2 className="mt-3 text-base font-semibold text-foreground">等待第一次抓取</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                抓取完成后会显示候选新闻、来源状态、评分理由和本地内容角度。
              </p>
            </div>
          )}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
