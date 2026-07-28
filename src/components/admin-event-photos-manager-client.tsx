"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  AdminField,
  AdminNotice,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { StorageImageUrlField } from "@/components/storage-image-url-field";
import { Button } from "@/components/admin-antd/button";
import { Input } from "@/components/admin-antd/input";
import {
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";

type EventPhoto = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    saved?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      getAdminErrorMessage(payload?.error) ?? "提交失败，请稍后再试。",
    );
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
        toast.success(
          getAdminSavedMessage(result?.saved ?? "photo") ?? "后台内容已更新。",
        );
        onChanged?.();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : "保存失败，请稍后再试。",
        );
      }
    });
  }

  function submitUpdate(photoId: string, formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/events/${eventId}/photos/${photoId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image_url: String(formData.get("image_url") ?? ""),
              caption: String(formData.get("caption") ?? ""),
              sort_order: String(formData.get("sort_order") ?? "0"),
            }),
          },
        );
        const result = await readApiResult(response);
        toast.success(
          getAdminSavedMessage(result?.saved ?? "photo") ?? "后台内容已更新。",
        );
        onChanged?.();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : "保存失败，请稍后再试。",
        );
      }
    });
  }

  function handleDelete(photoId: string) {
    if (!window.confirm("确认删除这张活动照片吗？")) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/admin/events/${eventId}/photos/${photoId}`,
          {
            method: "DELETE",
          },
        );
        const result = await readApiResult(response);
        toast.success(
          getAdminSavedMessage(result?.saved ?? "photo_deleted") ??
            "后台内容已更新。",
        );
        onChanged?.();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : "删除失败，请稍后再试。",
        );
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
        toast.success(
          getAdminSavedMessage(result?.saved ?? "cover") ?? "后台内容已更新。",
        );
        onChanged?.();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error
            ? submitError.message
            : "更新失败，请稍后再试。",
        );
      }
    });
  }

  return (
    <AdminPanel>
      <AdminPanelHeader
        eyebrow="Gallery"
        title="照片与封面"
        actions={
          <AdminStatusBadge tone="neutral">
            共 {photos.length} 张
          </AdminStatusBadge>
        }
      />
      <AdminPanelBody className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-muted/30 p-3 sm:flex-row sm:items-center">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={`${eventTitle} 封面`}
              loading="lazy"
              className="aspect-[16/10] w-full rounded-md border border-border/70 object-cover sm:w-40"
            />
          ) : (
            <div className="grid aspect-[16/10] w-full place-items-center rounded-md border border-dashed border-border bg-white text-sm text-muted-foreground sm:w-40">
              暂无封面
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              当前活动封面
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              从下方照片中选择“设为封面”，无需重复上传。
            </p>
          </div>
        </div>

        <details className="rounded-lg border border-blue-200 bg-blue-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-blue-700">
            ＋ 添加活动照片
          </summary>
          <form
            className="grid gap-4 border-t border-blue-100 bg-white p-4"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              submitCreate(new FormData(formEvent.currentTarget));
              formEvent.currentTarget.reset();
            }}
          >
            <AdminField label="图片">
              <StorageImageUrlField
                name="image_url"
                eventSlug={eventSlug}
                mode="upload-only"
                placeholder="https://assets.changzhouai.club/event-assets/..."
                uploadLabel="上传新图片"
                clearLabel="清空图片"
                filledStatusText="已设置图片"
                emptyStatusText="当前未设置图片"
                required
              />
            </AdminField>
            <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
              <AdminField label="排序">
                <Input type="number" name="sort_order" defaultValue={0} />
              </AdminField>
              <AdminField label="图片说明">
                <Input name="caption" placeholder="例如：圆桌讨论 / 活动合影" />
              </AdminField>
            </div>
            <div>
              <Button type="submit" disabled={isPending}>
                {isPending ? "提交中..." : "添加照片"}
              </Button>
            </div>
          </form>
        </details>

        {photos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {photos.map((photo) => {
              const isCover = coverImageUrl === photo.image_url;

              return (
                <article
                  key={photo.id}
                  className="overflow-hidden rounded-lg border border-border/70 bg-white"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? eventTitle}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div className="grid gap-3 border-t border-border/70 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone="neutral">
                        排序 {photo.sort_order}
                      </AdminStatusBadge>
                      {isCover ? (
                        <AdminStatusBadge tone="completed">
                          当前封面
                        </AdminStatusBadge>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                      {photo.caption || "未填写图片说明"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {!isCover ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetCover(photo.image_url)}
                          disabled={isPending}
                        >
                          设为封面
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(photo.id)}
                        disabled={isPending}
                      >
                        删除
                      </Button>
                    </div>
                    <details className="rounded-md border border-border/70 bg-muted/20">
                      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-foreground">
                        编辑照片信息
                      </summary>
                      <form
                        className="grid gap-3 border-t border-border/70 bg-white p-3"
                        onSubmit={(formEvent) => {
                          formEvent.preventDefault();
                          submitUpdate(
                            photo.id,
                            new FormData(formEvent.currentTarget),
                          );
                        }}
                      >
                        <AdminField label="图片">
                          <StorageImageUrlField
                            name="image_url"
                            defaultValue={photo.image_url}
                            eventSlug={eventSlug}
                            mode="upload-only"
                            placeholder="https://assets.changzhouai.club/event-assets/..."
                            uploadLabel="替换图片"
                            clearLabel="清空图片"
                            filledStatusText="已设置图片"
                            emptyStatusText="当前未设置图片"
                            required
                          />
                        </AdminField>
                        <AdminField label="排序">
                          <Input
                            type="number"
                            name="sort_order"
                            defaultValue={photo.sort_order}
                          />
                        </AdminField>
                        <AdminField label="图片说明">
                          <Input
                            name="caption"
                            defaultValue={photo.caption ?? ""}
                            placeholder="例如：成员分享环节"
                          />
                        </AdminField>
                        <div>
                          <Button type="submit" disabled={isPending}>
                            {isPending ? "保存中..." : "保存照片"}
                          </Button>
                        </div>
                      </form>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <AdminNotice>这场活动暂未添加现场照片。</AdminNotice>
        )}
      </AdminPanelBody>
    </AdminPanel>
  );
}
