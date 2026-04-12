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
