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
import { cn } from "@/lib/utils";

type UploadMode = "upload-only" | "upload-or-url";
type UploadAppearance = "site" | "admin";
type StorageUploadScope =
  | "event"
  | "event-group-qr"
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
    case "event-group-qr":
      return "/api/admin/storage/event-group-qr";
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

      if (
        uploadTarget.kind === "member-avatar" ||
        uploadTarget.kind === "member-work-asset"
      ) {
        const payload = new FormData();
        payload.append(
          "assetType",
          uploadTarget.kind === "member-avatar" ? "avatar" : "work",
        );
        payload.append("file", uploadFile);

        const response = await fetch("/api/account/storage/member-assets", {
          method: "POST",
          body: payload,
        });
        const result = (await response.json().catch(() => null)) as
          | { publicUrl?: string; message?: string }
          | null;

        if (!response.ok || !result?.publicUrl) {
          throw new Error(result?.message || "图片上传失败，请稍后再试。");
        }

        updateValue(
          uploadTarget.kind === "member-avatar" &&
            uploadTarget.cacheBust !== false
            ? `${result.publicUrl}?v=${Date.now()}`
            : result.publicUrl,
        );
      } else {
        const payload = new FormData();
        payload.append("eventSlug", uploadTarget.eventSlug);
        payload.append("file", uploadFile);

        const response = await fetch(getStorageUploadUrl(uploadTarget.scope), {
          method: "POST",
          body: payload,
        });
        const result = (await response.json().catch(() => null)) as
          | { publicUrl?: string; value?: string; message?: string }
          | null;

        const uploadedValue = result?.value ?? result?.publicUrl;
        if (!response.ok || !uploadedValue) {
          throw new Error(result?.message || "图片上传失败，请稍后再试。");
        }

        updateValue(uploadedValue);
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
      className={cn(
        "grid min-w-0 gap-3",
        Boolean(resolvedPreview) &&
          appearance === "site" &&
          "grid-cols-[112px_minmax(0,1fr)] items-center gap-6 max-[820px]:grid-cols-1",
      )}
    >
      {resolvedPreview ? (
        <div className="grid justify-items-start">{resolvedPreview}</div>
      ) : null}

      <div className="grid min-w-0 gap-3.5">
        {panelTitle || panelDescription ? (
          <div className="grid gap-1.5">
            {panelTitle ? (
              <p className="m-0 text-base font-bold text-ink">{panelTitle}</p>
            ) : null}
            {panelDescription ? (
              <p className="m-0 text-[0.9rem] leading-[1.6] text-muted-foreground">{panelDescription}</p>
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
          className={cn(
            "flex flex-wrap items-center gap-2.5",
            appearance === "admin" && "gap-2",
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

          <span className="text-[0.92rem] font-semibold text-copy-muted">{statusText}</span>
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
