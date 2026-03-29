import type { Metadata } from "next";
import Link from "next/link";

import { AdminEventForm } from "@/components/admin-event-form";
import { AdminEventPhotosManager } from "@/components/admin-event-photos-manager";
import {
  formatAdminEventDate,
  formatAdminEventStatus,
  formatAdminRegistrationStatus,
  getAdminEventStatusTone,
  getAdminErrorMessage,
  getAdminRegistrationStatusTone,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminEventOrThrow } from "@/lib/admin/events";

export const metadata: Metadata = {
  title: "活动详情",
  description: "编辑活动、管理相册并查看报名名单。",
};

type SearchParams = {
  saved?: string;
  error?: string;
};

export default async function AdminEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [routeParams, query] = await Promise.all([params, searchParams]);
  const { event: eventDetail, queryErrors } = await loadAdminEventOrThrow(
    routeParams.eventId,
  );

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Event Detail</p>
            <h2>{eventDetail.title}</h2>
            <p>
              单场活动详情页负责编辑活动信息、相册内容和报名名单，避免后台首页变成一条超长工作台。
            </p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>{eventDetail.registrations.length}</strong>
              <span>当前报名</span>
            </div>

            <Link href="/admin/events" className="button button-secondary">
              返回活动列表
            </Link>
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

      {query.saved ? (
        <div className="note-strip">{getAdminSavedMessage(query.saved)}</div>
      ) : null}

      {query.error ? (
        <div className="note-strip">{getAdminErrorMessage(query.error)}</div>
      ) : null}

      {queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{queryErrors.join(" | ")}</div>
      ) : null}

      <AdminEventForm event={eventDetail} />

      <AdminEventPhotosManager
        eventId={eventDetail.id}
        eventSlug={eventDetail.slug}
        eventTitle={eventDetail.title}
        coverImageUrl={eventDetail.cover_image_url}
        photos={eventDetail.photos}
      />

      <section className="surface admin-card">
        <div className="section-heading">
          <p className="eyebrow">Registrations</p>
          <h2>{eventDetail.title} 的报名名单</h2>
          <p>
            当前报名数：{eventDetail.registrations.length}
            。这一页后面很适合继续补签到、到场状态和导出功能。
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
          <div className="note-strip">这场活动目前还没有报名记录。</div>
        )}
      </section>
    </div>
  );
}
