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

type SponsorImage = {
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

export function AdminSponsorImagesManagerClient({
  sponsorId,
  sponsorSlug,
  sponsorName,
  images,
  onChanged,
}: {
  sponsorId: string;
  sponsorSlug: string;
  sponsorName: string;
  images: SponsorImage[];
  onChanged?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/sponsors/${sponsorId}/images`, {
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
        toast.success(getAdminSavedMessage(result?.saved ?? "sponsor_image") ?? "后台内容已更新。");
        onChanged?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "保存失败，请稍后再试。");
      }
    });
  }

  function submitUpdate(imageId: string, formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/sponsors/${sponsorId}/images/${imageId}`, {
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
        toast.success(getAdminSavedMessage(result?.saved ?? "sponsor_image") ?? "后台内容已更新。");
        onChanged?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "保存失败，请稍后再试。");
      }
    });
  }

  function handleDelete(imageId: string) {
    if (!window.confirm("确认删除这张赞助者图片吗？")) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/sponsors/${sponsorId}/images/${imageId}`, {
          method: "DELETE",
        });
        const result = await readApiResult(response);
        toast.success(
          getAdminSavedMessage(result?.saved ?? "sponsor_image_deleted") ?? "后台内容已更新。",
        );
        onChanged?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "删除失败，请稍后再试。");
      }
    });
  }

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader eyebrow="Gallery" title={`${sponsorName} 的图片管理`} />
        <AdminPanelBody className="space-y-4">
          {images.length > 0 ? (
            <div className="grid gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="grid gap-4 rounded-[calc(var(--radius)-2px)] border border-border/70 bg-background p-4 lg:grid-cols-[320px_minmax(0,1fr)]"
                >
                  <div className="overflow-hidden rounded-[calc(var(--radius)-4px)] border border-border/70 bg-muted/30">
                    <img
                      src={image.image_url}
                      alt={image.caption ?? sponsorName}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <p className="border-t border-border/70 px-3 py-2 text-xs text-muted-foreground">
                      {image.image_url}
                    </p>
                  </div>

                  <form
                    className="grid gap-4"
                    onSubmit={(formEvent) => {
                      formEvent.preventDefault();
                      submitUpdate(image.id, new FormData(formEvent.currentTarget));
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminStatusBadge tone="neutral">排序 {image.sort_order}</AdminStatusBadge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <AdminField label="图片路径" className="md:col-span-2">
                        <StorageImageUrlField
                          name="image_url"
                          defaultValue={image.image_url}
                          eventSlug={sponsorSlug}
                          uploadScope="sponsor"
                          placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                          uploadLabel="替换图片"
                          required
                        />
                      </AdminField>

                      <AdminField label="排序">
                        <Input type="number" name="sort_order" defaultValue={image.sort_order} />
                      </AdminField>

                      <AdminField label="图片说明" className="md:col-span-2">
                        <Input
                          name="caption"
                          defaultValue={image.caption ?? ""}
                          placeholder="例如：活动现场支持 / 空间照片 / 赞助者合影"
                        />
                      </AdminField>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={isPending}>
                        {isPending ? "提交中..." : "保存图片"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDelete(image.id)}
                        disabled={isPending}
                      >
                        删除图片
                      </Button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <AdminNotice>这个赞助者暂未添加详情图片，可先上传空间、活动或共建相关图片。</AdminNotice>
          )}
        </AdminPanelBody>
      </AdminPanel>

      <AdminPanel>
        <AdminPanelHeader eyebrow="New Image" title="新增赞助者图片" />
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
                  eventSlug={sponsorSlug}
                  uploadScope="sponsor"
                  placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                  uploadLabel="上传新图片"
                  required
                />
              </AdminField>

              <AdminField label="排序">
                <Input type="number" name="sort_order" defaultValue={0} />
              </AdminField>

              <AdminField label="图片说明" className="md:col-span-2">
                <Input name="caption" placeholder="例如：活动现场支持 / 空间照片 / 赞助者合影" />
              </AdminField>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "提交中..." : "添加图片"}
              </Button>
            </div>
          </form>
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
