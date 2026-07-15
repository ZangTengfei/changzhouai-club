"use client";

import {
  Clipboard,
  ClipboardCheck,
  ImagePlus,
  LoaderCircle,
  Palette,
  PanelBottom,
  RotateCcw,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { AdminNotice } from "@/components/admin-ui";
import { AdminModal } from "@/components/admin-modal";
import { ImageUploadField } from "@/components/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  getWechatArticleTemplate,
  renderWechatArticleHtml,
  toWechatArticlePlainText,
  wechatArticleTemplates,
  type WechatArticleFooterLink,
  type WechatArticleTemplateId,
} from "@/lib/wechat-article-template";
import {
  defaultWechatMaterialSettings,
  getWechatFooterTemplatePreset,
  wechatFooterTemplatePresets,
  type WechatSocialMaterial,
  type WechatSocialMaterialInput,
} from "@/lib/social-material";

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

const sampleTitle = "从 Codex 到真实项目：一次常州 AI Club 的实战交流";

function getImageMarkdown(url: string, alt: string) {
  const safeAlt = (alt || "图片").replace(/[\[\]\r\n]/g, " ").trim() || "图片";

  return `![${safeAlt}](${url})`;
}

function parseFooterLinksText(value: string): WechatArticleFooterLink[] {
  return value
    .split("\n")
    .map((line) => {
      const [title = "", url = "", description = ""] = line
        .split("|")
        .map((part) => part.trim());

      return { title, url, description };
    })
    .filter((link) => link.title && link.url);
}

function getSeparatedInsertion(before: string, after: string, value: string) {
  const prefix = before
    ? before.endsWith("\n\n")
      ? ""
      : before.endsWith("\n")
        ? "\n"
        : "\n\n"
    : "";
  const suffix = after
    ? after.startsWith("\n\n")
      ? ""
      : after.startsWith("\n")
        ? "\n"
        : "\n\n"
    : "";

  return {
    text: `${prefix}${value}${suffix}`,
    cursorOffset: prefix.length + value.length,
  };
}

export function WechatArticleComposer({
  initialMaterial = null,
}: {
  initialMaterial?: WechatSocialMaterial | null;
}) {
  const router = useRouter();
  const initialSettings = initialMaterial?.settings ?? defaultWechatMaterialSettings;
  const initialMarkdown = initialMaterial?.contentMarkdown ?? sampleMarkdown;
  const [materialId, setMaterialId] = useState(initialMaterial?.id ?? null);
  const [title, setTitle] = useState(initialMaterial?.title ?? sampleTitle);
  const [templateId, setTemplateId] = useState<WechatArticleTemplateId>(
    initialSettings.templateId,
  );
  const [footerTemplateId, setFooterTemplateId] = useState<WechatArticleTemplateId>(
    initialSettings.footerTemplateId,
  );
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageAlt, setImageAlt] = useState("文章配图");
  const [imageUrl, setImageUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState(initialSettings.videoTitle);
  const [videoDescription, setVideoDescription] = useState(initialSettings.videoDescription);
  const [videoActionLabel, setVideoActionLabel] = useState(initialSettings.videoActionLabel);
  const [videoUrl, setVideoUrl] = useState(initialSettings.videoUrl);
  const [relatedLinksText, setRelatedLinksText] = useState(initialSettings.relatedLinksText);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [savedAt, setSavedAt] = useState(initialMaterial?.updatedAt ?? null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "fallback" | "error">(
    "idle",
  );
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);
  const markdownSelectionRef = useRef({
    start: initialMarkdown.length,
    end: initialMarkdown.length,
  });
  const previewRef = useRef<HTMLDivElement>(null);
  const template = getWechatArticleTemplate(templateId);
  const footerTemplate = getWechatArticleTemplate(footerTemplateId);
  const footerPreset = getWechatFooterTemplatePreset(footerTemplateId);
  const relatedLinks = useMemo(
    () => parseFooterLinksText(relatedLinksText),
    [relatedLinksText],
  );
  const videoChannel = useMemo(
    () => ({
      title: videoTitle,
      description: videoDescription,
      actionLabel: videoActionLabel,
      url: videoUrl,
    }),
    [videoActionLabel, videoDescription, videoTitle, videoUrl],
  );
  const html = useMemo(
    () =>
      renderWechatArticleHtml(markdown, template, {
        footerTemplate,
        relatedLinks,
        videoChannel,
      }),
    [footerTemplate, markdown, relatedLinks, template, videoChannel],
  );
  const plainText = useMemo(() => toWechatArticlePlainText(markdown), [markdown]);

  function markChanged() {
    setCopyState("idle");
    setSaveState("idle");
  }

  function rememberMarkdownSelection(textarea: HTMLTextAreaElement) {
    markdownSelectionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
  }

  function insertImageMarkdown(url = imageUrl, alt = imageAlt) {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setImageUploadError("请先上传图片或填写图片链接。");
      return;
    }

    const textarea = markdownTextareaRef.current;
    const start = textarea ? markdownSelectionRef.current.start : markdown.length;
    const end = textarea ? markdownSelectionRef.current.end : markdown.length;
    const previousScrollTop = textarea?.scrollTop ?? 0;
    const before = markdown.slice(0, start);
    const after = markdown.slice(end);
    const imageMarkdown = getImageMarkdown(trimmedUrl, alt);
    const insertion = getSeparatedInsertion(before, after, imageMarkdown);
    const nextMarkdown = `${before}${insertion.text}${after}`;

    setMarkdown(nextMarkdown);
    markChanged();
    setImageUploadError(null);
    setImageUrl("");
    setImageModalOpen(false);

    requestAnimationFrame(() => {
      const nextCursor = start + insertion.cursorOffset;
      const currentTextarea = markdownTextareaRef.current;
      currentTextarea?.focus({ preventScroll: true });
      currentTextarea?.setSelectionRange(nextCursor, nextCursor);
      if (currentTextarea) {
        currentTextarea.scrollTop = previousScrollTop;
        currentTextarea.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      markdownSelectionRef.current = { start: nextCursor, end: nextCursor };
    });
  }

  function applyFooterTemplate(nextId: WechatArticleTemplateId) {
    const preset = getWechatFooterTemplatePreset(nextId);

    setFooterTemplateId(nextId);
    setVideoTitle(preset.videoTitle);
    setVideoDescription(preset.videoDescription);
    setVideoActionLabel(preset.videoActionLabel);
    setVideoUrl(preset.videoUrl);
    setRelatedLinksText(preset.relatedLinksText);
    markChanged();
  }

  async function saveMaterial() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSaveState("error");
      return;
    }

    const payload: WechatSocialMaterialInput = {
      title: trimmedTitle,
      contentMarkdown: markdown,
      settings: {
        templateId,
        footerTemplateId,
        videoTitle,
        videoDescription,
        videoActionLabel,
        videoUrl,
        relatedLinksText,
      },
    };
    const endpoint = materialId
      ? `/api/admin/social-materials/${materialId}`
      : "/api/admin/social-materials";

    setSaveState("saving");

    try {
      const response = await fetch(endpoint, {
        method: materialId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.material?.id) {
        throw new Error(result.error ?? "save_failed");
      }

      setMaterialId(result.material.id);
      setTitle(trimmedTitle);
      setSavedAt(result.material.updatedAt);
      setSaveState("saved");
      if (!materialId) {
        router.replace(`/admin/social/wechat?draft=${result.material.id}`, {
          scroll: false,
        });
      }
    } catch {
      setSaveState("error");
    }
  }

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
    <div className="grid gap-3">
      <section className="sticky top-2 z-20 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background/95 p-2 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid min-w-[220px] flex-1 gap-1 sm:max-w-[360px]">
            <span className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              底稿标题
            </span>
            <Input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setSaveState("idle");
              }}
              placeholder="给底稿起一个便于查找的标题"
            />
          </label>

          <Button
            type="button"
            variant={imageModalOpen ? "secondary" : "outline"}
            onClick={() => setImageModalOpen(true)}
          >
            <ImagePlus className="size-4" />
            插入图片
          </Button>

          <label className="grid min-w-[150px] gap-1">
            <span className="flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Palette className="size-3" />
              整体风格
            </span>
            <NativeSelect
              value={templateId}
              onChange={(event) => {
                setTemplateId(event.target.value as WechatArticleTemplateId);
                markChanged();
              }}
            >
              {wechatArticleTemplates.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </NativeSelect>
          </label>

          <label className="grid min-w-[160px] gap-1">
            <span className="flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <PanelBottom className="size-3" />
              底部模块
            </span>
            <NativeSelect
              value={footerTemplateId}
              onChange={(event) => applyFooterTemplate(
                event.target.value as WechatArticleTemplateId,
              )}
            >
              {wechatFooterTemplatePresets.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </NativeSelect>
          </label>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="恢复示例"
            aria-label="恢复示例"
            onClick={() => {
              setMarkdown(sampleMarkdown);
              setTitle(sampleTitle);
              setTemplateId(defaultWechatMaterialSettings.templateId);
              applyFooterTemplate(defaultWechatMaterialSettings.footerTemplateId);
              setImageModalOpen(false);
              markChanged();
            }}
          >
            <RotateCcw className="size-4" />
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className="max-w-[180px] text-right text-[11px] leading-4 text-muted-foreground">
              {saveState === "saved" && savedAt
                ? `已保存 ${new Date(savedAt).toLocaleString("zh-CN")}`
                : saveState === "error"
                  ? "保存失败，请稍后重试"
                  : materialId
                    ? "修改后记得保存"
                    : "尚未保存"}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={saveMaterial}
              disabled={saveState === "saving"}
            >
              {saveState === "saving" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {saveState === "saving" ? "保存中" : "保存底稿"}
            </Button>
            <Button type="button" onClick={copyRichText}>
              {copyState === "copied" ? (
                <ClipboardCheck className="size-4" />
              ) : (
                <Clipboard className="size-4" />
              )}
              {copyState === "copied"
                ? "已复制"
                : copyState === "fallback"
                  ? "已复制纯文本"
                  : "复制到公众号"}
            </Button>
          </div>
        </div>

        {copyState === "error" ? (
          <p className="mt-2 text-xs text-destructive">浏览器没有开放剪贴板权限。</p>
        ) : null}
      </section>

      <AdminModal
        title="插入图片到当前光标"
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
      >
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            上传或粘贴图片地址，插入后会自动回到原来的编辑位置。
          </p>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">图片说明</span>
            <Input
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="例如：活动现场照片"
            />
          </label>
          <ImageUploadField
            name="wechat_article_image_url"
            value={imageUrl}
            onValueChange={(value) => {
              setImageUrl(value);
              setImageUploadError(null);
            }}
            uploadTarget={{
              kind: "storage",
              scope: "wechat-article",
              eventSlug: "wechat-article",
            }}
            placeholder="上传后自动生成，也可粘贴公开 HTTPS 图片地址"
            uploadLabel="上传图片"
            clearLabel="清空"
            filledStatusText="图片已准备好"
            emptyStatusText="等待上传或填写链接"
          />
          {imageUploadError ? <AdminNotice>{imageUploadError}</AdminNotice> : null}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => insertImageMarkdown()}
              disabled={!imageUrl.trim()}
            >
              <ImagePlus className="size-4" />
              插入到光标
            </Button>
          </div>
        </div>
      </AdminModal>

      <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.9fr)]">
        <section className="min-w-0 overflow-hidden rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/30 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Markdown 原稿</p>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </div>
            <span className="text-xs text-muted-foreground">{markdown.length} 字符</span>
          </div>
          <Textarea
            ref={markdownTextareaRef}
            value={markdown}
            onChange={(event) => {
              setMarkdown(event.target.value);
              rememberMarkdownSelection(event.currentTarget);
              markChanged();
            }}
            onSelect={(event) => rememberMarkdownSelection(event.currentTarget)}
            className="min-h-[calc(100vh-230px)] resize-none rounded-none border-0 bg-background px-4 py-4 font-mono text-[14px] leading-7 shadow-none focus-visible:ring-0"
            spellCheck={false}
          />
        </section>

        <section className="min-w-0 self-start rounded-[calc(var(--radius)-2px)] border border-border/70 bg-[#f5f2eb] p-3 xl:sticky xl:top-[92px]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">公众号预览</p>
              <p className="text-xs text-muted-foreground">
                {footerPreset.name} · {footerPreset.description}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">实时更新</span>
          </div>
          <div className="max-h-[calc(100vh-170px)] overflow-auto rounded-[calc(var(--radius)-4px)] bg-white shadow-sm">
            <div
              ref={previewRef}
              className="mx-auto w-full max-w-[677px]"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
