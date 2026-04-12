"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
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

type EditableAdminEvent = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  agenda: string | null;
  speaker_lineup: string | null;
  registration_note: string | null;
  recap: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
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
    recap: String(formData.get("recap") ?? ""),
    event_at: String(formData.get("event_at") ?? "").trim(),
    venue: String(formData.get("venue") ?? ""),
    city: String(formData.get("city") ?? ""),
    cover_image_url: String(formData.get("cover_image_url") ?? ""),
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
}: {
  event?: EditableAdminEvent;
  onSaved?: () => void;
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
          router.push(`/admin/events/${result.eventId}`);
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

              <AdminField label="活动简介" className="md:col-span-2">
                <Input
                  name="summary"
                  defaultValue={event?.summary ?? ""}
                  placeholder="一句话说明这场活动的主题和形式"
                />
              </AdminField>

              <AdminField label="详细说明" className="md:col-span-2">
                <Textarea
                  name="description"
                  defaultValue={event?.description ?? ""}
                  rows={4}
                  placeholder="可选：写更详细的活动内容、议题安排和适合人群。"
                />
              </AdminField>

              <AdminField label="议程安排" className="md:col-span-2">
                <Textarea
                  name="agenda"
                  defaultValue={event?.agenda ?? ""}
                  rows={5}
                  placeholder={"一行一项，例如：\n19:30 签到与自由交流\n20:00 主题分享\n20:40 Demo 展示与问答"}
                />
              </AdminField>

              <AdminField label="分享人与组织者" className="md:col-span-2">
                <Textarea
                  name="speaker_lineup"
                  defaultValue={event?.speaker_lineup ?? ""}
                  rows={4}
                  placeholder={"一行一项，例如：\n分享：某位社区成员 / AI Agent 工作流\n主持：社区组织者"}
                />
              </AdminField>

              <AdminField label="报名提示" className="md:col-span-2">
                <Textarea
                  name="registration_note"
                  defaultValue={event?.registration_note ?? ""}
                  rows={3}
                  placeholder="例如：本场人数有限，请报名后按时参加；现场欢迎自带项目和问题来交流。"
                />
              </AdminField>

              <AdminField label="活动回顾" className="md:col-span-2">
                <Textarea
                  name="recap"
                  defaultValue={event?.recap ?? ""}
                  rows={5}
                  placeholder={"适合用于活动结束后的内容沉淀。支持分段输入，例如：\n\n这场活动主要围绕...\n\n现场讨论比较集中的问题包括..."}
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
                  placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
                  uploadLabel="上传封面"
                />
              </AdminField>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "提交中..." : isEditing ? "保存活动" : "创建活动"}
              </Button>
              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
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
