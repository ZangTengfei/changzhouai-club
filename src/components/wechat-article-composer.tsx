"use client";

import { Clipboard, ClipboardCheck, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { AdminNotice } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  getWechatArticleTemplate,
  renderWechatArticleHtml,
  toWechatArticlePlainText,
  wechatArticleTemplates,
  type WechatArticleTemplateId,
} from "@/lib/wechat-article-template";

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

export function WechatArticleComposer() {
  const [templateId, setTemplateId] = useState<WechatArticleTemplateId>("community");
  const [markdown, setMarkdown] = useState(sampleMarkdown);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "fallback" | "error">(
    "idle",
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const template = getWechatArticleTemplate(templateId);
  const html = useMemo(
    () => renderWechatArticleHtml(markdown, template),
    [markdown, template],
  );
  const plainText = useMemo(() => toWechatArticlePlainText(markdown), [markdown]);

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
                setTemplateId(event.target.value as WechatArticleTemplateId);
                setCopyState("idle");
              }}
            >
              {wechatArticleTemplates.map((item) => (
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
