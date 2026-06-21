"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "antd";
import { toast } from "sonner";

import {
  AdminField,
  AdminNotice,
  AdminPageStack,
  AdminPanel,
  AdminPanelBody,
  AdminPanelHeader,
} from "@/components/admin-antd";
import { StorageImageUrlField } from "@/components/storage-image-url-field";
import { NativeSelect } from "@/components/admin-antd";
import { getAdminErrorMessage, getAdminSavedMessage } from "@/lib/admin/event-feedback";

const { TextArea } = Input;

type EditableAdminEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  agenda: string | null;
  speaker_lineup: string | null;
  registration_note: string | null;
  registration_url: string | null;
  event_type: string;
  recap: string | null;
  docs_url: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  video_provider: string | null;
  video_file_id: string | null;
  video_title: string | null;
  video_cover_url: string | null;
  status: string;
};

function toDatetimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}

function toPayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    summary: String(formData.get("summary") ?? ""),
    description: String(formData.get("description") ?? ""),
    agenda: String(formData.get("agenda") ?? ""),
    speaker_lineup: String(formData.get("speaker_lineup") ?? ""),
    registration_note: String(formData.get("registration_note") ?? ""),
    registration_url: String(formData.get("registration_url") ?? ""),
    event_type: String(formData.get("event_type") ?? "community").trim(),
    recap: String(formData.get("recap") ?? ""),
    docs_url: String(formData.get("docs_url") ?? ""),
    event_at: String(formData.get("event_at") ?? "").trim(),
    venue: String(formData.get("venue") ?? ""),
    city: String(formData.get("city") ?? ""),
    cover_image_url: String(formData.get("cover_image_url") ?? ""),
    video_url: String(formData.get("video_url") ?? ""),
    video_provider: String(formData.get("video_provider") ?? ""),
    video_file_id: String(formData.get("video_file_id") ?? ""),
    video_title: String(formData.get("video_title") ?? ""),
    video_cover_url: String(formData.get("video_cover_url") ?? ""),
    status: String(formData.get("status") ?? "draft").trim(),
  };
}

async function readApiResult(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; saved?: string; eventId?: string }
    | null;

  if (!response.ok) {
    throw new Error(getAdminErrorMessage(payload?.error) ?? "提交失败，请稍后再试。");
  }

  return payload;
}

export function AdminEventEditorFormClient({
  event,
  onSaved,
  onCreated,
  onDeleted,
}: {
  event?: EditableAdminEvent;
  onSaved?: () => void;
  onCreated?: (eventId: string) => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(event);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const response = await fetch(
          isEditing ? `/api/admin/events/${event?.id}` : "/api/admin/events",
          {
            method: isEditing ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(toPayload(formData)),
          },
        );
        const result = await readApiResult(response);

        if (!isEditing && result?.eventId) {
          if (onCreated) {
            toast.success(getAdminSavedMessage(result?.saved ?? "event") ?? "后台内容已更新。");
            onCreated(result.eventId);
          } else {
            router.push(`/admin/events/${result.eventId}`);
          }
          return;
        }

        toast.success(getAdminSavedMessage(result?.saved ?? "event") ?? "后台内容已更新。");
        onSaved?.();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "提交失败，请稍后再试。");
      }
    });
  }

  function handleDelete() {
    if (!event || !window.confirm(`确认删除活动“${event.title}”吗？`)) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/events/${event.id}`, {
          method: "DELETE",
        });
        const result = await readApiResult(response);
        if (onDeleted) {
          toast.success(getAdminSavedMessage(result?.saved ?? "deleted") ?? "后台内容已更新。");
          onDeleted();
          return;
        }

        router.push(`/admin/events?saved=${result?.saved ?? "deleted"}`);
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "删除失败，请稍后再试。");
      }
    });
  }

  return (
    <AdminPageStack>
      <AdminPanel>
        <AdminPanelHeader
          eyebrow={isEditing ? "Edit Event" : "New Event"}
          title={isEditing ? `编辑：${event?.title}` : "活动信息"}
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
              <AdminField label="活动标题">
                <Input
                  name="title"
                  defaultValue={event?.title ?? ""}
                  placeholder="例如：第 7 场线下交流"
                  required
                />
              </AdminField>

              <AdminField label="活动 slug">
                <Input
                  name="slug"
                  defaultValue={event?.slug ?? ""}
                  placeholder="例如：event-07-20260405"
                />
              </AdminField>

              <AdminField label="活动类型">
                <NativeSelect name="event_type" defaultValue={event?.event_type ?? "community"}>
                  <option value="community">社区活动</option>
                  <option value="external">外部活动</option>
                </NativeSelect>
              </AdminField>

              <AdminField label="活动简介" className="md:col-span-2">
                <Input
                  name="summary"
                  defaultValue={event?.summary ?? ""}
                  placeholder="一句话说明这场活动的主题和形式"
                />
              </AdminField>

              <AdminField label="详细说明" className="md:col-span-2">
                <TextArea
                  name="description"
                  defaultValue={event?.description ?? ""}
                  rows={4}
                  placeholder="可选：写更详细的活动内容、议题安排和适合人群。"
                />
              </AdminField>

              <AdminField label="议程安排" className="md:col-span-2">
                <TextArea
                  name="agenda"
                  defaultValue={event?.agenda ?? ""}
                  rows={5}
                  placeholder={"一行一项，例如：\n19:30 签到与自由交流\n20:00 主题分享\n20:40 Demo 展示与问答"}
                />
              </AdminField>

              <AdminField label="分享人与组织者" className="md:col-span-2">
                <TextArea
                  name="speaker_lineup"
                  defaultValue={event?.speaker_lineup ?? ""}
                  rows={4}
                  placeholder={"一行一项，例如：\n分享：某位社区成员 / AI Agent 工作流\n主持：社区组织者"}
                />
              </AdminField>

              <AdminField label="报名提示" className="md:col-span-2">
                <TextArea
                  name="registration_note"
                  defaultValue={event?.registration_note ?? ""}
                  rows={3}
                  placeholder="例如：本场人数有限，请报名后按时参加；现场欢迎自带项目和问题来交流。"
                />
              </AdminField>

              <AdminField label="外部报名链接" className="md:col-span-2">
                <Input
                  name="registration_url"
                  defaultValue={event?.registration_url ?? ""}
                  placeholder="例如：https://senseleap.feishu.cn/share/base/form/..."
                />
              </AdminField>

              <AdminField label="活动回顾" className="md:col-span-2">
                <TextArea
                  name="recap"
                  defaultValue={event?.recap ?? ""}
                  rows={5}
                  placeholder={"适合用于活动结束后的内容沉淀。支持分段输入，例如：\n\n这场活动主要围绕...\n\n现场讨论比较集中的问题包括..."}
                />
              </AdminField>

              <AdminField label="活动文档链接" className="md:col-span-2">
                <Input
                  name="docs_url"
                  defaultValue={event?.docs_url ?? ""}
                  placeholder="/docs/events/2026-04-25-ai-salon 或飞书文档链接"
                />
              </AdminField>

              <AdminField label="视频播放地址" className="md:col-span-2">
                <Input
                  name="video_url"
                  defaultValue={event?.video_url ?? ""}
                  placeholder="例如：https://.../video.mp4"
                />
              </AdminField>

              <AdminField label="视频来源">
                <NativeSelect name="video_provider" defaultValue={event?.video_provider ?? ""}>
                  <option value="">未设置</option>
                  <option value="tencent_vod">腾讯云 VOD</option>
                  <option value="mp4">MP4 直链</option>
                </NativeSelect>
              </AdminField>

              <AdminField label="视频 FileId">
                <Input
                  name="video_file_id"
                  defaultValue={event?.video_file_id ?? ""}
                  placeholder="腾讯云 VOD FileId"
                />
              </AdminField>

              <AdminField label="视频标题" className="md:col-span-2">
                <Input
                  name="video_title"
                  defaultValue={event?.video_title ?? ""}
                  placeholder="例如：AI + 外贸主题沙龙活动视频"
                />
              </AdminField>

              <AdminField label="视频封面图" className="md:col-span-2">
                <Input
                  name="video_cover_url"
                  defaultValue={event?.video_cover_url ?? ""}
                  placeholder="不填时默认使用活动封面"
                />
              </AdminField>

              <AdminField label="活动时间">
                <Input
                  type="datetime-local"
                  name="event_at"
                  defaultValue={toDatetimeLocal(event?.event_at ?? null)}
                />
              </AdminField>

              <AdminField label="活动状态">
                <NativeSelect name="status" defaultValue={event?.status ?? "draft"}>
                  <option value="draft">draft</option>
                  <option value="scheduled">scheduled</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </NativeSelect>
              </AdminField>

              <AdminField label="地点">
                <Input
                  name="venue"
                  defaultValue={event?.venue ?? ""}
                  placeholder="例如：常州某咖啡馆 / 共享空间"
                />
              </AdminField>

              <AdminField label="城市">
                <Input
                  name="city"
                  defaultValue={event?.city ?? "常州"}
                  placeholder="常州"
                />
              </AdminField>

              <AdminField label="封面图路径" className="md:col-span-2">
                <StorageImageUrlField
                  name="cover_image_url"
                  defaultValue={event?.cover_image_url ?? ""}
                  eventSlug={event?.slug ?? ""}
                  mode="upload-only"
                  placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                  uploadLabel="上传封面"
                  clearLabel="移除封面"
                  filledStatusText="已设置封面"
                  emptyStatusText="当前未设置封面"
                />
              </AdminField>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button htmlType="submit" type="primary" disabled={isPending}>
                {isPending ? "提交中..." : isEditing ? "保存活动" : "创建活动"}
              </Button>
              {isEditing ? (
                <Button
                  htmlType="button"
                  danger
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  删除这场活动
                </Button>
              ) : null}
            </div>
          </form>

          {isEditing ? (
            <AdminNotice>编辑完成后会直接刷新当前活动详情，无需跳转到新页面。</AdminNotice>
          ) : null}
        </AdminPanelBody>
      </AdminPanel>
    </AdminPageStack>
  );
}
