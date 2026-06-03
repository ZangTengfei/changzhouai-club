import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import {
  formatAdminEventStatus,
  formatAdminEventType,
  formatAdminRegistrationStatus,
} from "@/lib/admin/event-feedback";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  event_type: string | null;
};

type RegistrationRow = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
  user_id: string;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  wechat: string | null;
  city: string | null;
};

const csvHeaders =
  "活动标题,活动链接,活动类型,活动状态,活动时间,活动地点,报名状态,成员昵称,账号邮箱,微信,城市,报名备注,报名时间,报名 ID,用户 ID,活动 ID".split(
    ",",
  );

function formatCsvDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(value))
    .replace(/\//g, "-");
}

function escapeCsvCell(value: string | number | null | undefined) {
  const normalized = String(value ?? "").replace(/\r?\n/g, "\n");

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

function buildCsv(rows: string[][]) {
  return [
    csvHeaders.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\r\n");
}

function buildExportFileName(eventSlug: string) {
  const date = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replace(/\//g, "");

  return `event-registrations-${eventSlug}-${date}.csv`;
}

function buildLocationLabel(event: Pick<EventRow, "city" | "venue">) {
  if (event.venue) {
    return `${event.city ?? "常州"} · ${event.venue}`;
  }

  return event.city ?? "常州";
}

export async function GET(request: Request) {
  const { context, response } = await requireAdminApiPermission("events.export_registrations");
  if (response) return response;

  const eventId = new URL(request.url).searchParams.get("event_id");

  if (!eventId) {
    return NextResponse.json({ error: "event_id_required" }, { status: 400 });
  }

  const { data: event, error: eventError } = await context.supabase
    .from("events")
    .select("id, slug, title, status, event_at, venue, city, event_type")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return NextResponse.json({ error: "database_read_failed" }, { status: 400 });
  }

  if (!event) {
    return NextResponse.json({ error: "event_not_found" }, { status: 404 });
  }

  const { data: registrationsData, error: registrationsError } = await context.supabase
    .from("event_registrations")
    .select("id, status, note, created_at, user_id")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (registrationsError) {
    return NextResponse.json({ error: "database_read_failed" }, { status: 400 });
  }

  const registrations = (registrationsData ?? []) as RegistrationRow[];
  const userIds = Array.from(new Set(registrations.map((registration) => registration.user_id)));
  const { data: profilesData, error: profilesError } =
    userIds.length > 0
      ? await context.supabase
          .from("profiles")
          .select("id, display_name, email, wechat, city")
          .in("id", userIds)
      : { data: [], error: null };

  if (profilesError) {
    return NextResponse.json({ error: "database_read_failed" }, { status: 400 });
  }

  const eventRow = event as EventRow;
  const profilesByUserId = new Map(
    ((profilesData ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );

  await recordAdminAuditLog(context.supabase, {
    actorId: context.user.id,
    action: "event_registrations.export",
    resourceType: "event",
    resourceId: eventId,
    metadata: {
      registrationCount: registrations.length,
      eventSlug: eventRow.slug,
    },
  });

  const rows = registrations.map((registration) => {
    const profile = profilesByUserId.get(registration.user_id);

    return [
      eventRow.title,
      `/events/${eventRow.slug}`,
      formatAdminEventType(eventRow.event_type),
      formatAdminEventStatus(eventRow.status),
      formatCsvDateTime(eventRow.event_at),
      buildLocationLabel(eventRow),
      formatAdminRegistrationStatus(registration.status),
      profile?.display_name ?? "",
      profile?.email ?? "",
      profile?.wechat ?? "",
      profile?.city ?? "",
      registration.note ?? "",
      formatCsvDateTime(registration.created_at),
      registration.id,
      registration.user_id,
      eventRow.id,
    ];
  });
  const csv = `\uFEFF${buildCsv(rows)}`;

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${buildExportFileName(eventRow.slug)}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
