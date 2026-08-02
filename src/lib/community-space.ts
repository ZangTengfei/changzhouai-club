import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BOOKING_WINDOW_MS = 24 * 60 * 60 * 1_000;
const MIN_BOOKING_WINDOW_MS = 30 * 60 * 1_000;

type CommunitySpaceResourceRow = {
  id: string;
  code: string;
  name: string;
  resource_type: "desk" | "meeting_room";
  desk_mode: "flexible" | "fixed" | null;
  capacity: number;
  area_label: string;
  x_percent: number | string;
  y_percent: number | string;
  width_percent: number | string;
  height_percent: number | string;
  rotation_degrees: number;
  status: "active" | "disabled";
  sort_order: number;
};

type CommunitySpaceBookingRow = {
  id: string;
  resource_id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
  purpose: string | null;
  attendee_count: number;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  created_at: string;
};

type CommunityAccessRequestRow = {
  id: string;
  contact: string;
  note: string | null;
  status: "submitted" | "processed";
  processed_at: string | null;
  created_at: string;
};

export type CommunitySpaceWindow = {
  startsAt: string;
  endsAt: string;
};

export const COMMUNITY_SPACE_CONTENT = {
  title: "AI Club OPC 共创社区",
  summary: "让 OPC、社区成员和真实项目在同一个空间里持续发生连接。",
  location: "武进区中以创新园 18 号楼 5 楼",
  openHours: "24 小时开放",
  pricing: "社区成员免费",
  eligibility: "社区成员与已入驻 OPC",
  deskCount: 24,
  flexibleDeskMinimum: 6,
  meetingRoomCount: 2,
} as const;

export function parseCommunitySpaceWindow(url: string) {
  const search = new URL(url).searchParams;
  const startsAt = search.get("startsAt") ?? "";
  const endsAt = search.get("endsAt") ?? "";
  const startTime = Date.parse(startsAt);
  const endTime = Date.parse(endsAt);
  const duration = endTime - startTime;

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    duration < MIN_BOOKING_WINDOW_MS ||
    duration > MAX_BOOKING_WINDOW_MS
  ) {
    return null;
  }

  return {
    startsAt: new Date(startTime).toISOString(),
    endsAt: new Date(endTime).toISOString(),
  } satisfies CommunitySpaceWindow;
}

function asNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function mapBooking(
  booking: CommunitySpaceBookingRow,
  resources: Map<string, CommunitySpaceResourceRow>,
) {
  const resource = resources.get(booking.resource_id);
  return {
    id: booking.id,
    resourceId: booking.resource_id,
    resourceCode: resource?.code ?? "",
    resourceName: resource?.name ?? "空间资源",
    resourceType: resource?.resource_type ?? "desk",
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    purpose: booking.purpose,
    attendeeCount: booking.attendee_count,
    status: booking.status,
    createdAt: booking.created_at,
  };
}

export async function loadCommunitySpaceSnapshot(
  supabase: SupabaseClient,
  window: CommunitySpaceWindow,
  userId: string | null,
) {
  const [{ data: resourceData, error: resourceError }, assignmentsResult] =
    await Promise.all([
      supabase
        .from("community_space_resources")
        .select(
          "id, code, name, resource_type, desk_mode, capacity, area_label, x_percent, y_percent, width_percent, height_percent, rotation_degrees, status, sort_order",
        )
        .order("sort_order", { ascending: true }),
      supabase.from("community_fixed_desk_assignments").select("resource_id"),
    ]);

  if (resourceError || assignmentsResult.error) {
    throw new Error("community_space_resources_load_failed");
  }

  const resources = (resourceData ?? []) as CommunitySpaceResourceRow[];
  const resourceMap = new Map(resources.map((resource) => [resource.id, resource]));
  const fixedResourceIds = new Set(
    (assignmentsResult.data ?? []).map((assignment) => assignment.resource_id),
  );
  resources
    .filter((resource) => resource.desk_mode === "fixed")
    .forEach((resource) => fixedResourceIds.add(resource.id));

  const bookingQuery = supabase
    .from("community_space_bookings")
    .select(
      "id, resource_id, user_id, starts_at, ends_at, purpose, attendee_count, status, created_at",
    )
    .eq("status", "confirmed")
    .lt("starts_at", window.endsAt)
    .gt("ends_at", window.startsAt);

  const myBookingsQuery = userId
    ? supabase
        .from("community_space_bookings")
        .select(
          "id, resource_id, user_id, starts_at, ends_at, purpose, attendee_count, status, created_at",
        )
        .eq("user_id", userId)
        .gte("ends_at", new Date().toISOString())
        .in("status", ["confirmed", "cancelled"])
        .order("starts_at", { ascending: true })
        .limit(8)
    : Promise.resolve({ data: [], error: null });

  const accessRequestQuery = userId
    ? supabase
        .from("community_access_requests")
        .select("id, contact, note, status, processed_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [bookingsResult, myBookingsResult, accessRequestResult] =
    await Promise.all([bookingQuery, myBookingsQuery, accessRequestQuery]);

  if (
    bookingsResult.error ||
    myBookingsResult.error ||
    accessRequestResult.error
  ) {
    throw new Error("community_space_bookings_load_failed");
  }

  const activeBookings = (bookingsResult.data ?? []) as CommunitySpaceBookingRow[];
  const bookedResourceIds = new Set(
    activeBookings.map((booking) => booking.resource_id),
  );
  const myBookingResourceIds = new Set(
    activeBookings
      .filter((booking) => booking.user_id === userId)
      .map((booking) => booking.resource_id),
  );

  const mappedResources = resources.map((resource) => {
    const fixed = fixedResourceIds.has(resource.id);
    const booked = bookedResourceIds.has(resource.id);
    const availability =
      resource.status === "disabled"
        ? "disabled"
        : fixed
          ? "fixed"
          : booked
            ? "booked"
            : "available";

    return {
      id: resource.id,
      code: resource.code,
      name: resource.name,
      resourceType: resource.resource_type,
      deskMode: resource.desk_mode,
      capacity: resource.capacity,
      areaLabel: resource.area_label,
      x: asNumber(resource.x_percent),
      y: asNumber(resource.y_percent),
      width: asNumber(resource.width_percent),
      height: asNumber(resource.height_percent),
      rotation: resource.rotation_degrees,
      availability,
      isMine: myBookingResourceIds.has(resource.id),
    };
  });

  const flexibleDesks = mappedResources.filter(
    (resource) =>
      resource.resourceType === "desk" && resource.availability !== "fixed",
  );

  return {
    community: COMMUNITY_SPACE_CONTENT,
    window,
    resources: mappedResources,
    availability: {
      flexibleDeskCount: flexibleDesks.length,
      availableDeskCount: flexibleDesks.filter(
        (resource) => resource.availability === "available",
      ).length,
      availableMeetingRoomCount: mappedResources.filter(
        (resource) =>
          resource.resourceType === "meeting_room" &&
          resource.availability === "available",
      ).length,
    },
    myBookings: ((myBookingsResult.data ?? []) as CommunitySpaceBookingRow[]).map(
      (booking) => mapBooking(booking, resourceMap),
    ),
    accessRequest: accessRequestResult.data
      ? {
          id: (accessRequestResult.data as CommunityAccessRequestRow).id,
          contact: (accessRequestResult.data as CommunityAccessRequestRow)
            .contact,
          note: (accessRequestResult.data as CommunityAccessRequestRow).note,
          status: (accessRequestResult.data as CommunityAccessRequestRow).status,
          processedAt: (accessRequestResult.data as CommunityAccessRequestRow)
            .processed_at,
          createdAt: (accessRequestResult.data as CommunityAccessRequestRow)
            .created_at,
        }
      : null,
  };
}
