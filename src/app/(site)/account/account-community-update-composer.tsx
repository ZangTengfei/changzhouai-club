"use client";

import { useMemo, useRef, useState } from "react";
import {
  Eye,
  ImagePlus,
  PencilLine,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";

import { MarkdownContent } from "@/components/markdown-content";
import {
  compressImageFile,
  formatFileSize,
} from "@/lib/client-image-compression";
import { createClient } from "@/lib/supabase/client";
import {
  buildCommunityUpdateAssetPath,
  COMMUNITY_UPDATE_ASSETS_BUCKET,
} from "@/lib/supabase/storage";

import styles from "./account-page.module.css";

type AccountCommunityUpdateComposerProps = {
  action: (formData: FormData) => void | Promise<void>;
  userId: string;
  typeOptions: Array<[string, string]>;
};

const MAX_UPDATE_IMAGES = 6;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function createPreviewExcerpt(content: string) {
  const normalized = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/[*_~`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 150 ? `${normalized.slice(0, 150)}...` : normalized;
}

function normalizeTags(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function AccountCommunityUpdateComposer({
  action,
  userId,
  typeOptions,
}: AccountCommunityUpdateComposerProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [updateType, setUpdateType] = useState(typeOptions[0]?.[0] ?? "share");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedUrl, setRelatedUrl] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTypeLabel =
    typeOptions.find(([value]) => value === updateType)?.[1] ?? "经验分享";
  const previewTitle = title.trim() || activeTypeLabel;
  const previewTags = useMemo(() => normalizeTags(tags), [tags]);
  const previewExcerpt = useMemo(() => createPreviewExcerpt(content), [content]);

  function addImageUrl() {
    const nextUrl = imageUrlDraft.trim();

    if (!nextUrl) {
      return;
    }

    if (!isValidImageUrl(nextUrl)) {
      setUploadMessage("图片链接需要以 http 或 https 开头。");
      return;
    }

    setImageUrls((current) =>
      current.includes(nextUrl) || current.length >= MAX_UPDATE_IMAGES
        ? current
        : [...current, nextUrl],
    );
    setImageUrlDraft("");
    setUploadMessage(null);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const selectedFiles = Array.from(files).slice(0, MAX_UPDATE_IMAGES - imageUrls.length);

    if (selectedFiles.length === 0) {
      setUploadMessage(`最多上传 ${MAX_UPDATE_IMAGES} 张图片。`);
      return;
    }

    const invalidFile = selectedFiles.find((file) => !file.type.startsWith("image/"));

    if (invalidFile) {
      setUploadMessage("只能上传图片文件。");
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];
      let compressedCount = 0;
      let originalTotalSize = 0;
      let uploadTotalSize = 0;

      for (const file of selectedFiles) {
        const compressionResult = await compressImageFile(file);
        const uploadFile = compressionResult.file;

        if (uploadFile.size > MAX_IMAGE_SIZE) {
          throw new Error("单张图片压缩后仍超过 8MB，请换一张更小的图片。");
        }

        if (compressionResult.didCompress) {
          compressedCount += 1;
        }

        originalTotalSize += compressionResult.originalSize;
        uploadTotalSize += compressionResult.compressedSize;

        const assetPath = buildCommunityUpdateAssetPath(userId, uploadFile.name);
        const { error } = await supabase.storage
          .from(COMMUNITY_UPDATE_ASSETS_BUCKET)
          .upload(assetPath, uploadFile, {
            contentType: uploadFile.type || undefined,
          });

        if (error) {
          throw error;
        }

        const { data } = supabase.storage
          .from(COMMUNITY_UPDATE_ASSETS_BUCKET)
          .getPublicUrl(assetPath);

        uploadedUrls.push(data.publicUrl);
      }

      setImageUrls((current) =>
        [...current, ...uploadedUrls].slice(0, MAX_UPDATE_IMAGES),
      );
      setUploadMessage(
        uploadedUrls.length > 0
          ? compressedCount > 0
            ? `已压缩 ${compressedCount} 张并上传 ${uploadedUrls.length} 张图片：${formatFileSize(
                originalTotalSize,
              )} -> ${formatFileSize(uploadTotalSize)}。`
            : `已上传 ${uploadedUrls.length} 张图片。`
          : null,
      );
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "图片上传失败，请稍后再试。",
      );
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <form action={action} className={styles.accountUpdateComposer}>
      <input type="hidden" name="update_type" value={updateType} />
      <input type="hidden" name="title" value={title} />
      <textarea hidden readOnly name="content" value={content} />
      <input type="hidden" name="related_url" value={relatedUrl} />
      <input type="hidden" name="tags" value={tags} />
      <input type="hidden" name="image_urls" value={imageUrls.join("\n")} />

      <div className={styles.accountUpdateComposerToolbar}>
        <div className={styles.accountUpdateModeSwitch} aria-label="动态编辑模式">
          <button
            type="button"
            className={mode === "edit" ? styles.accountUpdateModeActive : undefined}
            onClick={() => setMode("edit")}
          >
            <PencilLine aria-hidden="true" strokeWidth={1.9} />
            编辑
          </button>
          <button
            type="button"
            className={mode === "preview" ? styles.accountUpdateModeActive : undefined}
            onClick={() => setMode("preview")}
          >
            <Eye aria-hidden="true" strokeWidth={1.9} />
            预览
          </button>
        </div>
        <span>{previewExcerpt || "写一点内容后，可以在这里预览摘要。"}</span>
      </div>

      {mode === "edit" ? (
        <div className={styles.accountUpdateForm}>
          <label>
            <span>动态类型</span>
            <select
              className="input"
              value={updateType}
              onChange={(event) => setUpdateType(event.target.value)}
            >
              {typeOptions.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>标题</span>
            <input
              className="input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="可选，例如：一个 RAG 小实验"
            />
          </label>

          <label className={styles.accountUpdateWideField}>
            <span>正文（支持 Markdown）</span>
            <textarea
              className="input textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={7}
              required
              placeholder="可以直接粘贴 Markdown，例如标题、列表、引用、代码块。"
            />
          </label>

          <div className={styles.accountUpdateUploadPanel}>
            <div>
              <span>图片</span>
              <p>最多 6 张。可以直接上传，也可以粘贴公开图片链接。</p>
            </div>

            <div className={styles.accountUpdateUploadActions}>
              <button
                type="button"
                className="button home-ghost-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || imageUrls.length >= MAX_UPDATE_IMAGES}
              >
                <UploadCloud aria-hidden="true" strokeWidth={2} />
                {isUploading ? "上传中" : "上传图片"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => uploadFiles(event.target.files)}
              />
            </div>

            <div className={styles.accountUpdateImageUrlRow}>
              <input
                className="input"
                value={imageUrlDraft}
                onChange={(event) => setImageUrlDraft(event.target.value)}
                placeholder="https://.../image.jpg"
              />
              <button
                type="button"
                className="button home-ghost-button"
                onClick={addImageUrl}
                disabled={imageUrls.length >= MAX_UPDATE_IMAGES}
              >
                <Plus aria-hidden="true" strokeWidth={2} />
                添加链接
              </button>
            </div>

            {imageUrls.length > 0 ? (
              <div className={styles.accountUpdateImagePreviewGrid}>
                {imageUrls.map((imageUrl, index) => (
                  <figure key={`${imageUrl}-${index}`}>
                    <img src={imageUrl} alt={`动态图片 ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() =>
                        setImageUrls((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      aria-label={`移除第 ${index + 1} 张图片`}
                    >
                      <X aria-hidden="true" strokeWidth={2} />
                    </button>
                  </figure>
                ))}
              </div>
            ) : null}

            {uploadMessage ? (
              <p className={styles.accountUpdateUploadMessage}>{uploadMessage}</p>
            ) : null}
          </div>

          <label>
            <span>相关链接</span>
            <input
              className="input"
              value={relatedUrl}
              onChange={(event) => setRelatedUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            <span>标签</span>
            <input
              className="input"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="例如：Agent、RAG、活动照片"
            />
          </label>
        </div>
      ) : (
        <div className={styles.accountUpdatePreviewPanel}>
          <div className={styles.accountUpdatePreviewMeta}>
            <span>{activeTypeLabel}</span>
            <span>待审核</span>
          </div>
          <h3>{previewTitle}</h3>
          {content.trim() ? (
            <MarkdownContent content={content} className={styles.accountUpdatePreviewMarkdown} />
          ) : (
            <p className={styles.accountUpdatePreviewEmpty}>正文预览会显示在这里。</p>
          )}

          {imageUrls.length > 0 ? (
            <div className={styles.accountUpdatePreviewImages}>
              {imageUrls.map((imageUrl, index) => (
                <img src={imageUrl} alt={`动态图片预览 ${index + 1}`} key={imageUrl} />
              ))}
            </div>
          ) : null}

          {previewTags.length > 0 ? (
            <div className={styles.accountUpdatePreviewTags}>
              {previewTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}

          <div className={styles.accountUpdateExcerptPreview}>
            <strong>时间线摘要</strong>
            <p>{previewExcerpt || "提交后，动态列表会从正文里自动生成摘要。"}</p>
          </div>
        </div>
      )}

      <div className={styles.accountUpdateFormFooter}>
        <button type="submit" className="button home-primary-button" disabled={isUploading}>
          <ImagePlus aria-hidden="true" strokeWidth={2} />
          提交审核
        </button>
        <span>通过审核后会公开展示，敏感客户、项目或个人信息请先脱敏。</span>
      </div>
    </form>
  );
}
