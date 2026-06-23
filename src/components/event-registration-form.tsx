import Link from "next/link";

import { registerForEvent } from "@/app/(site)/events/actions";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import {
  getExternalRegistrationLabel,
  getExternalRegistrationUrl,
  getRegistrationNoteWithoutUrl,
} from "@/lib/event-registration-link";

type UpcomingEvent = {
  id: string;
  title: string;
  summary: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  slug: string;
  registration_note?: string | null;
  registration_url?: string | null;
  event_type?: string | null;
  eventTypeLabel?: string;
};

function formatEventDateTime(value: string | null) {
  if (!value) {
    return "时间待定";
  }

  return formatChangzhouDateTime(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function EventRegistrationForm({
  event,
  authState,
  isRegistered,
  redirectTo,
  showDetailLink = true,
  showEventSlug = true,
  highlightEventType = false,
}: {
  event: UpcomingEvent;
  authState: "loading" | "logged_out" | "logged_in";
  isRegistered: boolean;
  redirectTo?: string;
  showDetailLink?: boolean;
  showEventSlug?: boolean;
  highlightEventType?: boolean;
}) {
  const detailHref = `/events/${event.slug}`;
  const nextPath = redirectTo ?? detailHref;
  const eventType = event.event_type === "external" ? "external" : "community";
  const eventTypeLabel =
    event.eventTypeLabel ?? (eventType === "external" ? "外部活动" : "社区活动");
  const eventTypeHint = eventType === "external" ? "外部精选" : "AI Club 主办";
  const externalRegistrationUrl = getExternalRegistrationUrl(
    event.registration_url,
    event.registration_note,
  );
  const registrationNote = getRegistrationNoteWithoutUrl(
    event.registration_note,
    externalRegistrationUrl,
  );

  return (
    <article className={`card event-registration-card event-registration-card-${eventType}`}>
      {highlightEventType ? (
        <div className={`event-type-band event-type-band-${eventType}`}>
          <strong>{eventTypeLabel}</strong>
          <span>{eventTypeHint}</span>
        </div>
      ) : null}
      <div className="pill-row">
        {event.eventTypeLabel && !highlightEventType ? (
          <span className="pill pill-warm">{eventTypeLabel}</span>
        ) : null}
        <span className="pill">{formatEventDateTime(event.event_at)}</span>
        <span className="pill">{event.city ?? "常州"}</span>
      </div>
      <h3>{event.title}</h3>
      <p>{event.summary ?? "这是一场已经开放报名的社区活动。"}</p>
      <ul className="detail-list">
        <li>地点：{event.venue ?? "待公布"}</li>
        {showEventSlug ? <li>活动标识：{event.slug}</li> : null}
      </ul>
      {registrationNote ? <div className="note-strip">{registrationNote}</div> : null}

      {externalRegistrationUrl ? (
        <div className="cta-row">
          <a
            href={externalRegistrationUrl}
            className="button"
            target="_blank"
            rel="noreferrer"
          >
            {getExternalRegistrationLabel(externalRegistrationUrl)}
          </a>
        </div>
      ) : isRegistered ? (
        <div className="note-strip">你已经报名这场活动了，可以去账号页查看报名记录。</div>
      ) : authState === "logged_in" ? (
        <form action={registerForEvent} className="registration-form">
          <input type="hidden" name="event_id" value={event.id} />
          <input type="hidden" name="redirect_to" value={nextPath} />
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
      ) : authState === "loading" ? (
        <div className="note-strip">正在检查你的报名状态……</div>
      ) : (
        <div className="cta-row">
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="button">
            登录后报名
          </Link>
        </div>
      )}

      {showDetailLink ? (
        <div className="cta-row">
          <Link href={detailHref} className="button button-secondary">
            查看活动详情
          </Link>
        </div>
      ) : null}
    </article>
  );
}
