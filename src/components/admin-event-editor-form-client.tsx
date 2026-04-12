"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { StorageImageUrlField } from "@/components/storage-image-url-field";
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = Boolean(event);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setFeedback(null);
      setError(null);

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

        setFeedback(getAdminSavedMessage(result?.saved ?? "event"));
        onSaved?.();
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "提交失败，请稍后再试。",
        );
      }
    });
  }

  function handleDelete() {
    if (!event || !window.confirm(`确认删除活动“${event.title}”吗？`)) {
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      setError(null);

      try {
        const response = await fetch(`/api/admin/events/${event.id}`, {
          method: "DELETE",
        });
        const result = await readApiResult(response);
        router.push(`/admin/events?saved=${result?.saved ?? "deleted"}`);
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : "删除失败，请稍后再试。",
        );
      }
    });
  }

  return (
    <article className="surface admin-card">
      <div className="section-heading">
        <p className="eyebrow">{isEditing ? "Edit Event" : "New Event"}</p>
        <h2>{isEditing ? `编辑：${event?.title}` : "新建活动"}</h2>
        <p>在这里维护活动标题、时间、介绍、议程与展示素材，确保公开页面信息完整清晰。</p>
      </div>

      {feedback ? <div className="note-strip">{feedback}</div> : null}
      {error ? <div className="note-strip">{error}</div> : null}

      <form
        className="account-form"
        onSubmit={(formEvent) => {
          formEvent.preventDefault();
          handleSubmit(new FormData(formEvent.currentTarget));
        }}
      >
        <div className="form-grid">
          <label className="form-field">
            <span>活动标题</span>
            <input
              className="input"
              name="title"
              defaultValue={event?.title ?? ""}
              placeholder="例如：第 7 场线下交流"
              required
            />
          </label>

          <label className="form-field">
            <span>活动 slug</span>
            <input
              className="input"
              name="slug"
              defaultValue={event?.slug ?? ""}
              placeholder="例如：event-07-20260405"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>活动简介</span>
            <input
              className="input"
              name="summary"
              defaultValue={event?.summary ?? ""}
              placeholder="一句话说明这场活动的主题和形式"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>详细说明</span>
            <textarea
              className="input textarea"
              name="description"
              defaultValue={event?.description ?? ""}
              rows={4}
              placeholder="可选：写更详细的活动内容、议题安排和适合人群。"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>议程安排</span>
            <textarea
              className="input textarea"
              name="agenda"
              defaultValue={event?.agenda ?? ""}
              rows={5}
              placeholder={"一行一项，例如：\n19:30 签到与自由交流\n20:00 主题分享\n20:40 Demo 展示与问答"}
            />
          </label>

          <label className="form-field form-field-wide">
            <span>分享人与组织者</span>
            <textarea
              className="input textarea"
              name="speaker_lineup"
              defaultValue={event?.speaker_lineup ?? ""}
              rows={4}
              placeholder={"一行一项，例如：\n分享：某位社区成员 / AI Agent 工作流\n主持：社区组织者"}
            />
          </label>

          <label className="form-field form-field-wide">
            <span>报名提示</span>
            <textarea
              className="input textarea"
              name="registration_note"
              defaultValue={event?.registration_note ?? ""}
              rows={3}
              placeholder="例如：本场人数有限，请报名后按时参加；现场欢迎自带项目和问题来交流。"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>活动回顾</span>
            <textarea
              className="input textarea"
              name="recap"
              defaultValue={event?.recap ?? ""}
              rows={5}
              placeholder={"适合用于活动结束后的内容沉淀。支持分段输入，例如：\n\n这场活动主要围绕...\n\n现场讨论比较集中的问题包括..."}
            />
          </label>

          <label className="form-field">
            <span>活动时间</span>
            <input
              className="input"
              type="datetime-local"
              name="event_at"
              defaultValue={toDatetimeLocal(event?.event_at ?? null)}
            />
          </label>

          <label className="form-field">
            <span>活动状态</span>
            <select className="input" name="status" defaultValue={event?.status ?? "draft"}>
              <option value="draft">draft</option>
              <option value="scheduled">scheduled</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          <label className="form-field">
            <span>地点</span>
            <input
              className="input"
              name="venue"
              defaultValue={event?.venue ?? ""}
              placeholder="例如：常州某咖啡馆 / 共享空间"
            />
          </label>

          <label className="form-field">
            <span>城市</span>
            <input
              className="input"
              name="city"
              defaultValue={event?.city ?? "常州"}
              placeholder="常州"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>封面图路径</span>
            <StorageImageUrlField
              name="cover_image_url"
              defaultValue={event?.cover_image_url ?? ""}
              eventSlug={event?.slug ?? ""}
              placeholder="https://mahvssiotvstqlenurvh.supabase.co/storage/v1/object/public/event-assets/..."
              uploadLabel="上传封面"
            />
          </label>
        </div>

        <div className="cta-row">
          <button type="submit" className="button" disabled={isPending}>
            {isPending ? "提交中..." : isEditing ? "保存活动" : "创建活动"}
          </button>
        </div>
      </form>

      {isEditing ? (
        <div className="admin-delete-form">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleDelete}
            disabled={isPending}
          >
            删除这场活动
          </button>
        </div>
      ) : null}
    </article>
  );
}
