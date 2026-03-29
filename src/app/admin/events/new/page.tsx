import type { Metadata } from "next";
import Link from "next/link";

import { AdminEventForm } from "@/components/admin-event-form";

export const metadata: Metadata = {
  title: "新建活动",
  description: "创建新的社区活动。",
};

export default function NewAdminEventPage() {
  return (
    <div className="admin-page-stack">
      <section className="surface admin-card">
        <div className="admin-toolbar">
          <div className="section-heading">
            <p className="eyebrow">New Event</p>
            <h2>新建活动</h2>
            <p>先创建活动基本信息。活动创建成功后，会自动跳到详情页继续补封面、相册和报名名单。</p>
          </div>

          <div className="cta-row">
            <Link href="/admin/events" className="button button-secondary">
              返回活动列表
            </Link>
          </div>
        </div>
      </section>

      <AdminEventForm />
    </div>
  );
}
