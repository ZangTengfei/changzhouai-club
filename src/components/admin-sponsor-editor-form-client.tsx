"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  AdminCheckboxRow,
  AdminField,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/components/admin-ui";
import { StorageImageUrlField } from "@/components/storage-image-url-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getAdminErrorMessage, getAdminSavedMessage } from "@/lib/admin/event-feedback";

type EditableAdminSponsor = {
  id: string;
  slug: string;
  name: string;
  tier: "core" | "partner" | "supporter";
  sponsor_label: string | null;
  logo_url: string | null;
  summary: string | null;
  description: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
};

function toPayload(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    tier: String(formData.get("tier") ?? "supporter"),
    sponsor_label: String(formData.get("sponsor_label") ?? ""),
    logo_url: String(formData.get("logo_url") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    description: String(formData.get("description") ?? ""),
    website_url: String(formData.get("website_url") ?? ""),
    display_order: String(formData.get("display_order") ?? "0"),
    is_active: formData.get("is_active") === "on",
  };
}

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; saved?: string; sponsorId?: string }
    | null;

  if (!response.ok) {
    throw new Error(getAdminErrorMessage(payload?.error) ?? "提交失败，请稍后再试。");
  }

  return payload;
}

export function AdminSponsorEditorFormClient({
  sponsor,
  onSaved,
  onCreated,
  onDeleted,
}: {
  sponsor?: EditableAdminSponsor;
  onSaved?: () => void;
  onCreated?: (sponsorId: string) => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(sponsor);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(
          isEditing ? `/api/admin/sponsors/${sponsor?.id}` : "/api/admin/sponsors",
          {
            method: isEditing ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(toPayload(formData)),
          },
        );
        const result = await readApiResult(response);

        if (!isEditing && result?.sponsorId) {
          if (onCreated) {
            toast.success(getAdminSavedMessage(result?.saved ?? "sponsor") ?? "后台内容已更新。");
            onCreated(result.sponsorId);
          } else {
            router.push(`/admin/sponsors/${result.sponsorId}`);
          }
          return;
        }

        toast.success(getAdminSavedMessage(result?.saved ?? "sponsor") ?? "后台内容已更新。");
        onSaved?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "提交失败，请稍后再试。");
      }
    });
  }

  function handleDelete() {
    if (!sponsor || !window.confirm(`确认删除赞助者“${sponsor.name}”吗？`)) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/sponsors/${sponsor.id}`, {
          method: "DELETE",
        });
        const result = await readApiResult(response);
        if (onDeleted) {
          toast.success(
            getAdminSavedMessage(result?.saved ?? "sponsor_deleted") ?? "后台内容已更新。",
          );
          onDeleted();
          return;
        }

        router.push(`/admin/sponsors?saved=${result?.saved ?? "sponsor_deleted"}`);
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "删除失败，请稍后再试。");
      }
    });
  }

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow={isEditing ? "Edit Sponsor" : "New Sponsor"}
          title={isEditing ? `编辑：${sponsor?.name}` : "赞助者信息"}
        />
        <AdminPanelBody className="space-y-4">
          <form
            className="grid gap-4"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              handleSubmit(new FormData(formEvent.currentTarget));
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="赞助者名称">
                <Input
                  name="name"
                  defaultValue={sponsor?.name ?? ""}
                  placeholder="例如：常州电信"
                  required
                />
              </AdminField>

              <AdminField label="赞助者 slug">
                <Input
                  name="slug"
                  defaultValue={sponsor?.slug ?? ""}
                  placeholder="例如：changzhou-telecom"
                />
              </AdminField>

              <AdminField label="赞助标签">
                <Input
                  name="sponsor_label"
                  defaultValue={sponsor?.sponsor_label ?? ""}
                  placeholder="例如：首位赞助者 / 社区共建伙伴"
                />
              </AdminField>

              <AdminField label="赞助等级">
                <NativeSelect name="tier" defaultValue={sponsor?.tier ?? "supporter"}>
                  <option value="core">核心赞助者：Logo + 名称 + 简介</option>
                  <option value="partner">共建伙伴：Logo + 名称</option>
                  <option value="supporter">支持伙伴：仅 Logo</option>
                </NativeSelect>
              </AdminField>

              <AdminField label="展示排序">
                <Input
                  type="number"
                  name="display_order"
                  defaultValue={sponsor?.display_order ?? 0}
                />
              </AdminField>

              <AdminField label="Logo 路径" className="md:col-span-2">
                <StorageImageUrlField
                  name="logo_url"
                  defaultValue={sponsor?.logo_url ?? ""}
                  eventSlug={sponsor?.slug ?? ""}
                  uploadScope="sponsor"
                  placeholder="/china-telecom-logo.svg 或 Supabase Storage 图片地址"
                  uploadLabel="上传 Logo"
                />
              </AdminField>

              <AdminField label="官网或外部链接" className="md:col-span-2">
                <Input
                  name="website_url"
                  defaultValue={sponsor?.website_url ?? ""}
                  placeholder="https://..."
                />
              </AdminField>

              <AdminField label="一句话介绍" className="md:col-span-2">
                <Input
                  name="summary"
                  defaultValue={sponsor?.summary ?? ""}
                  placeholder="用于首页赞助者卡片展示"
                />
              </AdminField>

              <AdminField label="详细介绍" className="md:col-span-2">
                <Textarea
                  name="description"
                  defaultValue={sponsor?.description ?? ""}
                  rows={5}
                  placeholder="可分段输入赞助者信息、支持方式与共建关系。"
                />
              </AdminField>

              <AdminCheckboxRow className="md:col-span-2">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={sponsor?.is_active ?? true}
                  className="size-4"
                />
                <span>在公开页面展示这个赞助者</span>
              </AdminCheckboxRow>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "提交中..." : isEditing ? "保存赞助者" : "创建赞助者"}
              </Button>
              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  删除赞助者
                </Button>
              ) : null}
            </div>
          </form>

          {isEditing ? (
            <AdminNotice>编辑完成后会刷新赞助者详情页和首页赞助者区域。</AdminNotice>
          ) : null}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
