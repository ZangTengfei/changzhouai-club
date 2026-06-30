"use client";

import { type ReactNode, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { AdminNotice } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  compressImageFile,
  formatFileSize,
} from "@/lib/client-image-compression";
import { createClient } from "@/lib/supabase/client";
import {
  buildMemberAvatarPath,
  buildMemberWorkAssetPath,
  MEMBER_AVATARS_BUCKET,
  MEMBER_WORK_ASSETS_BUCKET,
} from "@/lib/supabase/storage";
import { cssModuleCx } from "@/lib/utils";

import styles from "./image-upload-field.module.css";

type UploadMode = "upload-only" | "upload-or-url";
type UploadAppearance = "site" | "admin";
type StorageUploadScope =
  | "event"
  | "sponsor"
  | "community"
  | "project"
  | "wechat-article";
type UploadStage = "idle" | "compressing" | "uploading";

type UploadTarget =
  | {
      kind: "member-avatar";
      userId: string;
      cacheBust?: boolean;
    }
  | {
      kind: "member-work-asset";
      userId: string;
    }
  | {
      kind: "storage";
      scope: StorageUploadScope;
      eventSlug: string;
    };

type ImageUploadFieldProps = {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  uploadTarget: UploadTarget;
  mode?: UploadMode;
  appearance?: UploadAppearance;
  placeholder?: string;
  uploadLabel?: string;
  clearLabel?: string;
  panelTitle?: string;
  panelDescription?: string;
  filledStatusText?: string;
  emptyStatusText?: string;
  required?: boolean;
  allowClear?: boolean;
  preview?: ReactNode | ((value: string) => ReactNode);
  compressUpload?: boolean;
};

function getStorageUploadUrl(scope: StorageUploadScope) {
  switch (scope) {
    case "community":
      return "/api/admin/storage/community-assets";
    case "project":
      return "/api/admin/storage/project-assets";
    case "wechat-article":
      return "/api/admin/storage/wechat-article-assets";
    case "sponsor":
      return "/api/admin/storage/sponsor-assets";
    default:
      return "/api/admin/storage/event-assets";
  }
}

const cx = cssModuleCx.bind(null, styles);

export function ImageUploadField({
  name,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  uploadTarget,
  mode = "upload-or-url",
  appearance = "admin",
  placeholder,
  uploadLabel = "上传图片",
  clearLabel = "清空图片",
  panelTitle,
  panelDescription,
  filledStatusText = "已设置图片",
  emptyStatusText = "当前未设置图片",
  required = false,
  allowClear = true,
  preview,
  compressUpload = true,
}: ImageUploadFieldProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isControlled = controlledValue !== undefined;
  const value = controlledValue ?? internalValue;
  const isUploading = uploadStage !== "idle";

  function updateValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }

    setUploadStage("compressing");
    setError(null);
    setNotice(null);

    try {
      const compressionResult = compressUpload
        ? await compressImageFile(file)
        : {
            file,
            didCompress: false,
            originalSize: file.size,
            compressedSize: file.size,
          };
      const uploadFile = compressionResult.file;

      if (compressionResult.didCompress) {
        setNotice(
          `已自动压缩：${formatFileSize(
            compressionResult.originalSize,
          )} -> ${formatFileSize(compressionResult.compressedSize)}`,
        );
      }

      setUploadStage("uploading");

      if (uploadTarget.kind === "member-avatar") {
        const supabase = createClient();
        const assetPath = buildMemberAvatarPath(uploadTarget.userId);
        const { error: uploadError } = await supabase.storage
          .from(MEMBER_AVATARS_BUCKET)
          .upload(assetPath, uploadFile, {
            upsert: true,
            contentType: uploadFile.type || undefined,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from(MEMBER_AVATARS_BUCKET)
          .getPublicUrl(assetPath);

        updateValue(
          uploadTarget.cacheBust === false
            ? data.publicUrl
            : `${data.publicUrl}?v=${Date.now()}`,
        );
      } else if (uploadTarget.kind === "member-work-asset") {
        const supabase = createClient();
        const assetPath = buildMemberWorkAssetPath(
          uploadTarget.userId,
          uploadFile.name,
        );
        const { error: uploadError } = await supabase.storage
          .from(MEMBER_WORK_ASSETS_BUCKET)
          .upload(assetPath, uploadFile, {
            contentType: uploadFile.type || undefined,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from(MEMBER_WORK_ASSETS_BUCKET)
          .getPublicUrl(assetPath);

        updateValue(data.publicUrl);
      } else {
        const payload = new FormData();
        payload.append("eventSlug", uploadTarget.eventSlug);
        payload.append("file", uploadFile);

        const response = await fetch(getStorageUploadUrl(uploadTarget.scope), {
          method: "POST",
          body: payload,
        });
        const result = (await response.json().catch(() => null)) as
          | { publicUrl?: string; message?: string }
          | null;

        if (!response.ok || !result?.publicUrl) {
          throw new Error(result?.message || "图片上传失败，请稍后再试。");
        }

        updateValue(result.publicUrl);
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "图片上传失败，请稍后再试。";
      setError(message);
    } finally {
      setUploadStage("idle");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const resolvedPreview =
    typeof preview === "function" ? preview(value) : preview;
  const statusText = value ? filledStatusText : emptyStatusText;
  const uploadLabelText =
    uploadStage === "compressing"
      ? "压缩中..."
      : uploadStage === "uploading"
        ? "上传中..."
        : uploadLabel;

  return (
    <div
      className={cx(
        "image-upload-field",
        Boolean(resolvedPreview) &&
          appearance === "site" &&
          "image-upload-field-split",
      )}
    >
      {resolvedPreview ? (
        <div className={cx("image-upload-preview")}>{resolvedPreview}</div>
      ) : null}

      <div className={cx("image-upload-body")}>
        {panelTitle || panelDescription ? (
          <div className={cx("image-upload-copy")}>
            {panelTitle ? (
              <p className={cx("image-upload-title")}>{panelTitle}</p>
            ) : null}
            {panelDescription ? (
              <p className={cx("image-upload-description")}>{panelDescription}</p>
            ) : null}
          </div>
        ) : null}

        {mode === "upload-or-url" ? (
          appearance === "admin" ? (
            <Input
              name={name}
              value={value}
              onChange={(event) => updateValue(event.target.value)}
              placeholder={placeholder}
              required={required}
            />
          ) : (
            <input
              className="input"
              name={name}
              value={value}
              onChange={(event) => updateValue(event.target.value)}
              placeholder={placeholder}
              required={required}
            />
          )
        ) : (
          <input type="hidden" name={name} value={value} />
        )}

        <div
          className={cx(
            "image-upload-actions",
            appearance === "admin" && "image-upload-actions-admin",
          )}
        >
          {appearance === "admin" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <UploadCloud className="size-4" />
              {uploadLabelText}
            </Button>
          ) : (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <UploadCloud aria-hidden="true" strokeWidth={2} />
              {uploadLabelText}
            </button>
          )}

          {allowClear
            ? appearance === "admin" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateValue("")}
                  disabled={isUploading || !value}
                >
                  {clearLabel}
                </Button>
              ) : (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => updateValue("")}
                  disabled={isUploading || !value}
                >
                  {clearLabel}
                </button>
              )
            : null}

          <span className={cx("image-upload-status")}>{statusText}</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
      />

      {error
        ? appearance === "admin" ? (
            <AdminNotice>{error}</AdminNotice>
          ) : (
            <div className="note-strip">{error}</div>
          )
        : null}
      {!error && notice
        ? appearance === "admin" ? (
            <AdminNotice>{notice}</AdminNotice>
          ) : (
            <div className="note-strip">{notice}</div>
          )
        : null}
    </div>
  );
}
