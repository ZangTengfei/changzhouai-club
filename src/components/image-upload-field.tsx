"use client";

import { type ReactNode, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { AdminNotice } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  buildMemberAvatarPath,
  MEMBER_AVATARS_BUCKET,
} from "@/lib/supabase/storage";

import styles from "./image-upload-field.module.css";

type UploadMode = "upload-only" | "upload-or-url";
type UploadAppearance = "site" | "admin";
type StorageUploadScope = "event" | "sponsor" | "community";

type UploadTarget =
  | {
      kind: "member-avatar";
      userId: string;
      cacheBust?: boolean;
    }
  | {
      kind: "storage";
      scope: StorageUploadScope;
      eventSlug: string;
    };

type ImageUploadFieldProps = {
  name: string;
  defaultValue?: string;
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
};

function getStorageUploadUrl(scope: StorageUploadScope) {
  switch (scope) {
    case "community":
      return "/api/admin/storage/community-assets";
    case "sponsor":
      return "/api/admin/storage/sponsor-assets";
    default:
      return "/api/admin/storage/event-assets";
  }
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes
    .flatMap((className) =>
      typeof className === "string" ? className.split(/\s+/) : [],
    )
    .filter(Boolean)
    .map((className) => styles[className as keyof typeof styles] ?? className)
    .join(" ");
}

export function ImageUploadField({
  name,
  defaultValue = "",
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
}: ImageUploadFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File | null) {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (uploadTarget.kind === "member-avatar") {
        const supabase = createClient();
        const assetPath = buildMemberAvatarPath(uploadTarget.userId);
        const { error: uploadError } = await supabase.storage
          .from(MEMBER_AVATARS_BUCKET)
          .upload(assetPath, file, {
            upsert: true,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from(MEMBER_AVATARS_BUCKET)
          .getPublicUrl(assetPath);

        setValue(
          uploadTarget.cacheBust === false
            ? data.publicUrl
            : `${data.publicUrl}?v=${Date.now()}`,
        );
      } else {
        const payload = new FormData();
        payload.append("eventSlug", uploadTarget.eventSlug);
        payload.append("file", file);

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

        setValue(result.publicUrl);
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "图片上传失败，请稍后再试。";
      setError(message);
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const resolvedPreview =
    typeof preview === "function" ? preview(value) : preview;
  const statusText = value ? filledStatusText : emptyStatusText;

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
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              required={required}
            />
          ) : (
            <input
              className="input"
              name={name}
              value={value}
              onChange={(event) => setValue(event.target.value)}
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
              {isUploading ? "上传中..." : uploadLabel}
            </Button>
          ) : (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "上传中..." : uploadLabel}
            </button>
          )}

          {allowClear
            ? appearance === "admin" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue("")}
                  disabled={isUploading || !value}
                >
                  {clearLabel}
                </Button>
              ) : (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setValue("")}
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
    </div>
  );
}
