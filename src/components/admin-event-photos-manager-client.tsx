"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { StorageImageUrlField } from "@/components/storage-image-url-field";
import { getAdminErrorMessage, getAdminSavedMessage } from "@/lib/admin/event-feedback";

type EventPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; saved?: string }
    | null;

  if (!response.ok) {
    throw new Error(getAdminErrorMessage(payload?.error) ?? "提交失败，请稍后再试。");
  }

  return payload;
}

export function AdminEventPhotosManagerClient({
  eventId,
  eventSlug,
  eventTitle,
  coverImageUrl,
  photos,
  onChanged,
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  coverImageUrl: string | null;
  photos: EventPhoto[];
  onChanged?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/photos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: String(formData.get("image_url") ?? ""),
            caption: String(formData.get("caption") ?? ""),
            sort_order: String(formData.get("sort_order") ?? "0"),
          }),
        });
        const result = await readApiResult(response);
        toast.success(getAdminSavedMessage(result?.saved ?? "photo") ?? "后台内容已更新。");
        onChanged?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "保存失败，请稍后再试。");
      }
    });
  }

  function submitUpdate(photoId: string, formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/photos/${photoId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: String(formData.get("image_url") ?? ""),
            caption: String(formData.get("caption") ?? ""),
            sort_order: String(formData.get("sort_order") ?? "0"),
          }),
        });
        const result = await readApiResult(response);
        toast.success(getAdminSavedMessage(result?.saved ?? "photo") ?? "后台内容已更新。");
        onChanged?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "保存失败，请稍后再试。");
      }
    });
  }

  function handleDelete(photoId: string) {
    if (!window.confirm("确认删除这张活动照片吗？")) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/photos/${photoId}`, {
          method: "DELETE",
        });
        const result = await readApiResult(response);
        toast.success(
          getAdminSavedMessage(result?.saved ?? "photo_deleted") ?? "后台内容已更新。",
        );
        onChanged?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "删除失败，请稍后再试。");
      }
    });
  }

  function handleSetCover(imageUrl: string) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${eventId}/cover`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
          }),
        });
        const result = await readApiResult(response);
        toast.success(getAdminSavedMessage(result?.saved ?? "cover") ?? "后台内容已更新。");
        onChanged?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "更新失败，请稍后再试。");
      }
    });
  }

  return (
    <section className="surface admin-card">
      <div className="section-heading">
        <p className="eyebrow">Gallery</p>
        <h2>{eventTitle} 的照片管理</h2>
      </div>

      <div className="admin-cover-panel">
        <div>
          <h3>当前封面</h3>
          <p>
            封面图会优先用于活动列表展示。你也可以直接把某张活动照片设成封面，减少重复维护。
          </p>
        </div>

        {coverImageUrl ? (
          <div className="admin-image-preview">
            <img src={coverImageUrl} alt={`${eventTitle} 封面`} loading="lazy" />
            <p className="admin-image-url">{coverImageUrl}</p>
          </div>
        ) : (
          <div className="note-strip">暂未设置封面图。</div>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="admin-photo-list">
          {photos.map((photo) => {
            const isCover = coverImageUrl === photo.image_url;

            return (
              <article className="admin-photo-card" key={photo.id}>
                <div className="admin-image-preview">
                  <img src={photo.image_url} alt={photo.caption ?? eventTitle} loading="lazy" />
                  <p className="admin-image-url">{photo.image_url}</p>
                </div>

                <div className="admin-photo-body">
                  <div className="pill-row admin-photo-meta">
                    <span className="pill">排序 {photo.sort_order}</span>
                    {isCover ? <span className="pill">当前封面</span> : null}
                  </div>

                  <form
                    className="account-form admin-photo-form"
                    onSubmit={(formEvent) => {
                      formEvent.preventDefault();
                      submitUpdate(photo.id, new FormData(formEvent.currentTarget));
                    }}
                  >
                    <div className="form-grid admin-photo-form-grid">
                      <label className="form-field form-field-wide">
                        <span>图片路径</span>
                        <StorageImageUrlField
                          name="image_url"
                          defaultValue={photo.image_url}
                          eventSlug={eventSlug}
                          placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                          uploadLabel="替换图片"
                          required
                        />
                      </label>

                      <label className="form-field">
                        <span>排序</span>
                        <input
                          className="input"
                          type="number"
                          name="sort_order"
                          defaultValue={photo.sort_order}
                        />
                      </label>

                      <label className="form-field form-field-wide">
                        <span>图片说明</span>
                        <input
                          className="input"
                          name="caption"
                          defaultValue={photo.caption ?? ""}
                          placeholder="例如：现场自由交流 / 成员分享环节"
                        />
                      </label>
                    </div>

                    <div className="cta-row admin-photo-actions">
                      <button type="submit" className="button" disabled={isPending}>
                        {isPending ? "提交中..." : "保存照片"}
                      </button>
                    </div>
                  </form>

                  <div className="cta-row admin-photo-actions">
                    {!isCover ? (
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => handleSetCover(photo.image_url)}
                        disabled={isPending}
                      >
                        设为封面
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => handleDelete(photo.id)}
                      disabled={isPending}
                    >
                      删除照片
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="note-strip">这场活动暂未添加相册照片，可先上传封面或现场照片。</div>
      )}

      <article className="admin-photo-create">
        <div className="section-heading">
          <p className="eyebrow">New Photo</p>
          <h3>新增活动照片</h3>
        </div>

        <form
          className="account-form admin-photo-form"
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            submitCreate(new FormData(formEvent.currentTarget));
            formEvent.currentTarget.reset();
          }}
        >
          <div className="form-grid admin-photo-form-grid">
            <label className="form-field form-field-wide">
              <span>图片路径</span>
              <StorageImageUrlField
                name="image_url"
                eventSlug={eventSlug}
                placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                uploadLabel="上传新图片"
                required
              />
            </label>

            <label className="form-field">
              <span>排序</span>
              <input className="input" type="number" name="sort_order" defaultValue={0} />
            </label>

            <label className="form-field form-field-wide">
              <span>图片说明</span>
              <input
                className="input"
                name="caption"
                placeholder="例如：开场自我介绍 / 圆桌讨论 / 合影"
              />
            </label>
          </div>

          <div className="cta-row">
            <button type="submit" className="button" disabled={isPending}>
              {isPending ? "提交中..." : "添加照片"}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
