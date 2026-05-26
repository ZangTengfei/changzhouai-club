"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";

import type { AiHotDailyItem, AiHotDailyReport } from "@/lib/aihot";
import { createQrMatrix } from "@/lib/qr-svg";

import styles from "./ai-news-page.module.css";

const POSTER_WIDTH = 1080;
const POSTER_PADDING = 64;
const POSTER_CONTENT_WIDTH = POSTER_WIDTH - POSTER_PADDING * 2;
const CARD_INSET = 34;
const ITEM_NUMBER_SIZE = 44;
const ITEM_NUMBER_GAP = 26;
const ITEM_TEXT_X = POSTER_PADDING + CARD_INSET + ITEM_NUMBER_SIZE + ITEM_NUMBER_GAP;
const ITEM_TEXT_WIDTH = POSTER_WIDTH - POSTER_PADDING - CARD_INSET - ITEM_TEXT_X;
const POSTER_BACKGROUND = "#fffaf1";
const POSTER_INK = "#111b1f";
const POSTER_MUTED = "#66736f";
const POSTER_ACCENT = "#107565";
const POSTER_ACCENT_STRONG = "#0b5e52";
const POSTER_LINE = "#d8ddd4";
const POSTER_LINE_SOFT = "#edf0ea";
const POSTER_SOFT = "#f4f8f3";
const POSTER_CORAL = "#c55b4f";
const POSTER_GOLD = "#b98220";
const POSTER_BLUE = "#2f72b8";
const TITLE_FONT_SIZE = 27;
const TITLE_LINE_HEIGHT = 36;
const SOURCE_FONT_SIZE = 19;
const SOURCE_LINE_HEIGHT = 27;
const SUMMARY_FONT_SIZE = 20;
const SUMMARY_LINE_HEIGHT = 30;

type DailyReportExportButtonProps = {
  dailyItemCount: number;
  fullDate: string;
  pageUrl: string;
  report: AiHotDailyReport;
  sourceCount: number;
  volume: string;
};

type PosterSvg = {
  height: number;
  svg: string;
  width: number;
};

export function DailyReportExportButton({
  dailyItemCount,
  fullDate,
  pageUrl,
  report,
  sourceCount,
  volume,
}: DailyReportExportButtonProps) {
  const [state, setState] = useState<"idle" | "exporting" | "done" | "error">("idle");

  async function handleExport() {
    if (state === "exporting") {
      return;
    }

    setState("exporting");

    try {
      const poster = buildDailyReportPosterSvg({
        dailyItemCount,
        fullDate,
        pageUrl,
        report,
        sourceCount,
        volume,
      });

      await downloadPosterPng(poster, `changzhou-ai-daily-${report.date || "latest"}.png`);
      setState("done");
      window.setTimeout(() => setState("idle"), 2200);
    } catch (error) {
      console.error("Failed to export daily report poster", error);
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

function buildDailyReportPosterSvg({
  dailyItemCount,
  fullDate,
  pageUrl,
  report,
  sourceCount,
  volume,
}: DailyReportExportButtonProps): PosterSvg {
  const body: string[] = [];
  let y = POSTER_PADDING;

  body.push(
    `<path d="M0 0H${POSTER_WIDTH}V160H0Z" fill="#f1f8f4"/>`,
    `<path d="M0 126C228 168 372 74 568 112C738 145 843 229 1080 174V0H0Z" fill="#ffffff" opacity="0.58"/>`,
    `<path d="M0 330C176 300 310 344 478 314C710 272 838 214 1080 260V0H0Z" fill="#eaf4ef" opacity="0.66"/>`,
  );

  body.push(renderText(["常州 AI Club"], POSTER_PADDING, y + 14, 21, 900, POSTER_ACCENT_STRONG, 28));
  body.push(renderBadge(POSTER_WIDTH - POSTER_PADDING - 202, y - 18, 202, 44, "AI HOT DAILY", POSTER_ACCENT));
  y += 100;

  body.push(renderText(["AI 资讯日报"], POSTER_PADDING, y, 68, 950, POSTER_INK, 78));
  y += 82;

  body.push(renderText([`${fullDate} · VOL.${volume}`], POSTER_PADDING, y, 26, 850, POSTER_MUTED, 36));
  y += 56;

  const leadTitle = cleanText(report.lead?.title || "今日重点");
  const leadParagraph = cleanText(report.lead?.leadParagraph || `共整理 ${dailyItemCount} 条 AI 动态，按主题归档为今日日报。`);
  const leadTextWidth = POSTER_CONTENT_WIDTH - CARD_INSET * 2;
  const leadTitleLines = wrapTextToWidth(leadTitle, 36, leadTextWidth, 2);
  const leadLines = wrapTextToWidth(leadParagraph, 24, leadTextWidth, 3);
  const leadHeight = 104 + leadTitleLines.length * 42 + leadLines.length * 34;

  body.push(renderRoundedRect(POSTER_PADDING, y, POSTER_CONTENT_WIDTH, leadHeight, 26, "#ffffff", POSTER_LINE));
  body.push(renderText(["今日导读"], POSTER_PADDING + CARD_INSET, y + 42, 21, 950, POSTER_ACCENT, 28));
  body.push(renderText(leadTitleLines, POSTER_PADDING + CARD_INSET, y + 84, 36, 950, POSTER_INK, 42));
  body.push(renderText(leadLines, POSTER_PADDING + CARD_INSET, y + 88 + leadTitleLines.length * 42, 24, 700, POSTER_MUTED, 34));
  y += leadHeight + 28;

  body.push(renderStatsRow(y, dailyItemCount, report.flashes?.length ?? 0, sourceCount));
  y += 110;

  report.sections.forEach((section, sectionIndex) => {
    const sectionTop = y;
    const itemLayouts = section.items.map((item) => getItemLayout(item));
    const itemsHeight = itemLayouts.reduce((total, item) => total + item.height, 0);
    const sectionHeaderHeight = 96;
    const itemGap = 12;
    const sectionHeight = sectionHeaderHeight + itemsHeight + Math.max(section.items.length - 1, 0) * itemGap + 34;
    const sectionColor = getSectionColor(sectionIndex);

    body.push(renderRoundedRect(POSTER_PADDING, sectionTop, POSTER_CONTENT_WIDTH, sectionHeight, 24, "#ffffff", POSTER_LINE));
    body.push(renderText([String(sectionIndex + 1).padStart(2, "0")], POSTER_PADDING + CARD_INSET, sectionTop + 58, 36, 950, sectionColor, 42));
    body.push(renderText(wrapTextToWidth(section.label, 34, 520, 1), POSTER_PADDING + CARD_INSET + 62, sectionTop + 56, 34, 950, POSTER_INK, 42));
    body.push(renderText([`${section.items.length} 篇`], POSTER_WIDTH - POSTER_PADDING - CARD_INSET, sectionTop + 56, 22, 950, sectionColor, 30, { textAnchor: "end" }));

    let itemY = sectionTop + sectionHeaderHeight;

    itemLayouts.forEach((layout, itemIndex) => {
      body.push(renderDailyItem(layout, itemIndex, itemY, sectionColor));
      itemY += layout.height;

      if (itemIndex < itemLayouts.length - 1) {
        body.push(`<line x1="${ITEM_TEXT_X}" y1="${itemY + itemGap / 2}" x2="${POSTER_WIDTH - POSTER_PADDING - CARD_INSET}" y2="${itemY + itemGap / 2}" stroke="${POSTER_LINE_SOFT}" stroke-width="1.5"/>`);
        itemY += itemGap;
      }
    });

    y += sectionHeight + 22;
  });

  const footerTop = y + 8;
  const footerHeight = 246;
  const qrSize = 205;
  const qrX = POSTER_WIDTH - POSTER_PADDING - qrSize - CARD_INSET;
  const qrY = footerTop + 20;
  const footerTextX = POSTER_PADDING + CARD_INSET;
  const footerTextWidth = qrX - footerTextX - 46;

  body.push(renderRoundedRect(POSTER_PADDING, footerTop, POSTER_CONTENT_WIDTH, footerHeight, 28, POSTER_SOFT, POSTER_LINE));
  body.push(renderQr(pageUrl, qrX, qrY, 5));
  body.push(renderText(["扫码查看完整日报"], footerTextX, footerTop + 60, 34, 950, POSTER_INK, 42));
  body.push(renderText(["changzhouai.club/news?view=daily"], footerTextX, footerTop + 102, 24, 900, POSTER_ACCENT_STRONG, 34));
  body.push(renderText(wrapTextToWidth("来源：AI HOT 公开 API；页面内容会随上游更新，发布前请回原文核对。", 22, footerTextWidth, 2), footerTextX, footerTop + 150, 22, 700, POSTER_MUTED, 32));

  y = footerTop + footerHeight + POSTER_PADDING;

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${POSTER_WIDTH}" height="${y}" viewBox="0 0 ${POSTER_WIDTH} ${y}">`,
    `<rect width="${POSTER_WIDTH}" height="${y}" fill="${POSTER_BACKGROUND}"/>`,
    ...body,
    "</svg>",
  ].join("");

  return {
    height: y,
    svg,
    width: POSTER_WIDTH,
  };
}

function getItemLayout(item: AiHotDailyItem) {
  const titleLines = wrapTextToWidth(item.title, TITLE_FONT_SIZE, ITEM_TEXT_WIDTH, 2);
  const sourceLines = wrapTextToWidth(item.sourceName || "AI HOT", SOURCE_FONT_SIZE, ITEM_TEXT_WIDTH, 1);
  const summaryLines = item.summary ? wrapTextToWidth(item.summary, SUMMARY_FONT_SIZE, ITEM_TEXT_WIDTH, 2) : [];
  const height =
    22 +
    titleLines.length * TITLE_LINE_HEIGHT +
    8 +
    sourceLines.length * SOURCE_LINE_HEIGHT +
    (summaryLines.length > 0 ? 8 + summaryLines.length * SUMMARY_LINE_HEIGHT : 0) +
    22;

  return {
    height,
    item,
    sourceLines,
    summaryLines,
    titleLines,
  };
}

type DailyItemLayout = ReturnType<typeof getItemLayout>;

function renderDailyItem(
  layout: DailyItemLayout,
  itemIndex: number,
  y: number,
  color: string,
) {
  const itemNumber = String(itemIndex + 1).padStart(2, "0");
  const markerX = POSTER_PADDING + CARD_INSET + ITEM_NUMBER_SIZE / 2;
  const markerY = y + 42;
  const parts = [
    `<circle cx="${markerX}" cy="${markerY}" r="${ITEM_NUMBER_SIZE / 2}" fill="${color}" opacity="0.12"/>`,
    renderText([itemNumber], markerX, markerY + 7, 19, 950, color, 24, { textAnchor: "middle" }),
    renderText(layout.titleLines, ITEM_TEXT_X, y + 32, TITLE_FONT_SIZE, 900, POSTER_INK, TITLE_LINE_HEIGHT),
  ];

  let nextY = y + 42 + layout.titleLines.length * TITLE_LINE_HEIGHT;

  parts.push(renderText(layout.sourceLines, ITEM_TEXT_X, nextY, SOURCE_FONT_SIZE, 850, color, SOURCE_LINE_HEIGHT));
  nextY += layout.sourceLines.length * SOURCE_LINE_HEIGHT + 8;

  if (layout.summaryLines.length > 0) {
    parts.push(renderText(layout.summaryLines, ITEM_TEXT_X, nextY, SUMMARY_FONT_SIZE, 650, POSTER_MUTED, SUMMARY_LINE_HEIGHT));
  }

  return parts.join("");
}

function renderStatsRow(y: number, dailyItemCount: number, flashCount: number, sourceCount: number) {
  const gap = 16;
  const width = (POSTER_CONTENT_WIDTH - gap * 2) / 3;
  const stats = [
    { label: "今日事件", value: dailyItemCount, color: POSTER_ACCENT },
    { label: "一手报道", value: flashCount, color: POSTER_CORAL },
    { label: "信源", value: sourceCount, color: POSTER_BLUE },
  ];

  return stats
    .map((item, index) => {
      const x = POSTER_PADDING + index * (width + gap);

      return [
        renderRoundedRect(x, y, width, 84, 20, "#ffffff", POSTER_LINE),
        renderText([String(item.value)], x + 24, y + 48, 34, 950, item.color, 40),
        renderText([item.label], x + 84, y + 46, 23, 850, POSTER_MUTED, 30),
      ].join("");
    })
    .join("");
}

function renderQr(text: string, x: number, y: number, moduleSize: number) {
  const matrix = createQrMatrix(text);
  const quietZone = 4;
  const totalSize = (matrix.length + quietZone * 2) * moduleSize;
  const rects = [
    `<rect x="${x}" y="${y}" width="${totalSize}" height="${totalSize}" rx="24" fill="#ffffff"/>`,
  ];

  matrix.forEach((row, rowIndex) => {
    row.forEach((isBlack, colIndex) => {
      if (!isBlack) {
        return;
      }

      rects.push(
        `<rect x="${x + (colIndex + quietZone) * moduleSize}" y="${y + (rowIndex + quietZone) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${POSTER_INK}"/>`,
      );
    });
  });

  return rects.join("");
}

function renderBadge(x: number, y: number, width: number, height: number, label: string, color: string) {
  return [
    renderRoundedRect(x, y, width, height, 22, color, color),
    renderText([label], x + 24, y + 29, 17, 950, "#ffffff", 22),
  ].join("");
}

function renderRoundedRect(x: number, y: number, width: number, height: number, radius: number, fill: string, stroke: string) {
  return `<rect x="${round(x)}" y="${round(y)}" width="${round(width)}" height="${round(height)}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

function renderText(
  lines: string[],
  x: number,
  y: number,
  size: number,
  weight: number,
  fill: string,
  lineHeight: number,
  options: {
    textAnchor?: "start" | "middle" | "end";
  } = {},
) {
  const normalizedLines = lines.map(cleanText).filter(Boolean);

  if (normalizedLines.length === 0) {
    return "";
  }

  const tspans = normalizedLines
    .map((line, index) => {
      const position = index === 0 ? `x="${round(x)}" y="${round(y)}"` : `x="${round(x)}" dy="${lineHeight}"`;
      return `<tspan ${position}>${escapeXml(line)}</tspan>`;
    })
    .join("");

  const anchor = options.textAnchor ? ` text-anchor="${options.textAnchor}"` : "";

  return `<text${anchor} style="font-family: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', Arial, sans-serif; font-size: ${size}px; font-weight: ${weight}; fill: ${fill};">${tspans}</text>`;
}

function getSectionColor(index: number) {
  return [POSTER_ACCENT, POSTER_CORAL, POSTER_BLUE, POSTER_GOLD, POSTER_ACCENT_STRONG][index % 5];
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
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is not available.");
    }

    context.fillStyle = POSTER_BACKGROUND;
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to create PNG blob."));
      }, "image/png");
    });

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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load generated SVG."));
    image.src = src;
  });
}
