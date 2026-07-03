export type WechatArticleTemplateId = "community" | "official" | "opportunity";

export type WechatArticleTemplate = {
  id: WechatArticleTemplateId;
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
  footerTitle: string;
  footerDescription: string;
  footerLinkLabel: string;
  footerLinkUrl: string;
  qrImageUrl: string;
  qrTitle: string;
  qrDescription: string;
};

export type WechatArticleFooterLink = {
  title: string;
  url: string;
  description?: string;
};

export type WechatArticleVideoChannel = {
  title: string;
  description: string;
  actionLabel: string;
  url?: string;
};

type MarkdownBlock =
  | { type: "heading"; depth: 1 | 2 | 3; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[]; start?: number }
  | { type: "image"; alt: string; src: string }
  | { type: "hr" };

type RenderWechatArticleOptions = {
  title?: string | null;
  relatedLinks?: WechatArticleFooterLink[];
  videoChannel?: WechatArticleVideoChannel | null;
};

const officialAccountQrUrl = "https://changzhouai.club/wechat-official-account-qr.jpg";

export const wechatArticleTemplates: WechatArticleTemplate[] = [
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
    footerTitle: "继续和常州 AI Club 一起共创",
    footerDescription: "关注公众号，获取活动回顾、项目机会和本地 AI 实践者故事。",
    footerLinkLabel: "changzhouai.club",
    footerLinkUrl: "https://changzhouai.club",
    qrImageUrl: officialAccountQrUrl,
    qrTitle: "扫码关注公众号",
    qrDescription: "不错过下一场线下活动",
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
    footerTitle: "常州 AI Club",
    footerDescription: "连接本地 AI 创客、产业场景与真实项目，持续推动交流与落地。",
    footerLinkLabel: "changzhouai.club",
    footerLinkUrl: "https://changzhouai.club",
    qrImageUrl: officialAccountQrUrl,
    qrTitle: "关注公众号",
    qrDescription: "了解后续活动与社区动态",
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
    footerTitle: "带着能力进入真实项目",
    footerDescription: "关注社区后续项目发布、揭榜报名和小范围需求澄清信息。",
    footerLinkLabel: "changzhouai.club",
    footerLinkUrl: "https://changzhouai.club",
    qrImageUrl: officialAccountQrUrl,
    qrTitle: "扫码关注公众号",
    qrDescription: "获取项目机会更新",
  },
];

export function getWechatArticleTemplate(id: WechatArticleTemplateId) {
  return wechatArticleTemplates.find((item) => item.id === id) ?? wechatArticleTemplates[0];
}

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

function normalizeFooterLinks(links: WechatArticleFooterLink[] | undefined) {
  return (links ?? [])
    .map((link) => ({
      title: link.title.trim(),
      url: link.url.trim(),
      description: link.description?.trim() ?? "",
    }))
    .filter((link) => link.title && isPublicUrl(link.url))
    .slice(0, 3);
}

function renderInline(text: string, template: WechatArticleTemplate) {
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

function renderRelatedLinks(
  template: WechatArticleTemplate,
  links: WechatArticleFooterLink[] | undefined,
) {
  const relatedLinks = normalizeFooterLinks(links);

  if (relatedLinks.length === 0) {
    return "";
  }

  const items = relatedLinks
    .map((link, index) => {
      const description = link.description
        ? `<span style="display:block;margin:3px 0 0;color:${template.muted};font-size:12px;line-height:1.5;">${escapeHtml(
            link.description,
          )}</span>`
        : "";

      return `<a href="${escapeAttribute(
        link.url,
      )}" style="display:block;margin:0;padding:11px 0;color:${template.text};text-decoration:none;border-top:${
        index === 0 ? "0" : "1px solid #efe7dc"
      };">
        <section style="display:table;width:100%;border-collapse:collapse;">
          <section style="display:table-cell;width:34px;vertical-align:top;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;border-radius:999px;background:${template.accentSoft};color:${template.accent};font-size:12px;font-weight:800;text-align:center;">${String(
              index + 1,
            ).padStart(2, "0")}</span>
          </section>
          <section style="display:table-cell;vertical-align:top;">
            <strong style="display:block;color:${template.text};font-size:14px;line-height:1.55;font-weight:800;">${escapeHtml(
              link.title,
            )}</strong>
            ${description}
          </section>
        </section>
      </a>`;
    })
    .join("");

  return `<section style="margin:0 0 14px;padding:14px 16px;border:1px solid #efe7dc;border-radius:12px;background:#ffffff;">
    <section style="margin:0 0 4px;color:${template.accent};font-size:13px;line-height:1.4;font-weight:800;">延伸阅读</section>
    ${items}
  </section>`;
}

function renderVideoChannel(
  template: WechatArticleTemplate,
  videoChannel: WechatArticleVideoChannel | null | undefined,
) {
  const title = videoChannel?.title.trim() ?? "";
  const description = videoChannel?.description.trim() ?? "";
  const actionLabel = videoChannel?.actionLabel.trim() ?? "";
  const url = videoChannel?.url?.trim() ?? "";

  if (!title && !description && !actionLabel) {
    return "";
  }

  const action = isPublicUrl(url)
    ? `<a href="${escapeAttribute(
        url,
      )}" style="display:inline-block;white-space:nowrap;color:${template.accent};font-size:12px;line-height:1.4;font-weight:800;text-decoration:none;border-bottom:1px solid ${template.accent};">${escapeHtml(
        actionLabel || "打开视频号",
      )}</a>`
    : `<span style="display:inline-block;white-space:nowrap;color:${template.accent};font-size:12px;line-height:1.4;font-weight:800;">${escapeHtml(
        actionLabel || "搜索：常州 AI Club",
      )}</span>`;

  return `<section style="margin:0 0 14px;padding:6px 0 2px;text-align:center;">
    <span style="display:inline-block;margin:0 0 8px;padding:3px 9px;border-radius:999px;background:${template.accentWarm};color:${template.text};font-size:11px;line-height:1.4;font-weight:800;">视频号</span>
    <strong style="display:block;margin:0;color:${template.text};font-size:15px;line-height:1.5;font-weight:800;">${escapeHtml(
      title || "看现场片段与活动花絮",
    )}</strong>
    <span style="display:block;margin:4px auto 0;max-width:420px;color:${template.muted};font-size:12px;line-height:1.6;">${escapeHtml(
      description || "短视频、直播回放和活动花絮会优先沉淀到视频号。",
    )}</span>
    <section style="margin:8px 0 0;">
      ${action}
    </section>
  </section>`;
}

function renderFooter(template: WechatArticleTemplate, options: RenderWechatArticleOptions) {
  const qrImage = template.qrImageUrl.trim()
    ? `<img src="${escapeAttribute(
        template.qrImageUrl,
      )}" alt="${escapeAttribute(
        template.qrTitle,
      )}" style="display:block;width:92px;height:92px;margin:0 auto;border-radius:8px;"/>`
    : `<section style="width:92px;height:92px;margin:0 auto;border:1px dashed ${template.accent};border-radius:8px;background:#ffffff;"></section>`;

  return `<section style="margin:6px 20px 0;padding:18px 0 28px;border-top:1px solid #ece4d8;">
    ${renderRelatedLinks(template, options.relatedLinks)}
    ${renderVideoChannel(template, options.videoChannel)}
    <section style="margin:0 0 14px;color:${template.muted};font-size:13px;line-height:1.7;text-align:center;">${escapeHtml(
      template.footer,
    )}</section>
    <section style="max-width:230px;margin:0 auto;padding:14px 14px 13px;border:1px solid ${template.accentSoft};border-radius:14px;background:${template.accentSoft};text-align:center;">
      <section style="display:inline-block;padding:9px;border-radius:12px;background:#ffffff;">
        ${qrImage}
      </section>
      <strong style="display:block;margin:7px 0 0;color:${template.text};font-size:12px;line-height:1.5;font-weight:800;">${escapeHtml(
        template.qrTitle,
      )}</strong>
      <span style="display:block;color:${template.muted};font-size:11px;line-height:1.45;">${escapeHtml(
        template.qrDescription,
      )}</span>
    </section>
    <section style="margin:12px 0 0;color:${template.muted};font-size:12px;line-height:1.7;text-align:center;">
      <span style="display:inline-block;">官网：</span><a href="${escapeAttribute(
        template.footerLinkUrl,
      )}" style="display:inline-block;white-space:nowrap;word-break:keep-all;color:${template.accent};font-size:12px;font-weight:800;text-decoration:none;border-bottom:1px solid ${template.accent};">${escapeHtml(
        template.footerLinkLabel,
      )}</a>
    </section>
  </section>`;
}

function parseMarkdown(markdown: string) {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[]; start?: number } | null = null;
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
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      flushParagraph();
      flushQuote();
      const ordered = Boolean(orderedMatch);
      const value = (unorderedMatch?.[1] ?? orderedMatch?.[2] ?? "").trim();
      const start = orderedMatch ? Number.parseInt(orderedMatch[1], 10) : undefined;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [], start };
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

export function toWechatArticlePlainText(markdown: string) {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

export function renderWechatArticleHtml(
  markdown: string,
  template: WechatArticleTemplate,
  options: RenderWechatArticleOptions = {},
) {
  const blocks = parseMarkdown(markdown);
  const firstHeading = blocks.find(
    (block): block is Extract<MarkdownBlock, { type: "heading" }> =>
      block.type === "heading" && block.depth === 1,
  );
  const title = options.title?.trim() || firstHeading?.text || "公众号推文标题";
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
            const marker = block.ordered ? `${(block.start ?? 1) + itemIndex}` : "";
            const markerWidth = block.ordered ? "34px" : "24px";
            const itemHtml = renderInline(item, template);
            const markerHtml = block.ordered
              ? `<span style="display:inline-block;width:24px;line-height:24px;color:${template.accent};font-size:14px;font-weight:800;">${marker}.</span>`
              : `<span style="display:inline-block;width:18px;line-height:24px;color:${template.accent};font-size:13px;font-weight:900;">&#9679;</span>`;

            return `<section style="margin:0 0 10px;padding:0;color:${template.text};font-size:16px;line-height:1.75;">
              <section style="display:table;width:100%;border-collapse:collapse;">
                <section style="display:table-cell;width:${markerWidth};vertical-align:top;padding:2px 0 0;">
                  ${markerHtml}
                </section>
                <section style="display:table-cell;vertical-align:top;">
                  ${itemHtml}
                </section>
              </section>
            </section>`;
          })
          .join("");

        return `<section style="margin:0 0 18px;padding:0;">${items}</section>`;
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
  ${renderFooter(template, options)}
</section>`;
}
