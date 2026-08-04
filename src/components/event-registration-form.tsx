import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { registerForEvent } from "@/app/(site)/events/actions";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { formatChangzhouDateTime } from "@/lib/changzhou-time";
import {
  getExternalRegistrationLabel,
  getExternalRegistrationUrl,
  getRegistrationNoteWithoutUrl,
} from "@/lib/event-registration-link";
import { getEventImageUrl } from "@/lib/public-image-url";

type UpcomingEvent = {
  id: string;
  title: string;
  summary: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  slug: string;
  cover_image_url?: string | null;
  registration_note?: string | null;
  registration_url?: string | null;
  registration_mode?: string | null;
  registration_capacity?: number | null;
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

function formatEventDateBadge(value: string | null) {
  if (!value) {
    return { date: "时间待定", time: "" };
  }

  return {
    date: formatChangzhouDateTime(value, {
      month: "long",
      day: "numeric",
    }),
    time: formatChangzhouDateTime(value, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

export function EventRegistrationForm({
  event,
  authState,
  registrationStatus,
  redirectTo,
  showDetailLink = true,
  showEventSlug = true,
  highlightEventType = false,
  compact = false,
}: {
  event: UpcomingEvent;
  authState: "loading" | "logged_out" | "logged_in";
  registrationStatus: string | null;
  redirectTo?: string;
  showDetailLink?: boolean;
  showEventSlug?: boolean;
  highlightEventType?: boolean;
  compact?: boolean;
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
  const capacityLabel = event.registration_capacity
    ? `限 ${event.registration_capacity} 人`
    : "不限人数";
  const registrationModeLabel =
    event.registration_mode === "review" ? "申请制" : "直接确认";

  if (compact) {
    const registrationHref = `${detailHref}#registration`;
    const coverImageUrl = getEventImageUrl(event.cover_image_url, "miniapp-card");
    const coverObjectClass =
      event.cover_image_url &&
      /poster|layout|challenge|registration/i.test(event.cover_image_url)
        ? "object-contain"
        : "object-cover";
    const eventDateBadge = formatEventDateBadge(event.event_at);
    const statusLabel = registrationStatus
      ? registrationStatus === "pending"
        ? "报名待审核"
        : registrationStatus === "waitlisted"
          ? "已进入候补"
          : "已报名"
      : null;

    return (
      <article
        className={`event-registration-card event-registration-card-${eventType} grid min-h-full grid-rows-[auto_1fr] overflow-hidden rounded-[var(--radius-md)] bg-white shadow-[0_12px_30px_rgba(var(--ink-rgb),0.07)]`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[#eef2f0]">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt=""
              className={`size-full ${coverObjectClass}`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="grid size-full place-items-center bg-[#eef2f0]">
              <SiteLogoMark className="h-auto w-[88px] opacity-70" />
            </div>
          )}
          <time
            dateTime={event.event_at ?? undefined}
            className="absolute top-3 right-3 grid min-w-[86px] gap-0.5 rounded-[var(--radius-sm)] bg-white/94 px-3 py-2 text-center shadow-[0_8px_20px_rgba(var(--ink-rgb),0.12)] backdrop-blur-sm"
          >
            <strong className="text-[0.9rem] leading-tight font-black text-[var(--accent-strong)]">
              {eventDateBadge.date}
            </strong>
            {eventDateBadge.time ? (
              <span className="text-[0.7rem] leading-tight font-bold text-[rgba(var(--ink-rgb),0.62)]">
                {eventDateBadge.time}
              </span>
            ) : null}
          </time>
        </div>

        <div className="grid content-start gap-3.5 p-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <strong
              className={`w-fit rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.78rem] font-black ${
                eventType === "external"
                  ? "bg-[#edf5ff] text-[#1f6ed2]"
                  : "bg-[#e9f9f0] text-[var(--accent-strong)]"
              }`}
            >
              {eventTypeLabel}
            </strong>
            <span className="shrink-0 text-[0.76rem] font-extrabold text-[rgba(var(--ink-rgb),0.56)]">
              {eventTypeHint}
            </span>
          </div>

          <h3 className="m-0 text-[clamp(1.22rem,1.8vw,1.5rem)] leading-[1.22] font-bold tracking-[-0.035em] text-[var(--ink)]">
            {event.title}
          </h3>
          <p className="m-0 line-clamp-2 text-[0.94rem] leading-[1.62] text-[rgba(var(--ink-rgb),0.66)]">
            {event.summary ?? "这是一场已经开放报名的社区活动。"}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-[var(--radius-pill)] bg-[#edf5ff] px-2.5 py-1 text-[0.75rem] font-extrabold text-[#235b9b]">
              {registrationModeLabel}
            </span>
            <span className="rounded-[var(--radius-pill)] bg-[#fff2e5] px-2.5 py-1 text-[0.75rem] font-extrabold text-[#745811]">
              {capacityLabel}
            </span>
          </div>

          <div className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-2 text-[0.88rem] leading-[1.45] font-semibold text-[rgba(var(--ink-rgb),0.66)] [&_svg]:mt-[2px] [&_svg]:size-4 [&_svg]:text-[rgba(var(--accent-rgb),0.82)]">
            <MapPin aria-hidden="true" strokeWidth={2} />
            <span className="line-clamp-2">{event.venue ?? event.city ?? "地点待公布"}</span>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
            {externalRegistrationUrl ? (
              <a
                href={externalRegistrationUrl}
                className="button min-h-11 rounded-[var(--radius-sm)]"
                target="_blank"
                rel="noreferrer"
              >
                {getExternalRegistrationLabel(externalRegistrationUrl)}
              </a>
            ) : statusLabel ? (
              <span className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] bg-[#e9f9f0] px-4 font-extrabold text-[var(--accent-strong)]">
                {statusLabel}
              </span>
            ) : (
              <Link
                href={registrationHref}
                prefetch={false}
                className="button min-h-11 rounded-[var(--radius-sm)]"
              >
                {event.registration_mode === "review" ? "申请报名" : "立即报名"}
              </Link>
            )}
            <Link
              href={detailHref}
              prefetch={false}
              className="inline-flex min-h-11 items-center gap-1.5 px-1 font-extrabold text-[var(--ink)] hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&_svg]:size-4"
            >
              活动详情
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </article>
    );
  }

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
        <li>
          名额：
          {event.registration_capacity
            ? `限 ${event.registration_capacity} 人`
            : "不限人数"}
        </li>
        <li>
          报名：
          {event.registration_mode === "review"
            ? "提交后由组织方审核"
            : "提交后立即确认"}
        </li>
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
      ) : registrationStatus ? (
        <div className="note-strip">
          {registrationStatus === "pending"
            ? "报名申请已提交，正在等待组织方审核。"
            : registrationStatus === "waitlisted"
              ? "当前确认名额已满，你已进入候补。"
              : "你已经报名这场活动了，可以去账号页查看报名记录。"}
        </div>
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
            {event.registration_mode === "review"
              ? "提交报名申请"
              : "报名这场活动"}
          </button>
        </form>
      ) : authState === "loading" ? (
        <div className="note-strip">正在检查你的报名状态……</div>
      ) : (
        <div className="cta-row">
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} prefetch={false} className="button">
            登录后报名
          </Link>
        </div>
      )}

      {showDetailLink ? (
        <div className="cta-row">
          <Link href={detailHref} prefetch={false} className="button button-secondary">
            查看活动详情
          </Link>
        </div>
      ) : null}
    </article>
  );
}
