import { ImageUploadField } from "@/components/image-upload-field";

export function StorageImageUrlField({
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
}: {
  name: string;
  defaultValue?: string;
  eventSlug: string;
  uploadScope?: "event" | "sponsor" | "community";
  placeholder: string;
  uploadLabel?: string;
  required?: boolean;
  mode?: "upload-only" | "upload-or-url";
  clearLabel?: string;
  filledStatusText?: string;
  emptyStatusText?: string;
}) {
  return (
    <ImageUploadField
      name={name}
      defaultValue={defaultValue}
      uploadTarget={{
        kind: "storage",
        scope: uploadScope,
        eventSlug,
      }}
      mode={mode}
      appearance="admin"
      placeholder={placeholder}
      uploadLabel={uploadLabel}
      clearLabel={clearLabel}
      filledStatusText={filledStatusText}
      emptyStatusText={emptyStatusText}
      required={required}
    />
  );
}
