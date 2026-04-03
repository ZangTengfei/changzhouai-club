"use client";

import { useRef, useState } from "react";

export function StorageImageUrlField({
  name,
  defaultValue = "",
  eventSlug,
  placeholder,
  uploadLabel = "上传图片",
  required = false,
}: {
  name: string;
  defaultValue?: string;
  eventSlug: string;
  placeholder: string;
  uploadLabel?: string;
  required?: boolean;
}) {
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
      const payload = new FormData();
      payload.append("eventSlug", eventSlug);
      payload.append("file", file);

      const response = await fetch("/api/admin/storage/event-assets", {
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

  return (
    <div className="storage-field">
      <input
        className="input"
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        required={required}
      />

      <div className="cta-row storage-field-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "上传中..." : uploadLabel}
        </button>
        {value ? <span className="storage-field-status">已填写图片地址</span> : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
      />

      {error ? <div className="note-strip">{error}</div> : null}
    </div>
  );
}
