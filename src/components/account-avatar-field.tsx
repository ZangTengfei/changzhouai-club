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
          <p className="account-avatar-hint">
            支持直接上传图片，或粘贴一个公开可访问的头像地址。留空则显示默认缩写头像。
          </p>
        </div>

        <div className="storage-field">
          <input
            className="input"
            name={name}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />

          <div className="cta-row storage-field-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "上传中..." : "上传头像"}
            </button>
            {value ? <span className="storage-field-status">已填写头像地址</span> : null}
          </div>
        </div>
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
