import type { Metadata } from "next";
import Link from "next/link";

import {
  formatAdminEventDate,
  formatAdminEventStatus,
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
            <p>
              后台首页先只保留列表视图。点进单场活动后，再处理编辑、相册和报名名单，整体会更像常见管理后台。
            </p>
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
            <p className="eyebrow">Debug</p>
            <h2>服务端调试信息</h2>
            <p>这里显示后台列表在服务端实际查到的数据概况。</p>
          </div>

          <pre className="debug-panel">{JSON.stringify(debugSnapshot, null, 2)}</pre>
        </section>
      ) : null}

      <section className="surface admin-card">
        {events.length > 0 ? (
          <div className="admin-list">
            <div className="admin-list-header admin-events-list-grid">
              <span>活动</span>
              <span>时间与地点</span>
              <span>状态</span>
              <span>数据概况</span>
              <span>操作</span>
            </div>

            {events.map((event) => (
              <article className="admin-list-row admin-events-list-grid" key={event.id}>
                <div className="admin-list-primary">
                  <h3 className="admin-list-title">{event.title}</h3>
                  <p className="admin-list-summary">{event.summary ?? "暂未填写活动简介。"}</p>
                  <p className="admin-compact-note">slug: {event.slug}</p>
                </div>

                <div className="admin-list-cell">
                  <strong>{formatAdminEventDate(event.event_at)}</strong>
                  <span>
                    {event.venue
                      ? `${event.city ?? "常州"} · ${event.venue}`
                      : (event.city ?? "常州")}
                  </span>
                </div>

                <div className="admin-list-cell">
                  <span className="pill">{formatAdminEventStatus(event.status)}</span>
                </div>

                <div className="admin-list-cell">
                  <span>报名 {event.registrations.length}</span>
                  <span>照片 {event.photos.length}</span>
                  <span>封面 {event.cover_image_url ? "已设置" : "未设置"}</span>
                </div>

                <div className="admin-list-actions">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="button button-secondary"
                  >
                    查看详情
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state">
            <h3>当前还没有活动数据</h3>
            <p>可以先创建第一场活动，创建后会直接进入该活动的详情页继续维护内容。</p>
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
