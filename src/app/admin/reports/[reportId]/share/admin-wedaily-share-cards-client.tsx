"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, LoaderCircle, ShieldCheck, X } from "lucide-react";
import QRCode from "qrcode";

import { AdminNotice, AdminStatusBadge } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminWeDailyReport } from "@/lib/admin/wedaily-admin";
import type { ParsedWeDailyMarkdown } from "@/lib/wedaily";
import {
  DAILY_SHARE_CARD_CSS,
  DAILY_SHARE_CARD_HEIGHT,
  DAILY_SHARE_CARD_WIDTH,
  downloadDailyShareCardPng,
} from "@/lib/wedaily-share-card";

const MAX_TOPIC_CARDS = 6;
const PREVIEW_SCALE = 0.34;
const TOPIC_EMOJIS = ["💡", "🔍", "🧰", "🚀", "🧠", "✨"];

type SourceTopic = {
  id: string;
  label: string;
  title: string;
  summary: string;
};

type ShareTopicCard = SourceTopic;

type CardExport = {
  fileName: string;
  id: string;
  label: string;
};

export function AdminWeDailyShareCardsClient({
  report,
  parsed,
}: {
  report: AdminWeDailyReport;
  parsed: ParsedWeDailyMarkdown;
}) {
  const sourceTopics = useMemo(() => buildSourceTopics(parsed), [parsed]);
  const [coverTitle, setCoverTitle] = useState("常州 AI Club 群聊精华");
  const [coverSummary, setCoverSummary] = useState(
    parsed.overview || "从一天的群聊中，选出值得继续讨论的本地 AI 观察与实践线索。",
  );
  const [selectedCards, setSelectedCards] = useState<ShareTopicCard[]>(() =>
    sourceTopics.filter((item) => item.label === "今日要点").slice(0, 4),
  );
  const [privacyReviewed, setPrivacyReviewed] = useState(false);
  const [socialTitle, setSocialTitle] = useState(() => formatDailyReportTitle(report.date));
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const reportUrl = `https://changzhouai.club/news?view=local&date=${encodeURIComponent(report.date)}`;

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(reportUrl, {
      color: { dark: "#173d33", light: "#ffffff" },
      errorCorrectionLevel: "M",
      margin: 1,
      width: 266,
    }).then((value) => {
      if (!cancelled) setQrCodeDataUrl(value);
    }).catch(() => {
      if (!cancelled) setMessage("二维码生成失败，暂时无法导出结尾卡。");
    });

    return () => {
      cancelled = true;
    };
  }, [reportUrl]);

  useEffect(() => {
    setCopyState("idle");
  }, [selectedCards, socialTitle]);

  function toggleTopic(topic: SourceTopic) {
    const selected = selectedCards.some((item) => item.id === topic.id);

    if (selected) {
      setSelectedCards((current) => current.filter((item) => item.id !== topic.id));
      setMessage(null);
      return;
    }

    if (selectedCards.length >= MAX_TOPIC_CARDS) {
      setMessage(`第一版最多选择 ${MAX_TOPIC_CARDS} 个话题。`);
      return;
    }

    setSelectedCards((current) => [...current, topic]);
    setMessage(null);
  }

  function updateTopic(id: string, key: "label" | "title" | "summary", value: string) {
    setSelectedCards((current) => current.map((item) =>
      item.id === id ? { ...item, [key]: value } : item
    ));
  }

  function bindCardRef(id: string) {
    return (node: HTMLElement | null) => {
      if (node) cardRefs.current.set(id, node);
      else cardRefs.current.delete(id);
    };
  }

  async function exportCards() {
    if (!privacyReviewed || !qrCodeDataUrl || exporting) return;

    setExporting(true);
    setMessage(null);

    try {
      for (const card of cardExports) {
        const element = cardRefs.current.get(card.id);
        if (!element) throw new Error(`missing_card_${card.id}`);
        await downloadDailyShareCardPng(element, card.fileName);
      }
      setMessage(`已导出 ${cardExports.length} 张 PNG。若浏览器拦截多文件，可在预览区逐张导出。`);
    } catch (error) {
      setMessage(error instanceof Error ? `导出失败：${error.message}` : "导出失败，请稍后重试。");
    } finally {
      setExporting(false);
    }
  }

  async function exportSingleCard(card: CardExport) {
    if (!privacyReviewed || exporting || (card.id === "end" && !qrCodeDataUrl)) return;

    const element = cardRefs.current.get(card.id);
    if (!element) {
      setMessage(`导出失败：missing_card_${card.id}`);
      return;
    }

    setExporting(true);
    setMessage(null);

    try {
      await downloadDailyShareCardPng(element, card.fileName);
      setMessage(`已导出${card.label}。`);
    } catch (error) {
      setMessage(error instanceof Error ? `导出失败：${error.message}` : "导出失败，请稍后重试。");
    } finally {
      setExporting(false);
    }
  }

  async function copySocialText() {
    try {
      await navigator.clipboard.writeText(socialCopyText);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const selectedIds = new Set(selectedCards.map((item) => item.id));
  const socialTopicLines = selectedCards.map(
    (card, index) => `${TOPIC_EMOJIS[index % TOPIC_EMOJIS.length]} ${card.title}`,
  );
  const socialCopyText = [
    ...(socialTitle.trim() ? [socialTitle.trim(), ""] : []),
    ...socialTopicLines,
  ].join("\n");
  const cardExports: CardExport[] = [
    {
      id: "cover",
      label: "封面",
      fileName: `01-${report.date}-群聊精华-封面.png`,
    },
    ...selectedCards.map((card, index) => ({
      id: card.id,
      label: `话题卡 ${index + 1}`,
      fileName: `${String(index + 2).padStart(2, "0")}-${report.date}-精华话题.png`,
    })),
    {
      id: "end",
      label: "二维码结尾卡",
      fileName: `${String(selectedCards.length + 2).padStart(2, "0")}-${report.date}-查看完整日报.png`,
    },
  ];

  return (
    <div className="grid gap-4">
      <style dangerouslySetInnerHTML={{ __html: DAILY_SHARE_CARD_CSS }} />

      <header className="flex flex-col gap-3 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <AdminStatusBadge tone="active">HTML 模板</AdminStatusBadge>
            <AdminStatusBadge tone={privacyReviewed ? "active" : "pending"}>
              {privacyReviewed ? "已确认公开" : "待隐私确认"}
            </AdminStatusBadge>
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {report.date} · 精华贴图
          </h2>
          <p className="text-sm text-muted-foreground">
            已选 {selectedCards.length} 个话题，共生成 {selectedCards.length + 2} 张图片。
          </p>
        </div>
        <Button
          type="button"
          data-testid="daily-share-export"
          onClick={exportCards}
          disabled={!privacyReviewed || !qrCodeDataUrl || exporting}
        >
          {exporting ? <LoaderCircle className="animate-spin" /> : <Download />}
          {exporting ? "导出中" : "批量导出 PNG"}
        </Button>
      </header>

      {message ? <AdminNotice>{message}</AdminNotice> : null}

      <section className="grid gap-4 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4 lg:grid-cols-[minmax(260px,0.72fr)_minmax(360px,1.28fr)]">
        <div className="grid content-start gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Social Copy
            </p>
            <h3 className="text-base font-semibold text-foreground">配套发布文案</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              标题统一使用日期日报；所选话题会自动生成一行一条的 emoji 清单。
            </p>
          </div>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">发布标题</span>
            <Input
              data-testid="daily-share-social-title"
              value={socialTitle}
              onChange={(event) => setSocialTitle(event.target.value)}
              maxLength={24}
            />
          </label>
        </div>

        <div className="grid gap-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">复制内容</span>
            <Textarea
              data-testid="daily-share-social-copy"
              value={socialCopyText}
              readOnly
              className="min-h-36 resize-y font-mono text-sm leading-6"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {copyState === "error" ? "复制失败，请手动选择上方文字。" : `${socialTopicLines.length} 个精华话题`}
            </span>
            <Button
              type="button"
              variant="secondary"
              data-testid="daily-share-copy-text"
              disabled={!socialTopicLines.length}
              onClick={() => void copySocialText()}
            >
              {copyState === "copied" ? <Check /> : <Copy />}
              {copyState === "copied" ? "已复制" : "复制标题与话题"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[300px_minmax(360px,0.9fr)_minmax(420px,1fr)]">
        <aside className="grid content-start gap-3 self-start xl:sticky xl:top-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Source
            </p>
            <h3 className="text-base font-semibold text-foreground">选择公开话题</h3>
          </div>
          <div className="grid max-h-[76vh] gap-2 overflow-auto pr-1">
            {sourceTopics.map((topic) => (
              <label
                key={topic.id}
                className={`flex cursor-pointer gap-3 rounded-[calc(var(--radius)-4px)] border p-3 transition ${
                  selectedIds.has(topic.id)
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/70 bg-background hover:bg-muted/60"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-primary"
                  checked={selectedIds.has(topic.id)}
                  onChange={() => toggleTopic(topic)}
                />
                <span className="min-w-0 space-y-1">
                  <small className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                    {topic.label}
                  </small>
                  <strong className="block text-sm leading-5 text-foreground">{topic.title}</strong>
                  <span className="line-clamp-3 block text-xs leading-5 text-muted-foreground">
                    {topic.summary}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </aside>

        <section className="grid min-w-0 content-start gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Edit
            </p>
            <h3 className="text-base font-semibold text-foreground">编辑公开文案</h3>
          </div>

          <div className="grid gap-3 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4">
            <strong className="text-sm font-semibold text-foreground">封面</strong>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">标题</span>
              <Input
                data-testid="daily-share-cover-title"
                value={coverTitle}
                onChange={(event) => setCoverTitle(event.target.value)}
                maxLength={28}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">一句话概览</span>
              <Textarea
                value={coverSummary}
                onChange={(event) => setCoverSummary(event.target.value)}
                className="min-h-28 resize-y"
                maxLength={180}
              />
            </label>
          </div>

          {selectedCards.map((card, index) => (
            <div
              key={card.id}
              className="grid gap-3 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-semibold text-foreground">
                  话题卡 {index + 1}
                </strong>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`移除话题卡 ${index + 1}`}
                  onClick={() => toggleTopic(card)}
                >
                  <X />
                </Button>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">栏目</span>
                <Input
                  value={card.label}
                  onChange={(event) => updateTopic(card.id, "label", event.target.value)}
                  maxLength={12}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">标题</span>
                <Input
                  value={card.title}
                  onChange={(event) => updateTopic(card.id, "title", event.target.value)}
                  maxLength={32}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">公开摘要</span>
                <Textarea
                  value={card.summary}
                  onChange={(event) => updateTopic(card.id, "summary", event.target.value)}
                  className="min-h-32 resize-y"
                  maxLength={180}
                />
              </label>
            </div>
          ))}

          <label className="flex cursor-pointer items-start gap-3 rounded-[calc(var(--radius)-2px)] border border-amber-300/70 bg-amber-50 p-4 text-amber-950">
            <input
              type="checkbox"
              data-testid="daily-share-privacy"
              className="mt-1 size-4 accent-amber-700"
              checked={privacyReviewed}
              onChange={(event) => setPrivacyReviewed(event.target.checked)}
            />
            <span className="grid gap-1">
              <strong className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4" />
                已完成公开发布检查
              </strong>
              <span className="text-xs leading-5 text-amber-900/80">
                确认卡片不包含成员姓名、联系方式、群聊原话或不适合公开的信息。
              </span>
            </span>
          </label>
        </section>

        <section className="grid min-w-0 content-start gap-3 xl:sticky xl:top-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Preview
            </p>
            <h3 className="text-base font-semibold text-foreground">卡片预览</h3>
          </div>
          <div className="grid max-h-[82vh] gap-3 overflow-auto rounded-[calc(var(--radius)-2px)] border border-border/70 bg-[#ddd7cc] p-3">
            <CardPreviewFrame
              actionLabel="导出封面"
              disabled={!privacyReviewed || exporting}
              onExport={() => void exportSingleCard(cardExports[0])}
            >
              <DailyShareCoverCard
                cardRef={bindCardRef("cover")}
                date={report.date}
                title={coverTitle}
                summary={coverSummary}
                messageCount={report.stats?.message_count ?? 0}
                speakerCount={report.stats?.speaker_count ?? 0}
                topicCount={selectedCards.length}
              />
            </CardPreviewFrame>

            {selectedCards.map((card, index) => (
              <CardPreviewFrame
                key={card.id}
                actionLabel={`导出话题卡 ${index + 1}`}
                disabled={!privacyReviewed || exporting}
                onExport={() => void exportSingleCard(cardExports[index + 1])}
              >
                <DailyShareTopicCard
                  cardRef={bindCardRef(card.id)}
                  card={card}
                  date={report.date}
                  index={index + 1}
                  total={selectedCards.length}
                />
              </CardPreviewFrame>
            ))}

            <CardPreviewFrame
              actionLabel="单独导出二维码结尾卡"
              disabled={!privacyReviewed || !qrCodeDataUrl || exporting}
              onExport={() => void exportSingleCard(cardExports[cardExports.length - 1])}
            >
              <DailyShareEndCard
                cardRef={bindCardRef("end")}
                date={report.date}
                qrCodeDataUrl={qrCodeDataUrl}
                reportUrl={reportUrl}
              />
            </CardPreviewFrame>
          </div>
        </section>
      </div>
    </div>
  );
}

function buildSourceTopics(parsed: ParsedWeDailyMarkdown): SourceTopic[] {
  return [
    ...parsed.highlights.map((item) => ({
      id: `highlight-${item.index}`,
      label: "今日要点",
      title: item.title,
      summary: item.summary,
    })),
    ...parsed.discussions.map((item) => ({
      id: `discussion-${item.index}`,
      label: "重点讨论",
      title: item.title,
      summary: item.conclusion,
    })),
    ...parsed.resources.map((item) => ({
      id: `resource-${item.index}`,
      label: "干货资源",
      title: item.title,
      summary: item.body.replace(/https?:\/\/\S+/g, "").trim(),
    })),
  ].filter((item) => item.title && item.summary);
}

function formatDailyReportTitle(date: string) {
  const [, month = "", day = ""] = date.split("-");
  return `${Number(month)}月${Number(day)}日群聊日报`;
}

function CardPreviewFrame({
  actionLabel,
  children,
  disabled,
  onExport,
}: {
  actionLabel: string;
  children: React.ReactNode;
  disabled: boolean;
  onExport: () => void;
}) {
  return (
    <div className="mx-auto grid gap-2">
      <div
        className="overflow-hidden rounded-sm shadow-[0_16px_42px_rgba(36,28,20,0.18)]"
        style={{
          height: DAILY_SHARE_CARD_HEIGHT * PREVIEW_SCALE,
          width: DAILY_SHARE_CARD_WIDTH * PREVIEW_SCALE,
        }}
      >
        <div
          style={{
            height: DAILY_SHARE_CARD_HEIGHT,
            transform: `scale(${PREVIEW_SCALE})`,
            transformOrigin: "top left",
            width: DAILY_SHARE_CARD_WIDTH,
          }}
        >
          {children}
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onExport}>
        <Download />
        {actionLabel}
      </Button>
    </div>
  );
}

function DailyShareCoverCard({
  cardRef,
  date,
  title,
  summary,
  messageCount,
  speakerCount,
  topicCount,
}: {
  cardRef: (node: HTMLElement | null) => void;
  date: string;
  title: string;
  summary: string;
  messageCount: number;
  speakerCount: number;
  topicCount: number;
}) {
  return (
    <article className="daily-share-card" data-share-card="cover" ref={cardRef}>
      <CardMeta date={date} />
      <main className="daily-share-card__cover-main">
        <p className="daily-share-card__eyebrow">LOCAL AI COMMUNITY · DAILY NOTES</p>
        <h2>{title || "群聊精华"}</h2>
        <p className="daily-share-card__cover-summary">{summary}</p>
        <div className="daily-share-card__stats">
          <CardStat label="今日消息" value={messageCount} />
          <CardStat label="参与成员" value={speakerCount} />
          <CardStat label="精选话题" value={topicCount} />
        </div>
      </main>
      <CardFooter text="从群聊中打捞值得继续讨论的真实问题" />
    </article>
  );
}

function DailyShareTopicCard({
  cardRef,
  card,
  date,
  index,
  total,
}: {
  cardRef: (node: HTMLElement | null) => void;
  card: ShareTopicCard;
  date: string;
  index: number;
  total: number;
}) {
  return (
    <article className="daily-share-card daily-share-card--topic" data-share-card={`topic-${index}`} ref={cardRef}>
      <CardMeta date={date} />
      <main className="daily-share-card__topic-main">
        <p className="daily-share-card__eyebrow">{card.label || "精华话题"}</p>
        <div className="daily-share-card__topic-number">{String(index).padStart(2, "0")}</div>
        <h2>{card.title || "待补充标题"}</h2>
        <p className="daily-share-card__topic-summary">{card.summary}</p>
      </main>
      <CardFooter text={`今日精华 ${index} / ${total}`} />
    </article>
  );
}

function DailyShareEndCard({
  cardRef,
  date,
  qrCodeDataUrl,
  reportUrl,
}: {
  cardRef: (node: HTMLElement | null) => void;
  date: string;
  qrCodeDataUrl: string;
  reportUrl: string;
}) {
  return (
    <article className="daily-share-card daily-share-card--end" data-share-card="end" ref={cardRef}>
      <CardMeta date={date} />
      <main className="daily-share-card__end-main">
        <p className="daily-share-card__eyebrow">READ THE FULL REPORT</p>
        <h2>扫码查看完整群聊日报</h2>
        <p>更多重点讨论、干货资源与行动线索，都整理在当天的完整日报中。</p>
        <div className="daily-share-card__qr">
          {qrCodeDataUrl ? (
            <img src={qrCodeDataUrl} alt="完整日报二维码" data-export-overlay />
          ) : null}
        </div>
      </main>
      <CardFooter text={reportUrl} />
    </article>
  );
}

function CardMeta({ date }: { date: string }) {
  return (
    <header className="daily-share-card__meta">
      <span className="daily-share-card__brand">Changzhou AI Club</span>
      <span>{date}</span>
    </header>
  );
}

function CardStat({ label, value }: { label: string; value: number }) {
  return (
    <span className="daily-share-card__stat">
      <strong>{value.toLocaleString("zh-CN")}</strong>
      <span>{label}</span>
    </span>
  );
}

function CardFooter({ text }: { text: string }) {
  return (
    <footer className="daily-share-card__footer">
      <span>{text}</span>
      <span>连接 · 分享 · 共创</span>
    </footer>
  );
}
