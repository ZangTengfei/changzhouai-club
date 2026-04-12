"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  AdminField,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
  AdminStatusBadge,
} from "@/components/admin-ui";
import { StorageImageUrlField } from "@/components/storage-image-url-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader eyebrow="Gallery" title={`${eventTitle} 的照片管理`} />
        <AdminPanelBody className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-[calc(var(--radius)-2px)] border border-border/70 bg-muted/30 p-4">
              <h3 className="text-sm font-semibold text-foreground">当前封面</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                封面图会优先用于活动列表展示。也可以直接把某张活动照片设成封面，减少重复维护。
              </p>
            </div>

            {coverImageUrl ? (
              <div className="overflow-hidden rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background">
                <img
                  src={coverImageUrl}
                  alt={`${eventTitle} 封面`}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                />
                <p className="border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
                  {coverImageUrl}
                </p>
              </div>
            ) : (
              <AdminNotice>暂未设置封面图。</AdminNotice>
            )}
          </div>

          {photos.length > 0 ? (
            <div className="grid gap-4">
              {photos.map((photo) => {
                const isCover = coverImageUrl === photo.image_url;

                return (
                  <div
                    key={photo.id}
                    className="grid gap-4 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4 lg:grid-cols-[320px_minmax(0,1fr)]"
                  >
                    <div className="overflow-hidden rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30">
                      <img
                        src={photo.image_url}
                        alt={photo.caption ?? eventTitle}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <p className="border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
                        {photo.image_url}
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminStatusBadge tone="neutral">排序 {photo.sort_order}</AdminStatusBadge>
                        {isCover ? <AdminStatusBadge tone="completed">当前封面</AdminStatusBadge> : null}
                      </div>

                      <form
                        className="grid gap-4"
                        onSubmit={(formEvent) => {
                          formEvent.preventDefault();
                          submitUpdate(photo.id, new FormData(formEvent.currentTarget));
                        }}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          <AdminField label="图片路径" className="md:col-span-2">
                            <StorageImageUrlField
                              name="image_url"
                              defaultValue={photo.image_url}
                              eventSlug={eventSlug}
                              placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                              uploadLabel="替换图片"
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

                          <AdminField label="图片说明" className="md:col-span-2">
                            <Input
                              name="caption"
                              defaultValue={photo.caption ?? ""}
                              placeholder="例如：现场自由交流 / 成员分享环节"
                            />
                          </AdminField>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" disabled={isPending}>
                            {isPending ? "提交中..." : "保存照片"}
                          </Button>
                          {!isCover ? (
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleSetCover(photo.image_url)}
                              disabled={isPending}
                            >
                              设为封面
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDelete(photo.id)}
                            disabled={isPending}
                          >
                            删除照片
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <AdminNotice>这场活动暂未添加相册照片，可先上传封面或现场照片。</AdminNotice>
          )}
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader eyebrow="New Photo" title="新增活动照片" />
        <AdminPanelBody>
          <form
            className="grid gap-4"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              submitCreate(new FormData(formEvent.currentTarget));
              formEvent.currentTarget.reset();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="图片路径" className="md:col-span-2">
                <StorageImageUrlField
                  name="image_url"
                  eventSlug={eventSlug}
                  placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                  uploadLabel="上传新图片"
                  required
                />
              </AdminField>

              <AdminField label="排序">
                <Input type="number" name="sort_order" defaultValue={0} />
              </AdminField>

              <AdminField label="图片说明" className="md:col-span-2">
                <Input
                  name="caption"
                  placeholder="例如：开场自我介绍 / 圆桌讨论 / 合影"
                />
              </AdminField>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "提交中..." : "添加照片"}
              </Button>
            </div>
          </form>
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
