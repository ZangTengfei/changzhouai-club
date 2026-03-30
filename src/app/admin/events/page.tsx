import type { Metadata } from "next";
import Link from "next/link";

import {
  formatAdminEventDate,
  formatAdminEventStatus,
  getAdminEventStatusTone,
  getAdminErrorMessage,
  getAdminSavedMessage,
} from "@/lib/admin/event-feedback";
import { loadAdminEventsData } from "@/lib/admin/events";

export const metadata: Metadata = {
  title: "活动管理",
  description: "查看活动列表并进入单场活动编辑页。",
};

type SearchParams = {
  saved?: string;
  error?: string;
  debug?: string;
};

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { events, queryErrors, debugSnapshot } = await loadAdminEventsData();
  const showDebug = params.debug === "1";

  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">Events</p>
            <h2>活动列表</h2>
            <p>集中查看全部活动，并进入单场活动页维护详情、相册和报名名单。</p>
          </div>

          <div className="admin-toolbar-side">
            <div className="admin-mini-stat">
              <strong>{events.length}</strong>
              <span>活动总数</span>
            </div>

            <Link href="/admin/events/new" className="button">
              新建活动
            </Link>
          </div>
        </div>
      </section>

      {params.saved ? (
        <div className="note-strip">{getAdminSavedMessage(params.saved)}</div>
      ) : null}

      {params.error ? (
        <div className="note-strip">{getAdminErrorMessage(params.error)}</div>
      ) : null}

      {queryErrors.length > 0 ? (
        <div className="note-strip">后台数据读取出现问题：{queryErrors.join(" | ")}</div>
      ) : null}

      {showDebug ? (
        <section className="surface admin-card">
          <div className="section-heading">
            <p className="eyebrow">Diagnostics</p>
            <h2>数据诊断信息</h2>
            <p>这里展示活动列表当前加载到的数据概况，便于排查读取问题。</p>
          </div>

          <pre className="debug-panel">{JSON.stringify(debugSnapshot, null, 2)}</pre>
        </section>
      ) : null}

      <section className="surface admin-card">
        {events.length > 0 ? (
          <div className="admin-event-card-list">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="admin-event-card-row"
              >
                <div className="admin-event-card-main">
                  <div className="admin-event-card-title">
                    <h3 className="admin-list-title">{event.title}</h3>
                    <p className="admin-event-summary">
                      {event.summary ?? "暂未填写活动简介。"}
                    </p>
                    <p className="admin-event-slug">{event.slug}</p>
                  </div>

                  <div className="admin-event-card-details">
                    <div className="admin-event-card-block">
                      <span className="admin-card-label">时间与地点</span>
                      <strong>{formatAdminEventDate(event.event_at)}</strong>
                      <span>
                        {event.venue
                          ? `${event.city ?? "常州"} · ${event.venue}`
                          : (event.city ?? "常州")}
                      </span>
                    </div>

                    <div className="admin-event-card-block">
                      <span className="admin-card-label">状态</span>
                      <span
                        className={`pill admin-status-pill admin-status-pill-${getAdminEventStatusTone(
                          event.status,
                        )}`}
                      >
                        {formatAdminEventStatus(event.status)}
                      </span>
                    </div>

                    <div className="admin-event-card-block">
                      <span className="admin-card-label">数据概况</span>
                      <div className="admin-event-card-metrics">
                        <span>报名 {event.registrations.length}</span>
                        <span>照片 {event.photos.length}</span>
                        <span>封面 {event.cover_image_url ? "已设置" : "未设置"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>暂未创建活动</h3>
            <p>创建活动后，即可继续补充详情、相册和报名信息。</p>
            <div className="cta-row">
              <Link href="/admin/events/new" className="button">
                去创建活动
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
