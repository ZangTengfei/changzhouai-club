import Link from "next/link";

import { registerForEvent } from "@/app/events/actions";

type UpcomingEvent = {
  id: string;
  title: string;
  summary: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  slug: string;
};

export function EventRegistrationForm({
  event,
  isLoggedIn,
  isRegistered,
}: {
  event: UpcomingEvent;
  isLoggedIn: boolean;
  isRegistered: boolean;
}) {
  return (
    <article className="card">
      <div className="pill-row">
        <span className="pill">{event.event_at ? new Date(event.event_at).toLocaleString("zh-CN") : "时间待定"}</span>
        <span className="pill">{event.city ?? "常州"}</span>
      </div>
      <h3>{event.title}</h3>
      <p>{event.summary ?? "这是一场已经开放报名的社区活动。"}</p>
      <ul className="detail-list">
        <li>地点：{event.venue ?? "待公布"}</li>
        <li>活动标识：{event.slug}</li>
      </ul>

      {isRegistered ? (
        <div className="note-strip">你已经报名这场活动了，可以去账号页查看报名记录。</div>
      ) : isLoggedIn ? (
        <form action={registerForEvent} className="registration-form">
          <input type="hidden" name="event_id" value={event.id} />
          <label className="form-field">
            <span>报名备注</span>
            <textarea
              className="input textarea"
              name="note"
              placeholder="可选：比如你特别想交流的话题，或者是否愿意现场自我介绍。"
              rows={4}
            />
          </label>
          <button type="submit" className="button">
            报名这场活动
          </button>
        </form>
      ) : (
        <div className="cta-row">
          <Link href="/login?next=/events" className="button">
            登录后报名
          </Link>
        </div>
      )}
    </article>
  );
}
