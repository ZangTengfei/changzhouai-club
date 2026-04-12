"use client";

import Link from "next/link";

import { AdminEventEditorFormClient } from "@/components/admin-event-editor-form-client";

export function AdminNewEventPageClient() {
  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">New Event</p>
            <h2>新建活动</h2>
            <p>填写活动基础信息，创建后可继续补充详情介绍、照片与报名名单。</p>
          </div>

          <div className="cta-row">
            <Link href="/admin/events" className="button button-secondary">
              返回活动列表
            </Link>
          </div>
        </div>
      </section>

      <AdminEventEditorFormClient />
    </div>
  );
}
