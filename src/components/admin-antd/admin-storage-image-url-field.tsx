"use client";

import { useRef, useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Space, Typography } from "antd";

import {
  compressImageFile,
  formatFileSize,
} from "@/lib/client-image-compression";

type StorageUploadScope = "event" | "sponsor" | "community";
type UploadMode = "upload-only" | "upload-or-url";
type UploadStage = "idle" | "compressing" | "uploading";

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

export function AdminStorageImageUrlField({
  name,
  defaultValue = "",
  eventSlug,
  uploadScope = "event",
  placeholder,
  uploadLabel = "上传图片",
  required = false,
  mode = "upload-or-url",
  clearLabel = "清空图片",
  filledStatusText = "已填写图片地址",
  emptyStatusText = "当前未设置图片",
  compressUpload = true,
}: {
  name: string;
  defaultValue?: string;
  eventSlug: string;
  uploadScope?: StorageUploadScope;
  placeholder: string;
  uploadLabel?: string;
  required?: boolean;
  mode?: UploadMode;
  clearLabel?: string;
  filledStatusText?: string;
  emptyStatusText?: string;
  compressUpload?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = uploadStage !== "idle";
  const statusText = value ? filledStatusText : emptyStatusText;
  const uploadLabelText =
    uploadStage === "compressing"
      ? "压缩中..."
      : uploadStage === "uploading"
        ? "上传中..."
        : uploadLabel;

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

      const payload = new FormData();
      payload.append("eventSlug", eventSlug);
      payload.append("file", uploadFile);

      const response = await fetch(getStorageUploadUrl(uploadScope), {
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
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "图片上传失败，请稍后再试。");
    } finally {
      setUploadStage("idle");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <Space direction="vertical" className="w-full" size="small">
      {mode === "upload-or-url" ? (
        <Input
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input type="hidden" name={name} value={value} />
      )}

      <Space wrap>
        <Button
          htmlType="button"
          icon={<UploadOutlined />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {uploadLabelText}
        </Button>
        <Button
          htmlType="button"
          type="text"
          onClick={() => setValue("")}
          disabled={isUploading || !value}
        >
          {clearLabel}
        </Button>
        <Typography.Text type="secondary">{statusText}</Typography.Text>
      </Space>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
      />

      {error ? <Alert message={error} type="error" showIcon /> : null}
      {!error && notice ? <Alert message={notice} type="info" showIcon /> : null}
    </Space>
  );
}
