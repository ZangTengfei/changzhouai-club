"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

import type { WeDailyDiscussion, WeDailyHighlight, WeDailyReport, WeDailyResource } from "@/lib/wedaily";

import styles from "./ai-news-page.module.css";

const POSTER_WIDTH = 1080;
const POSTER_PADDING = 76;
const POSTER_CONTENT_WIDTH = POSTER_WIDTH - POSTER_PADDING * 2;
const CARD_INSET = 28;
const POSTER_BACKGROUND = "#fff7ed";
const POSTER_INK = "#1f2524";
const POSTER_MUTED = "#745f48";
const POSTER_MUTED_LIGHT = "#8a7661";
const POSTER_ACCENT = "#0f7a6a";
const POSTER_ORANGE = "#bc6d2a";
const POSTER_ORANGE_DARK = "#7d3f12";
const POSTER_LINE = "#eadfce";
const POSTER_CARD = "#fffdf8";
const POSTER_SOFT = "#fdf1df";
const POSTER_FONT = "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC', system-ui, sans-serif";
const EXPORT_PIXEL_RATIO = 3;
const MAX_CANVAS_EDGE = 32_000;

type ExportState = "idle" | "exporting" | "done" | "error";

type PosterSvg = {
  height: number;
  svg: string;
  width: number;
};

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
      await downloadPosterPng(
        buildGroupDailyReportPosterSvg(report),
        `changzhou-group-daily-${report.date || "latest"}.png`,
      );
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

function buildGroupDailyReportPosterSvg(report: WeDailyReport): PosterSvg {
  const body: string[] = [];
  let y = POSTER_PADDING;

  body.push(
    `<path d="M0 0H${POSTER_WIDTH}V220H0Z" fill="#f7ead8"/>`,
    `<path d="M0 180C190 132 318 220 505 166C720 104 842 92 1080 144V0H0Z" fill="#fffdf8" opacity="0.62"/>`,
    `<path d="M0 330C182 286 328 358 548 304C742 256 878 210 1080 246V0H0Z" fill="#e9f5f0" opacity="0.58"/>`,
  );

  body.push(renderText(["常州 AI Club"], POSTER_PADDING, y + 8, 22, 900, POSTER_ACCENT, 30));
  body.push(renderBadge(POSTER_WIDTH - POSTER_PADDING - 210, y - 10, 210, 44, "GROUP DAILY"));
  y += 84;

  const titleLines = wrapTextToWidth(report.parsed.title, 44, POSTER_CONTENT_WIDTH, 3);
  body.push(renderText(titleLines, POSTER_PADDING, y, 44, 950, POSTER_INK, 54));
  y += titleLines.length * 54 + 20;

  const metaLines = wrapTextToWidth(
    `${report.chat} · ${report.date} · ${report.generated_by ?? "WeDaily"} · 工具原作者：小淳`,
    20,
    POSTER_CONTENT_WIDTH,
    2,
  );
  body.push(renderText(metaLines, POSTER_PADDING, y, 20, 850, POSTER_MUTED, 30));
  y += metaLines.length * 30 + 28;

  y = renderStats(body, y, report);

  if (report.parsed.quote) {
    y = renderParagraphCard(body, y, "QUOTE", "今日引语", report.parsed.quote, POSTER_ORANGE);
  }

  if (report.parsed.overview) {
    y = renderParagraphCard(body, y, "ONE-LINE BRIEF", "一句话概览", report.parsed.overview, POSTER_ACCENT);
  }

  if (report.parsed.highlights.length > 0) {
    y = renderHighlightSection(body, y, report.parsed.highlights);
  }

  if (report.parsed.discussions.length > 0) {
    y = renderDiscussionSection(body, y, report.parsed.discussions);
  }

  if (report.parsed.resources.length > 0) {
    y = renderResourceSection(body, y, report.parsed.resources);
  }

  if (report.parsed.vibe) {
    y = renderParagraphCard(body, y, "TODAY'S VIBE", "高光时刻 / 群氛围", report.parsed.vibe, POSTER_ORANGE);
  }

  if (report.parsed.tags.length > 0) {
    y = renderTagsSection(body, y, report.parsed.tags);
  }

  y = renderFooter(body, y);

  const height = y + POSTER_PADDING;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${height}" viewBox="0 0 ${POSTER_WIDTH} ${height}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">`,
    `<rect width="${POSTER_WIDTH}" height="${height}" fill="${POSTER_BACKGROUND}"/>`,
    ...body,
    "</svg>",
  ].join("");

  return {
    height,
    svg,
    width: POSTER_WIDTH,
  };
}

function renderStats(body: string[], y: number, report: WeDailyReport) {
  const stats = [
    { label: "今日消息", value: formatCount(report.stats?.message_count) },
    { label: "参与成员", value: formatCount(report.stats?.speaker_count) },
    { label: "话题要点", value: formatCount(report.parsed.highlights.length) },
    { label: "干货机会", value: formatCount(report.parsed.resources.length) },
  ];
  const gap = 12;
  const cardWidth = (POSTER_CONTENT_WIDTH - gap * 3) / 4;

  stats.forEach((item, index) => {
    const x = POSTER_PADDING + index * (cardWidth + gap);
    body.push(renderRoundedRect(x, y, cardWidth, 92, 18, "rgba(255,255,255,0.72)", "rgba(188,109,42,0.18)"));
    body.push(renderText([item.value], x + 18, y + 34, 30, 950, POSTER_INK, 34));
    body.push(renderText([item.label], x + 18, y + 66, 17, 850, POSTER_MUTED_LIGHT, 24));
  });

  return y + 122;
}

function renderParagraphCard(
  body: string[],
  y: number,
  kicker: string,
  title: string,
  text: string,
  color: string,
) {
  const textLines = wrapTextToWidth(text, 24, POSTER_CONTENT_WIDTH - CARD_INSET * 2, 5);
  const height = 112 + textLines.length * 34;

  body.push(renderRoundedRect(POSTER_PADDING, y, POSTER_CONTENT_WIDTH, height, 22, POSTER_CARD, "rgba(188,109,42,0.16)"));
  body.push(renderText([kicker], POSTER_PADDING + CARD_INSET, y + 38, 18, 950, color, 24));
  body.push(renderText([title], POSTER_PADDING + CARD_INSET, y + 75, 30, 950, POSTER_INK, 38));
  body.push(renderText(textLines, POSTER_PADDING + CARD_INSET, y + 118, 24, 720, POSTER_MUTED, 34));

  return y + height + 24;
}

function renderHighlightSection(body: string[], y: number, highlights: WeDailyHighlight[]) {
  y = renderSectionHeader(body, y, "TODAY HIGHLIGHTS", `今日要点 · ${highlights.length} 个话题`, POSTER_ORANGE);

  const columnGap = 14;
  const cardGap = 14;
  const cardWidth = (POSTER_CONTENT_WIDTH - columnGap) / 2;
  const layouts = highlights.map((highlight) => getHighlightCardLayout(highlight, cardWidth));
  const columns = [
    { x: POSTER_PADDING, y },
    { x: POSTER_PADDING + cardWidth + columnGap, y },
  ];

  layouts.forEach((layout) => {
    const column = columns[0].y <= columns[1].y ? columns[0] : columns[1];
    renderHighlightCard(body, layout, column.x, column.y, cardWidth, layout.height);
    column.y += layout.height + cardGap;
  });

  return Math.max(columns[0].y, columns[1].y) + 18;
}

function getHighlightCardLayout(highlight: WeDailyHighlight, cardWidth: number) {
  const textWidth = cardWidth - CARD_INSET * 2;
  const titleLines = wrapTextToWidth(highlight.title, 22, textWidth - 52, 2);
  const summaryLines = highlight.summary ? wrapTextToWidth(highlight.summary, 18, textWidth, 3) : [];
  const people = highlight.participants.length > 0 ? `参与：${highlight.participants.slice(0, 4).join("、")}` : "";
  const peopleLines = people ? wrapTextToWidth(people, 15, textWidth, 1) : [];
  const metaLines = highlight.timeRange ? [highlight.timeRange] : [];
  const height =
    28 +
    titleLines.length * 30 +
    metaLines.length * 21 +
    (summaryLines.length > 0 ? 10 + summaryLines.length * 25 : 0) +
    (peopleLines.length > 0 ? 10 + peopleLines.length * 21 : 0) +
    22;

  return {
    height,
    highlight,
    metaLines,
    peopleLines,
    summaryLines,
    titleLines,
  };
}

function renderHighlightCard(
  body: string[],
  layout: ReturnType<typeof getHighlightCardLayout>,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  body.push(renderRoundedRect(x, y, width, height, 18, POSTER_CARD, "rgba(188,109,42,0.14)"));
  body.push(renderNumberBadge(x + CARD_INSET, y + 30, String(layout.highlight.index).padStart(2, "0"), POSTER_ORANGE));
  body.push(renderText(layout.titleLines, x + CARD_INSET + 52, y + 32, 22, 950, POSTER_INK, 30));

  let textY = y + 32 + layout.titleLines.length * 30;

  if (layout.metaLines.length > 0) {
    body.push(renderText(layout.metaLines, x + CARD_INSET + 52, textY, 15, 850, POSTER_ORANGE_DARK, 21));
    textY += 21;
  }

  if (layout.summaryLines.length > 0) {
    textY += 10;
    body.push(renderText(layout.summaryLines, x + CARD_INSET, textY, 18, 700, POSTER_MUTED, 25));
    textY += layout.summaryLines.length * 25;
  }

  if (layout.peopleLines.length > 0) {
    textY += 10;
    body.push(renderText(layout.peopleLines, x + CARD_INSET, textY, 15, 850, POSTER_ACCENT, 21));
  }
}

function renderDiscussionSection(body: string[], y: number, discussions: WeDailyDiscussion[]) {
  y = renderSectionHeader(body, y, "KEY DISCUSSIONS", "重点讨论", POSTER_ACCENT);

  discussions.forEach((discussion) => {
    const title = discussion.timeRange ? `${discussion.title}（${discussion.timeRange}）` : discussion.title;
    const titleLines = wrapTextToWidth(title, 25, POSTER_CONTENT_WIDTH - CARD_INSET * 2, 3);
    const conclusionLines = wrapTextToWidth(discussion.conclusion, 21, POSTER_CONTENT_WIDTH - CARD_INSET * 2, 4);
    const people = discussion.people.length > 0 ? `相关人物：${discussion.people.slice(0, 6).join("、")}` : "";
    const peopleLines = people ? wrapTextToWidth(people, 18, POSTER_CONTENT_WIDTH - CARD_INSET * 2, 2) : [];
    const quoteLines = discussion.quote
      ? wrapTextToWidth(`代表性原话：${discussion.quote}`, 18, POSTER_CONTENT_WIDTH - CARD_INSET * 2, 3)
      : [];
    const height =
      34 +
      titleLines.length * 34 +
      14 +
      conclusionLines.length * 30 +
      (peopleLines.length > 0 ? 12 + peopleLines.length * 24 : 0) +
      (quoteLines.length > 0 ? 14 + quoteLines.length * 26 : 0) +
      24;

    body.push(renderRoundedRect(POSTER_PADDING, y, POSTER_CONTENT_WIDTH, height, 18, POSTER_CARD, "rgba(15,122,106,0.14)"));
    body.push(renderText([`TOPIC ${String(discussion.index).padStart(2, "0")}`], POSTER_PADDING + CARD_INSET, y + 33, 17, 950, POSTER_ACCENT, 24));
    body.push(renderText(titleLines, POSTER_PADDING + CARD_INSET, y + 66, 25, 950, POSTER_INK, 34));

    let textY = y + 66 + titleLines.length * 34 + 14;
    body.push(renderText(conclusionLines, POSTER_PADDING + CARD_INSET, textY, 21, 700, POSTER_MUTED, 30));
    textY += conclusionLines.length * 30;

    if (peopleLines.length > 0) {
      textY += 12;
      body.push(renderText(peopleLines, POSTER_PADDING + CARD_INSET, textY, 18, 850, POSTER_ACCENT, 24));
      textY += peopleLines.length * 24;
    }

    if (quoteLines.length > 0) {
      textY += 14;
      body.push(renderText(quoteLines, POSTER_PADDING + CARD_INSET, textY, 18, 750, POSTER_ORANGE_DARK, 26));
    }

    y += height + 12;
  });

  return y + 12;
}

function renderResourceSection(body: string[], y: number, resources: WeDailyResource[]) {
  y = renderSectionHeader(body, y, "RESOURCES & ACTIONS", "干货 / 行动 / 机会", POSTER_ORANGE);

  resources.forEach((resource) => {
    const titleLines = wrapTextToWidth(resource.title, 23, POSTER_CONTENT_WIDTH - CARD_INSET * 2 - 54, 2);
    const bodyLines = wrapTextToWidth(resource.body, 20, POSTER_CONTENT_WIDTH - CARD_INSET * 2 - 54, 4);
    const height = 34 + titleLines.length * 32 + 12 + bodyLines.length * 29 + 24;

    body.push(renderRoundedRect(POSTER_PADDING, y, POSTER_CONTENT_WIDTH, height, 18, POSTER_CARD, "rgba(188,109,42,0.14)"));
    body.push(renderNumberBadge(POSTER_PADDING + CARD_INSET, y + 32, String(resource.index).padStart(2, "0"), POSTER_ORANGE));
    body.push(renderText(titleLines, POSTER_PADDING + CARD_INSET + 54, y + 34, 23, 950, POSTER_INK, 32));
    body.push(
      renderText(
        bodyLines,
        POSTER_PADDING + CARD_INSET + 54,
        y + 34 + titleLines.length * 32 + 12,
        20,
        700,
        POSTER_MUTED,
        29,
      ),
    );

    y += height + 12;
  });

  return y + 12;
}

function renderTagsSection(body: string[], y: number, tags: string[]) {
  y = renderSectionHeader(body, y, "DAILY NOTES", "标签", POSTER_ACCENT);

  const rows = layoutTags(tags.map((tag) => `#${tag}`), 18, POSTER_CONTENT_WIDTH - CARD_INSET * 2);
  const height = 34 + rows.length * 38 + 24;

  body.push(renderRoundedRect(POSTER_PADDING, y, POSTER_CONTENT_WIDTH, height, 18, POSTER_CARD, "rgba(15,122,106,0.14)"));
  rows.forEach((row, rowIndex) => {
    let x = POSTER_PADDING + CARD_INSET;
    const rowY = y + 38 + rowIndex * 38;

    row.forEach((tag) => {
      const width = measureTextWidth(tag, 18) + 28;
      body.push(renderRoundedRect(x, rowY - 22, width, 28, 14, "rgba(15,122,106,0.08)", "rgba(15,122,106,0.14)"));
      body.push(renderText([tag], x + 14, rowY, 18, 850, POSTER_ACCENT, 22));
      x += width + 8;
    });
  });

  return y + height + 24;
}

function renderSectionHeader(body: string[], y: number, kicker: string, title: string, color: string) {
  body.push(renderText([kicker], POSTER_PADDING, y + 24, 18, 950, color, 24));
  body.push(renderText([title], POSTER_PADDING, y + 65, 33, 950, POSTER_INK, 40));

  return y + 92;
}

function renderFooter(body: string[], y: number) {
  const height = 106;

  body.push(renderRoundedRect(POSTER_PADDING, y, POSTER_CONTENT_WIDTH, height, 22, POSTER_SOFT, "rgba(188,109,42,0.16)"));
  body.push(renderText(["changzhouai.club/news?view=local"], POSTER_PADDING + CARD_INSET, y + 42, 24, 950, POSTER_ORANGE_DARK, 32));
  body.push(renderText(["来源：WeDaily 群聊日报接口；导出内容为当前日报正文。"], POSTER_PADDING + CARD_INSET, y + 76, 18, 760, POSTER_MUTED, 26));

  return y + height;
}

function renderBadge(x: number, y: number, width: number, height: number, text: string) {
  return [
    renderRoundedRect(x, y, width, height, 22, "rgba(255,255,255,0.76)", "rgba(15,122,106,0.18)"),
    renderText([text], x + width / 2, y + 29, 18, 950, POSTER_ACCENT, 22, { textAnchor: "middle" }),
  ].join("");
}

function renderNumberBadge(x: number, y: number, text: string, color: string) {
  return [
    `<circle cx="${round(x + 20)}" cy="${round(y - 9)}" r="20" fill="rgba(255,255,255,0.86)" stroke="${color}" stroke-opacity="0.22"/>`,
    renderText([text], x + 20, y - 2, 17, 950, color, 22, { textAnchor: "middle" }),
  ].join("");
}

function renderRoundedRect(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke: string,
) {
  return `<rect x="${round(x)}" y="${round(y)}" width="${round(width)}" height="${round(height)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`;
}

function renderText(
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  fontWeight: number,
  fill: string,
  lineHeight: number,
  options: { textAnchor?: "start" | "middle" | "end" } = {},
) {
  const normalizedLines = lines.map(cleanText).filter(Boolean);

  if (normalizedLines.length === 0) {
    return "";
  }

  const anchor = options.textAnchor ? ` text-anchor="${options.textAnchor}"` : "";
  const tspans = normalizedLines
    .map((line, index) => {
      const position = index === 0 ? `x="${round(x)}" y="${round(y)}"` : `x="${round(x)}" dy="${lineHeight}"`;
      return `<tspan ${position}>${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<text${anchor} style="font-family: ${POSTER_FONT}; font-size: ${fontSize}px; font-weight: ${fontWeight}; fill: ${fill};">${tspans}</text>`;
}

function wrapTextToWidth(value: string, fontSize: number, maxWidth: number, maxLines = Number.POSITIVE_INFINITY) {
  const source = cleanText(value);

  if (!source) {
    return [];
  }

  const lines: string[] = [];
  let line = "";
  const tokens = tokenizeText(source);

  for (const token of tokens) {
    const candidate = line + token;

    if (line && measureTextWidth(candidate, fontSize) > maxWidth) {
      lines.push(line.trimEnd());
      line = token.trimStart();

      if (lines.length >= maxLines) {
        return addEllipsis(lines, fontSize, maxWidth);
      }

      while (line && measureTextWidth(line, fontSize) > maxWidth) {
        const split = splitTokenToWidth(line, fontSize, maxWidth);
        lines.push(split.head.trimEnd());
        line = split.tail.trimStart();

        if (lines.length >= maxLines) {
          return addEllipsis(lines, fontSize, maxWidth);
        }
      }
    } else {
      line = candidate;
    }
  }

  if (line.trim()) {
    lines.push(line.trim());
  }

  return lines.length > maxLines ? addEllipsis(lines.slice(0, maxLines), fontSize, maxWidth) : lines;
}

function tokenizeText(value: string) {
  const tokens: string[] = [];
  let latinToken = "";

  for (const char of Array.from(value)) {
    if (isLatinTokenChar(char)) {
      latinToken += char;
      continue;
    }

    if (latinToken) {
      tokens.push(latinToken);
      latinToken = "";
    }

    tokens.push(char);
  }

  if (latinToken) {
    tokens.push(latinToken);
  }

  return tokens;
}

function splitTokenToWidth(value: string, fontSize: number, maxWidth: number) {
  let head = "";
  let tail = "";
  const chars = Array.from(value);

  for (let index = 0; index < chars.length; index += 1) {
    const candidate = head + chars[index];

    if (head && measureTextWidth(candidate, fontSize) > maxWidth) {
      tail = chars.slice(index).join("");
      break;
    }

    head = candidate;
  }

  return {
    head: head || chars[0] || "",
    tail,
  };
}

function addEllipsis(lines: string[], fontSize: number, maxWidth: number) {
  const next = [...lines];
  const last = next.length - 1;

  if (last >= 0) {
    next[last] = truncateLine(`${next[last].replace(/[，。,.、\s]+$/u, "")}…`, fontSize, maxWidth);
  }

  return next;
}

function truncateLine(value: string, fontSize: number, maxWidth: number) {
  let next = value;

  while (next.length > 1 && measureTextWidth(next, fontSize) > maxWidth) {
    next = `${Array.from(next).slice(0, -2).join("").trimEnd()}…`;
  }

  return next;
}

function layoutTags(tags: string[], fontSize: number, maxWidth: number) {
  const rows: string[][] = [];
  let row: string[] = [];
  let rowWidth = 0;

  tags.forEach((tag) => {
    const width = measureTextWidth(tag, fontSize) + 36;

    if (row.length > 0 && rowWidth + width > maxWidth) {
      rows.push(row);
      row = [];
      rowWidth = 0;
    }

    row.push(tag);
    rowWidth += width;
  });

  if (row.length > 0) {
    rows.push(row);
  }

  return rows;
}

function measureTextWidth(value: string, fontSize: number) {
  return Array.from(value).reduce((total, char) => total + getCharWidth(char, fontSize), 0);
}

function getCharWidth(char: string, fontSize: number) {
  if (/[A-Z]/.test(char)) {
    return fontSize * 0.68;
  }

  if (/[a-z0-9]/.test(char)) {
    return fontSize * 0.58;
  }

  if (/\s/.test(char)) {
    return fontSize * 0.34;
  }

  if (/[-_/.:@+()[\],]/.test(char)) {
    return fontSize * 0.38;
  }

  if (/[，。；：！？、（）《》“”‘’]/u.test(char)) {
    return fontSize * 0.56;
  }

  return fontSize;
}

function isLatinTokenChar(char: string) {
  return /[A-Za-z0-9_:/@.#%&?=+\-[\]()]/.test(char);
}

function formatCount(value?: number) {
  return typeof value === "number" ? value.toLocaleString("zh-CN") : "0";
}

function cleanText(value: string) {
  return String(value ?? "")
    .replace(/[\u{1f300}-\u{1faff}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function round(value: number) {
  return Number.parseFloat(value.toFixed(2));
}

async function downloadPosterPng({ height, svg, width }: PosterSvg, filename: string) {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const pixelRatio = getExportPixelRatio(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * pixelRatio);
    canvas.height = Math.ceil(height * pixelRatio);

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not available.");
    }

    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = POSTER_BACKGROUND;
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const pngBlob = await canvasToBlob(canvas);
    const pngUrl = URL.createObjectURL(pngBlob);

    try {
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
    }
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function getExportPixelRatio(width: number, height: number) {
  return Math.max(1, Math.min(EXPORT_PIXEL_RATIO, MAX_CANVAS_EDGE / Math.max(width, height)));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load generated SVG."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Failed to create PNG blob."));
    }, "image/png");
  });
}
