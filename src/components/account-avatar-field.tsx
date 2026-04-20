"use client";

import { useRef, useState } from "react";

import { MemberAvatar } from "@/components/member-avatar";
import { createClient } from "@/lib/supabase/client";
import {
  buildMemberAvatarPath,
  MEMBER_AVATARS_BUCKET,
} from "@/lib/supabase/storage";

type AccountAvatarFieldProps = {
  name: string;
  defaultValue?: string;
  userId: string;
  displayName: string;
};

export function AccountAvatarField({
  name,
  defaultValue = "",
  userId,
  displayName,
}: AccountAvatarFieldProps) {
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
      const supabase = createClient();
      const assetPath = buildMemberAvatarPath(userId);
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

      setValue(`${data.publicUrl}?v=${Date.now()}`);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "头像上传失败，请稍后再试。";
      setError(message);
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="form-field form-field-wide">
      <span className="form-label-row">
        <span>头像</span>
      </span>

      <div className="account-avatar-field">
        <div className="account-avatar-preview">
          <MemberAvatar name={displayName} avatarUrl={value} />
        </div>

        <div className="account-avatar-panel">
          <div className="account-avatar-copy">
            <p className="account-avatar-title">上传头像</p>
            <p className="account-avatar-hint">
              支持直接上传图片。上传后会自动保存到社区存储，不需要再填写头像链接。
            </p>
          </div>

          <div className="cta-row storage-field-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "上传中..." : "上传头像"}
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => setValue("")}
              disabled={isUploading || !value}
            >
              恢复默认头像
            </button>
            <span className="storage-field-status">
              {value ? "已设置头像" : "当前为默认缩写头像"}
            </span>
          </div>
        </div>
      </div>

      <input type="hidden" name={name} value={value} />

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
