import type { Metadata } from "next";

import { AdminEventForm } from "@/components/admin-event-form";
import { getStaffContext } from "@/lib/supabase/guards";

export const metadata: Metadata = {
  title: "活动管理后台",
  description: "管理社区活动、活动状态和报名名单。",
};

type RegistrationRow = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
  user_id: string;
  profiles:
    | {
        display_name: string | null;
        email: string | null;
        city: string | null;
      }
    | {
        display_name: string | null;
        email: string | null;
        city: string | null;
      }[]
    | null;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, member, isStaff } = await getStaffContext();

  if (!isStaff) {
    return (
      <div className="page-stack">
        <section className="surface admin-shell">
          <p className="eyebrow">Admin</p>
          <h1>当前账号还没有后台权限</h1>
          <p>
            你的当前成员状态是 `{member?.status ?? "pending"}`。活动后台只对
            `organizer` 或 `admin` 开放。
          </p>
          <div className="note-strip">
            先到账号页复制你的用户 ID，再在 Supabase 里执行：
            <code className="inline-code">
              update public.members set status = 'admin' where id = '{user.id}';
            </code>
          </div>
        </section>
      </div>
    );
  }

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, slug, title, summary, description, event_at, venue, city, cover_image_url, status, event_registrations(id, status, note, created_at, user_id, profiles(display_name, email, city))",
    )
    .order("event_at", { ascending: false, nullsFirst: false });

  return (
    <div className="page-stack">
      <section className="surface admin-shell">
        <p className="eyebrow">Admin</p>
        <h1>活动管理后台</h1>
        <p>
          这里可以维护活动基本信息、切换活动状态，并查看每场活动的报名名单。第一版先把最关键的运营动作收敛到同一页。
        </p>
      </section>

      {params.saved ? (
        <div className="note-strip">
          {params.saved === "deleted" ? "活动已删除。" : "活动信息已保存。"}
        </div>
      ) : null}

      {params.error ? (
        <div className="note-strip">提交时缺少必要字段，请检查活动标题和 slug。</div>
      ) : null}

      <AdminEventForm />

      <section className="admin-events">
        {(events ?? []).map((event) => {
          const registrations = (event.event_registrations ?? []) as RegistrationRow[];

          return (
            <article key={event.id} className="admin-event-block">
              <AdminEventForm event={event} />

              <section className="surface admin-card">
                <div className="section-heading">
                  <p className="eyebrow">Registrations</p>
                  <h2>{event.title} 的报名名单</h2>
                  <p>
                    当前报名数：{registrations.length}。这里先展示最核心的信息，后面可以再加签到和导出功能。
                  </p>
                </div>

                {registrations.length > 0 ? (
                  <div className="admin-registration-list">
                    {registrations.map((registration) => {
                      const rawProfile = registration.profiles;
                      const profile = Array.isArray(rawProfile)
                        ? rawProfile[0]
                        : rawProfile;

                      return (
                        <article className="registration-card" key={registration.id}>
                          <div>
                            <h3>{profile?.display_name ?? "未填写显示名"}</h3>
                            <p>邮箱：{profile?.email ?? "未提供"}</p>
                            <p>城市：{profile?.city ?? "未填写"}</p>
                            <p>报名状态：{registration.status}</p>
                            <p>
                              报名时间：
                              {new Date(registration.created_at).toLocaleString("zh-CN")}
                            </p>
                            {registration.note ? (
                              <p>备注：{registration.note}</p>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="note-strip">这场活动目前还没有报名记录。</div>
                )}
              </section>
            </article>
          );
        })}
      </section>
    </div>
  );
}
