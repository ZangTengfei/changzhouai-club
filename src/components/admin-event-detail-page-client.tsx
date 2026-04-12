"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AdminEventEditorFormClient } from "@/components/admin-event-editor-form-client";
import { AdminEventPhotosManagerClient } from "@/components/admin-event-photos-manager-client";
import { useAdminResource } from "@/components/use-admin-resource";
import {
  formatAdminEventDate,
  formatAdminEventStatus,
  formatAdminRegistrationStatus,
  getAdminErrorMessage,
  getAdminEventStatusTone,
  getAdminRegistrationStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import type { AdminEvent } from "@/lib/admin/events";

type AdminEventDetailData = {
  event: AdminEvent;
  queryErrors: string[];
};

export function AdminEventDetailPageClient({
  eventId,
  mode = "page",
  onCloseRequest,
  onEventMutated,
}: {
  eventId: string;
  mode?: "page" | "modal";
  onCloseRequest?: () => void;
  onEventMutated?: () => void;
}) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, reload } = useAdminResource<AdminEventDetailData>(
    `/api/admin/events/${eventId}`,
  );
  const saved = searchParams.get("saved") ?? undefined;
  const queryError = searchParams.get("error") ?? undefined;
  const eventDetail = data?.event;
  const isModal = mode === "modal";

  function handleEventMutated() {
    reload();
    onEventMutated?.();
  }

  function handleEventDeleted() {
    onCloseRequest?.();
    handleEventMutated();
  }

  return (
    <div
      className={
        isModal
          ? "admin-page-stack admin-detail-stack admin-detail-stack-modal"
          : "admin-page-stack admin-detail-stack"
      }
    >
      {eventDetail ? (
        <section className="surface admin-card">
          <div className="admin-toolbar">
            <div className="section-heading">
              <p className="eyebrow">Event Detail</p>
              <h2>{eventDetail.title}</h2>
              <p>集中维护这场活动的基本信息、相册内容与报名名单。</p>
            </div>

            <div className="admin-toolbar-side">
              <div className="admin-mini-stat">
                <strong>{eventDetail.registrations.length}</strong>
                <span>当前报名</span>
              </div>

              <div className="cta-row">
                <Link
                  href={`/events/${eventDetail.slug}`}
                  className="button"
                  target="_blank"
                  rel="noreferrer"
                >
                  查看公开页
                </Link>
                {isModal ? (
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={onCloseRequest}
                  >
                    关闭详情
                  </button>
                ) : (
                  <Link href="/admin/events" className="button button-secondary">
                    返回活动列表
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="pill-row">
            <span
              className={`pill admin-status-pill admin-status-pill-${getAdminEventStatusTone(
                eventDetail.status,
              )}`}
            >
              {formatAdminEventStatus(eventDetail.status)}
            </span>
            <span className="pill">{formatAdminEventDate(eventDetail.event_at)}</span>
            <span className="pill">照片 {eventDetail.photos.length}</span>
            <span className="pill">报名 {eventDetail.registrations.length}</span>
          </div>
        </section>
      ) : null}

      {saved ? <div className="note-strip">{getAdminSavedMessage(saved)}</div> : null}
      {queryError ? <div className="note-strip">{getAdminErrorMessage(queryError)}</div> : null}
      {error ? <div className="note-strip">后台数据读取出现问题：{error}</div> : null}
      {data && data.queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{data.queryErrors.join(" | ")}</div>
      ) : null}

      {isLoading ? <div className="note-strip">正在加载活动详情...</div> : null}

      {eventDetail ? (
        <>
          <AdminEventEditorFormClient
            event={eventDetail}
            onSaved={handleEventMutated}
            onDeleted={handleEventDeleted}
          />

          <AdminEventPhotosManagerClient
            eventId={eventDetail.id}
            eventSlug={eventDetail.slug}
            eventTitle={eventDetail.title}
            coverImageUrl={eventDetail.cover_image_url}
            photos={eventDetail.photos}
            onChanged={handleEventMutated}
          />

          <section className="surface admin-card">
            <div className="section-heading">
              <p className="eyebrow">Registrations</p>
              <h2>{eventDetail.title} 的报名名单</h2>
              <p>
                当前报名数：{eventDetail.registrations.length}，可在这里查看成员信息与报名备注。
              </p>
            </div>

            {eventDetail.registrations.length > 0 ? (
              <div className="admin-list">
                <div className="admin-list-header admin-registration-list-grid">
                  <span>成员</span>
                  <span>联系信息</span>
                  <span>状态</span>
                  <span>报名时间</span>
                  <span>备注</span>
                </div>

                {eventDetail.registrations.map((registration) => (
                  <article
                    className="admin-list-row admin-registration-list-grid"
                    key={registration.id}
                  >
                    <div className="admin-list-primary">
                      <h3 className="admin-list-title">
                        {registration.profile?.display_name ?? "未填写显示名"}
                      </h3>
                      <p className="admin-compact-note">用户 ID: {registration.user_id}</p>
                    </div>

                    <div className="admin-list-cell">
                      <span>{registration.profile?.email ?? "未提供邮箱"}</span>
                      <span>{registration.profile?.city ?? "未填写城市"}</span>
                    </div>

                    <div className="admin-list-cell">
                      <span
                        className={`pill admin-registration-pill admin-registration-pill-${getAdminRegistrationStatusTone(
                          registration.status,
                        )}`}
                      >
                        {formatAdminRegistrationStatus(registration.status)}
                      </span>
                    </div>

                    <div className="admin-list-cell">
                      <span>{new Date(registration.created_at).toLocaleString("zh-CN")}</span>
                    </div>

                    <div className="admin-list-cell">
                      <span>{registration.note ?? "无备注"}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="note-strip">这场活动暂时还没有报名记录。</div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
