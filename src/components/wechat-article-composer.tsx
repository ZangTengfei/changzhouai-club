"use client";

import { Clipboard, ClipboardCheck, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AdminNotice } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type TemplateId = "community" | "official" | "opportunity";

type WechatTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  accentWarm: string;
  text: string;
  muted: string;
  background: string;
  label: string;
  footer: string;
};

type MarkdownBlock =
  | { type: "heading"; depth: 1 | 2 | 3; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "image"; alt: string; src: string }
  | { type: "hr" };

const templates: WechatTemplate[] = [
  {
    id: "community",
    name: "社区复盘版",
    description: "适合活动回顾、社区公众号、轻松但不松散的口吻。",
    accent: "#15935f",
    accentSoft: "#e8f7ef",
    accentWarm: "#ffc83d",
    text: "#24352d",
    muted: "#6b7a70",
    background: "#fffdf8",
    label: "Changzhou AI Club",
    footer: "常州 AI Club｜连接、分享、共创",
  },
  {
    id: "official",
    name: "官方通稿版",
    description: "适合园区、合作方公众号发布，表达更稳、更正式。",
    accent: "#147f6c",
    accentSoft: "#eef7f5",
    accentWarm: "#2f80ed",
    text: "#1f2f2b",
    muted: "#63746f",
    background: "#ffffff",
    label: "常州 AI Club",
    footer: "共同推动 AI 创客交流与场景落地",
  },
  {
    id: "opportunity",
    name: "项目招募版",
    description: "适合揭榜、项目报名、合作机会发布。",
    accent: "#1662c4",
    accentSoft: "#edf5ff",
    accentWarm: "#18a36b",
    text: "#1d2d44",
    muted: "#607086",
    background: "#fbfdff",
    label: "项目合作机会",
    footer: "欢迎带着真实问题、真实能力和真实项目一起共创",
  },
];

const sampleMarkdown = `# 从 Codex 到真实项目：一次常州 AI Club 的实战交流

6 月 27 日下午，常州 AI Club 联合常州电信举办了一场面向开发者、学生、企业主和产业伙伴的 AI 实战沙龙。大家围绕 Codex、PPT、视频、数字员工、真实项目揭榜等话题，聊工具，也聊落地。

## 这次我们重点聊了什么

- Codex 小白入门：从 AI 基础知识到安装、使用和常见场景
- Codex + PPT / 视频：把想法更快整理成可展示内容
- AI 原生运营工作流：社区日常内容、活动、协作如何提效
- 真实项目揭榜：由常州电信提供项目商机，现场拆解和讨论

## 现场最有价值的部分

> 大家不只是听分享，而是把真实项目拿出来讨论：需求怎么拆、风险在哪里、谁可以参与、下一步怎么报名。

## 后续我们会继续做

1. 整理项目报名与对接结果
2. 邀请更多成员分享自己的 AI 实战经验
3. 把活动、项目、内容发布流程逐步沉淀成社区工作流

![活动现场照片](https://changzhouai.club/og-image.png)

如果你也在常州，正在做 AI 相关产品、项目或工具探索，欢迎加入常州 AI Club。`;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function isPublicUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function renderInline(text: string, template: WechatTemplate) {
  const tokenPattern = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let cursor = 0;
  let html = "";

  for (const match of text.matchAll(tokenPattern)) {
    html += escapeHtml(text.slice(cursor, match.index));

    if (match[2]) {
      html += `<strong style="color:${template.accent};font-weight:700;">${escapeHtml(
        match[2],
      )}</strong>`;
    } else if (match[3]) {
      html += `<code style="font-family:Menlo,Consolas,monospace;font-size:14px;color:${template.accent};background:${template.accentSoft};border-radius:4px;padding:2px 5px;">${escapeHtml(
        match[3],
      )}</code>`;
    } else if (match[4] && match[5]) {
      const href = match[5].trim();
      if (isPublicUrl(href)) {
        html += `<a href="${escapeAttribute(href)}" style="color:${template.accent};text-decoration:none;border-bottom:1px solid ${template.accent};">${escapeHtml(
          match[4],
        )}</a>`;
      } else {
        html += escapeHtml(match[4]);
      }
    }

    cursor = match.index + match[0].length;
  }

  html += escapeHtml(text.slice(cursor));
  return html;
}

function parseMarkdown(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", lines: paragraph });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
  };

  const flushQuote = () => {
    if (quote.length > 0) {
      blocks.push({ type: "quote", lines: quote });
      quote = [];
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushAll();
      blocks.push({
        type: "image",
        alt: imageMatch[1].trim(),
        src: imageMatch[2].trim(),
      });
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushAll();
      blocks.push({
        type: "heading",
        depth: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      flushAll();
      blocks.push({ type: "hr" });
      continue;
    }

    const quoteMatch = line.match(/^>\s?(.+)$/);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1].trim());
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      flushQuote();
      const ordered = Boolean(orderedMatch);
      const value = (unorderedMatch?.[1] ?? orderedMatch?.[1] ?? "").trim();
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(value);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line);
  }

  flushAll();
  return blocks;
}

function toPlainText(markdown: string) {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

function renderArticleHtml(markdown: string, template: WechatTemplate) {
  const blocks = parseMarkdown(markdown);
  const firstHeading = blocks.find(
    (block): block is Extract<MarkdownBlock, { type: "heading" }> =>
      block.type === "heading" && block.depth === 1,
  );
  const title = firstHeading?.text ?? "公众号推文标题";
  const bodyBlocks = firstHeading
    ? blocks.filter((block) => block !== firstHeading)
    : blocks;

  const bodyHtml = bodyBlocks
    .map((block, index) => {
      if (block.type === "heading") {
        if (block.depth === 2) {
          return `<section style="margin:30px 0 14px;padding:0 0 0 12px;border-left:4px solid ${template.accent};"><h2 style="margin:0;color:${template.text};font-size:20px;line-height:1.45;font-weight:800;">${renderInline(
            block.text,
            template,
          )}</h2></section>`;
        }

        return `<h3 style="margin:24px 0 10px;color:${template.accent};font-size:17px;line-height:1.5;font-weight:800;">${renderInline(
          block.text,
          template,
        )}</h3>`;
      }

      if (block.type === "paragraph") {
        return `<p style="margin:0 0 16px;color:${template.text};font-size:16px;line-height:1.9;letter-spacing:0;">${block.lines
          .map((line) => renderInline(line, template))
          .join("<br/>")}</p>`;
      }

      if (block.type === "quote") {
        return `<section style="margin:18px 0;padding:14px 16px;border-left:4px solid ${template.accentWarm};border-radius:8px;background:${template.accentSoft};"><p style="margin:0;color:${template.text};font-size:15px;line-height:1.8;">${block.lines
          .map((line) => renderInline(line, template))
          .join("<br/>")}</p></section>`;
      }

      if (block.type === "list") {
        const items = block.items
          .map((item, itemIndex) => {
            const marker = block.ordered ? `${itemIndex + 1}` : "";
            const markerHtml = block.ordered
              ? `<span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:999px;background:${template.accent};color:#ffffff;font-size:12px;font-weight:700;">${marker}</span>`
              : `<span style="display:inline-block;width:8px;height:8px;margin-top:9px;border-radius:999px;background:${template.accent};"></span>`;

            return `<li style="display:flex;gap:10px;margin:0 0 10px;align-items:flex-start;color:${template.text};font-size:16px;line-height:1.75;">${markerHtml}<span style="flex:1;">${renderInline(
              item,
              template,
            )}</span></li>`;
          })
          .join("");

        return `<ul style="list-style:none;margin:0 0 18px;padding:0;">${items}</ul>`;
      }

      if (block.type === "image") {
        if (!isPublicUrl(block.src)) {
          return `<section style="margin:20px 0;padding:16px;border:1px dashed ${template.accent};border-radius:10px;background:${template.accentSoft};color:${template.muted};font-size:14px;line-height:1.7;">图片待替换：${escapeHtml(
            block.alt || `第 ${index + 1} 张图片`,
          )}<br/>${escapeHtml(block.src)}</section>`;
        }

        const caption = block.alt
          ? `<p style="margin:8px 0 0;color:${template.muted};font-size:13px;line-height:1.6;text-align:center;">${escapeHtml(
              block.alt,
            )}</p>`
          : "";

        return `<section style="margin:22px 0;"><img src="${escapeAttribute(
          block.src,
        )}" alt="${escapeAttribute(
          block.alt,
        )}" style="display:block;width:100%;height:auto;border-radius:10px;"/>${caption}</section>`;
      }

      return `<section style="height:1px;margin:26px 0;background:#e6e0d7;"></section>`;
    })
    .join("");

  return `<section style="max-width:677px;margin:0 auto;padding:0;background:${template.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',Arial,sans-serif;">
  <section style="padding:26px 20px 8px;">
    <section style="display:inline-block;margin:0 0 14px;padding:5px 10px;border-radius:999px;background:${template.accentSoft};color:${template.accent};font-size:12px;font-weight:700;letter-spacing:0.08em;">${escapeHtml(
      template.label,
    )}</section>
    <h1 style="margin:0;color:${template.text};font-size:28px;line-height:1.28;font-weight:900;letter-spacing:0;">${renderInline(
      title,
      template,
    )}</h1>
    <section style="width:42px;height:4px;margin:18px 0 0;border-radius:999px;background:${template.accentWarm};"></section>
  </section>
  <section style="padding:8px 20px 18px;">
    ${bodyHtml}
  </section>
  <section style="margin:6px 20px 0;padding:16px 0 26px;border-top:1px solid #ece4d8;color:${template.muted};font-size:13px;line-height:1.7;text-align:center;">${escapeHtml(
    template.footer,
  )}</section>
</section>`;
}

export function WechatArticleComposer() {
  const [templateId, setTemplateId] = useState<TemplateId>("community");
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "fallback" | "error">(
    "idle",
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  const html = useMemo(
    () => renderArticleHtml(markdown, template),
    [markdown, template],
  );
  const plainText = useMemo(() => toPlainText(markdown), [markdown]);

  async function copyRichText() {
    const content = previewRef.current?.innerHTML ?? html;

    try {
      if (
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard?.write
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([content], { type: "text/html" }),
            "text/plain": new Blob([plainText], { type: "text/plain" }),
          }),
        ]);
        setCopyState("copied");
      } else {
        await navigator.clipboard.writeText(plainText);
        setCopyState("fallback");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(plainText);
        setCopyState("fallback");
      } catch {
        setCopyState("error");
      }
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.96fr)_minmax(360px,0.84fr)]">
      <section className="grid gap-4">
        <div className="grid gap-3 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background/70 p-3 md:grid-cols-[220px_minmax(0,1fr)]">
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              模板
            </span>
            <NativeSelect
              value={templateId}
              onChange={(event) => {
                setTemplateId(event.target.value as TemplateId);
                setCopyState("idle");
              }}
            >
              {templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
          </label>
          <div className="flex min-w-0 items-end text-sm leading-6 text-muted-foreground">
            {template.description}
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Markdown 原稿
          </span>
          <Textarea
            value={markdown}
            onChange={(event) => {
              setMarkdown(event.target.value);
              setCopyState("idle");
            }}
            className="min-h-[520px] resize-y font-mono text-[13px] leading-6"
            spellCheck={false}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={copyRichText}>
            {copyState === "copied" ? (
              <ClipboardCheck className="size-4" />
            ) : (
              <Clipboard className="size-4" />
            )}
            {copyState === "copied"
              ? "已复制富文本"
              : copyState === "fallback"
                ? "已复制纯文本"
                : "复制到公众号"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setMarkdown(sampleMarkdown);
              setCopyState("idle");
            }}
          >
            <RotateCcw className="size-4" />
            恢复示例
          </Button>
          {copyState === "error" ? (
            <span className="text-sm text-destructive">浏览器没有开放剪贴板权限。</span>
          ) : null}
        </div>

        <AdminNotice>
          图片建议使用官网、公众号素材库或其他公开 HTTPS 地址；本地文件路径复制到公众号后通常无法显示。
        </AdminNotice>
      </section>

      <section className="min-w-0 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-[#f5f2eb] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            公众号预览
          </span>
          <span className="text-xs text-muted-foreground">宽度按公众号正文区域模拟</span>
        </div>
        <div className="max-h-[760px] overflow-auto rounded-[calc(var(--radius)-4px)] bg-white shadow-sm">
          <div
            ref={previewRef}
            className="mx-auto w-full max-w-[677px]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </section>
    </div>
  );
}
