import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import {
  createAdminEventGroupQrPreviewUrl,
  deleteAdminEventGroupQrObject,
  parseAdminEventGroupQrInput,
  saveAdminEventGroupQrCode,
} from "@/lib/admin/event-group-qr";
import { normalizeAdminEventDateTime } from "@/lib/admin/event-datetime";
import { loadAdminEventsData } from "@/lib/admin/events";
import { revalidateAdminEventPaths } from "@/lib/admin/revalidate";
import { normalizeEventType } from "@/lib/event-type";
import {
  parseEventRegistrationCapacity,
  parseEventRegistrationMode,
} from "@/lib/event-registration-options";
import { canAdmin } from "@/lib/supabase/guards";
import { parseEventVisibility } from "@/lib/event-visibility";
import { parseEventMapCoordinates } from "@/lib/event-location";

function getOptionalValue(payload: Record<string, unknown>, key: string) {
  const value = String(payload[key] ?? "").trim();
  return value || null;
}

function normalizeOptionalUrlValue(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);

    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { context: staffContext, response } = await requireAdminApiPermission("events.read");
  if (response) return response;

  const { eventId } = await context.params;
  const data = await loadAdminEventsData(staffContext);
  const event = data.events.find((item) => item.id === eventId);

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    event: {
      ...event,
      groupQrCode: event.groupQrCode
        ? {
            ...event.groupQrCode,
            previewUrl: await createAdminEventGroupQrPreviewUrl(
              event.groupQrCode.storage_path,
            ),
          }
        : null,
    },
    queryErrors: data.queryErrors,
    debugSnapshot: data.debugSnapshot,
    permissions: {
      canExportRegistrations: canAdmin(staffContext, "events.export_registrations"),
      canManageRegistrations: canAdmin(
        staffContext,
        "events.update_registration_status",
      ),
      canManageCheckin: canAdmin(
        staffContext,
        "events.update_registration_status",
      ),
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { context: staffContext, response } = await requireAdminApiPermission("events.write");
  if (response) return response;

  const { eventId } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const title = String(payload.title ?? "").trim();
  const slug = String(payload.slug ?? "").trim();
  const status = String(payload.status ?? "draft").trim();
  let registrationCapacity: number | null;
  let registrationMode: "instant" | "review";
  let groupQrInput: ReturnType<typeof parseAdminEventGroupQrInput>;
  let mapCoordinates: ReturnType<typeof parseEventMapCoordinates>;

  try {
    registrationCapacity = parseEventRegistrationCapacity(
      payload.registration_capacity,
    );
    registrationMode = parseEventRegistrationMode(payload.registration_mode);
    groupQrInput = parseAdminEventGroupQrInput(payload);
    mapCoordinates = parseEventMapCoordinates(
      payload.location_latitude,
      payload.location_longitude,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid_payload" },
      { status: 400 },
    );
  }

  if (!title || !slug) {
    return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
  }

  if (status !== "draft" && !canAdmin(staffContext, "events.publish")) {
    return NextResponse.json(
      { error: "forbidden", permission: "events.publish" },
      { status: 403 },
    );
  }

  const { error } = await staffContext.supabase
    .from("events")
    .update({
      title,
      slug,
      summary: getOptionalValue(payload, "summary"),
      description: getOptionalValue(payload, "description"),
      agenda: getOptionalValue(payload, "agenda"),
      speaker_lineup: getOptionalValue(payload, "speaker_lineup"),
      registration_note: getOptionalValue(payload, "registration_note"),
      registration_url: normalizeOptionalUrlValue(getOptionalValue(payload, "registration_url")),
      registration_mode: registrationMode,
      registration_capacity: registrationCapacity,
      event_type: normalizeEventType(getOptionalValue(payload, "event_type")),
      recap: getOptionalValue(payload, "recap"),
      docs_url: getOptionalValue(payload, "docs_url"),
      event_at: normalizeAdminEventDateTime(getOptionalValue(payload, "event_at")),
      venue: getOptionalValue(payload, "venue"),
      city: getOptionalValue(payload, "city") ?? "常州",
      location_latitude: mapCoordinates.latitude,
      location_longitude: mapCoordinates.longitude,
      cover_image_url: getOptionalValue(payload, "cover_image_url"),
      video_url: normalizeOptionalUrlValue(getOptionalValue(payload, "video_url")),
      video_provider: getOptionalValue(payload, "video_provider"),
      video_file_id: getOptionalValue(payload, "video_file_id"),
      video_title: getOptionalValue(payload, "video_title"),
      video_cover_url: normalizeOptionalUrlValue(getOptionalValue(payload, "video_cover_url")),
      status,
      visibility: parseEventVisibility(payload.visibility),
    })
    .eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  try {
    await saveAdminEventGroupQrCode({
      supabase: staffContext.supabase,
      eventId,
      actorId: staffContext.user.id,
      input: groupQrInput,
    });
  } catch {
    return NextResponse.json({ error: "group_qr_save_failed" }, { status: 400 });
  }

  revalidateAdminEventPaths(eventId, slug);
  return NextResponse.json({ saved: "event" });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  const { context: staffContext, response } = await requireAdminApiPermission("events.delete");
  if (response) return response;

  const { eventId } = await context.params;

  const [{ data: existingEvent }, { data: existingGroupQr }] = await Promise.all([
    staffContext.supabase
      .from("events")
      .select("slug")
      .eq("id", eventId)
      .maybeSingle(),
    staffContext.supabase
      .from("event_group_qr_codes")
      .select("storage_path")
      .eq("event_id", eventId)
      .maybeSingle(),
  ]);

  const { error } = await staffContext.supabase.from("events").delete().eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: "database_write_failed" }, { status: 400 });
  }

  await deleteAdminEventGroupQrObject(existingGroupQr?.storage_path);

  revalidateAdminEventPaths(eventId, existingEvent?.slug ?? undefined);
  return NextResponse.json({ saved: "deleted" });
}
