"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { AdminNotice } from "@/components/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StorageImageUrlField({
  name,
  defaultValue = "",
  eventSlug,
  uploadScope = "event",
  placeholder,
  uploadLabel = "上传图片",
  required = false,
}: {
  name: string;
  defaultValue?: string;
  eventSlug: string;
  uploadScope?: "event" | "sponsor" | "community";
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

      const uploadUrl =
        uploadScope === "community"
          ? "/api/admin/storage/community-assets"
          : uploadScope === "sponsor"
            ? "/api/admin/storage/sponsor-assets"
            : "/api/admin/storage/event-assets";
      const response = await fetch(uploadUrl, {
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
    <div className="grid gap-2">
      <Input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        required={required}
      />

      <div className="flex flex-wrap items-center gap-2">
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
        {value ? <span className="text-xs text-muted-foreground">已填写图片地址</span> : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
      />

      {error ? <AdminNotice>{error}</AdminNotice> : null}
    </div>
  );
}
