import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

const bookingErrorCodes = [
  "invalid_booking_time",
  "booking_time_in_past",
  "community_membership_required",
  "community_profile_required",
  "space_resource_unavailable",
  "fixed_desk_unavailable",
  "attendee_count_exceeds_capacity",
  "meeting_purpose_required",
  "space_resource_already_booked",
] as const;

function getBookingErrorCode(message: string) {
  return bookingErrorCodes.find((code) => message.includes(code)) ?? null;
}

export async function POST(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const payload = (await request.json().catch(() => null)) as
    | {
        resourceId?: unknown;
        startsAt?: unknown;
        endsAt?: unknown;
        purpose?: unknown;
        attendeeCount?: unknown;
      }
    | null;

  const resourceId =
    typeof payload?.resourceId === "string" ? payload.resourceId.trim() : "";
  const startsAt =
    typeof payload?.startsAt === "string" ? payload.startsAt.trim() : "";
  const endsAt =
    typeof payload?.endsAt === "string" ? payload.endsAt.trim() : "";
  const purpose =
    typeof payload?.purpose === "string" ? payload.purpose.trim() : "";
  const attendeeCount = Number(payload?.attendeeCount ?? 1);
  const startTime = Date.parse(startsAt);
  const endTime = Date.parse(endsAt);

  if (
    !/^[0-9a-f-]{36}$/i.test(resourceId) ||
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    purpose.length > 200 ||
    !Number.isInteger(attendeeCount) ||
    attendeeCount < 1 ||
    attendeeCount > 30
  ) {
    return miniappJson({ error: "invalid_space_booking" }, 400);
  }

  const { data, error } = await auth.supabase
    .rpc("submit_community_space_booking", {
      p_resource_id: resourceId,
      p_user_id: auth.session.user_id,
      p_starts_at: new Date(startTime).toISOString(),
      p_ends_at: new Date(endTime).toISOString(),
      p_purpose: purpose || null,
      p_attendee_count: attendeeCount,
    })
    .single();

  if (error || !data) {
    const errorCode = getBookingErrorCode(error?.message ?? "");
    return miniappJson(
      { error: errorCode ?? "space_booking_save_failed" },
      errorCode ? 409 : 500,
    );
  }

  return miniappJson({ booking: data }, 201);
}
