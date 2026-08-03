import type { SupabaseClient } from "@supabase/supabase-js";

import { getAvatarImageUrl } from "@/lib/public-image-url";

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
  status: "active" | "disabled" | "retired";
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

type CommunityFixedDeskAssignmentRow = {
  resource_id: string;
  user_id: string | null;
  opc_name: string;
  assigned_at: string;
  public_profile_consent_at: string | null;
};

type CommunityFixedDeskRequestRow = {
  id: string;
  resource_id: string;
  note: string | null;
  status: "submitted" | "approved" | "rejected" | "withdrawn" | "released";
  review_note: string | null;
  reviewed_at: string | null;
  released_at: string | null;
  created_at: string;
};

type FixedDeskProfileRow = {
  id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
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
  deskCount: 30,
  flexibleDeskMinimum: 6,
  fixedDeskCount: 0,
  meetingRoomCount: 1,
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
      supabase
        .from("community_fixed_desk_assignments")
        .select(
          "resource_id, user_id, opc_name, assigned_at, public_profile_consent_at",
        ),
    ]);

  if (resourceError || assignmentsResult.error) {
    throw new Error("community_space_resources_load_failed");
  }

  const resources = (resourceData ?? []) as CommunitySpaceResourceRow[];
  const resourceMap = new Map(resources.map((resource) => [resource.id, resource]));
  const assignments = (assignmentsResult.data ?? []) as CommunityFixedDeskAssignmentRow[];
  const assignedUserIds = assignments
    .map((assignment) => assignment.user_id)
    .filter((userId): userId is string => Boolean(userId));
  const profileResult = assignedUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, public_slug, display_name, avatar_url")
        .in("id", assignedUserIds)
    : { data: [], error: null };
  if (profileResult.error) {
    throw new Error("community_space_resources_load_failed");
  }
  const profileMap = new Map(
    ((profileResult.data ?? []) as FixedDeskProfileRow[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );
  const assignmentMap = new Map(
    assignments.map((assignment) => [assignment.resource_id, assignment]),
  );
  const fixedResourceIds = new Set(
    assignments.map((assignment) => assignment.resource_id),
  );

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

  const fixedDeskRequestQuery = userId
    ? supabase
        .from("community_fixed_desk_requests")
        .select(
          "id, resource_id, note, status, review_note, reviewed_at, released_at, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const [
    bookingsResult,
    myBookingsResult,
    accessRequestResult,
    fixedDeskRequestResult,
  ] = await Promise.all([
    bookingQuery,
    myBookingsQuery,
    accessRequestQuery,
    fixedDeskRequestQuery,
  ]);

  if (
    bookingsResult.error ||
    myBookingsResult.error ||
    accessRequestResult.error ||
    fixedDeskRequestResult.error
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

  const mappedResources = resources
    .filter((resource) => resource.status !== "retired")
    .map((resource) => {
      const assignment = assignmentMap.get(resource.id) ?? null;
      const assigneeProfile = assignment?.user_id
        ? profileMap.get(assignment.user_id) ?? null
        : null;
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
        fixedApplicable:
          resource.resource_type === "desk" &&
          resource.status === "active" &&
          !fixed,
        isMine: myBookingResourceIds.has(resource.id),
        fixedAssignment: assignment
          ? {
              displayName: assignment.public_profile_consent_at
                ? assigneeProfile?.display_name?.trim() || assignment.opc_name
                : "常驻 OPC",
              avatarUrl: assignment.public_profile_consent_at
                ? getAvatarImageUrl(assigneeProfile?.avatar_url)
                : null,
              shareHandle:
                assignment.public_profile_consent_at && assignment.user_id
                  ? assigneeProfile?.public_slug?.trim() || assignment.user_id
                  : null,
              assignedAt: assignment.assigned_at,
              isMine: assignment.user_id === userId,
            }
          : null,
      };
    });

  const desks = mappedResources.filter(
    (resource) => resource.resourceType === "desk",
  );
  const myFixedAssignment = assignments.find(
    (assignment) => assignment.user_id === userId,
  );
  const myFixedResource = myFixedAssignment
    ? resourceMap.get(myFixedAssignment.resource_id) ?? null
    : null;

  return {
    community: {
      ...COMMUNITY_SPACE_CONTENT,
      deskCount: desks.filter((resource) => resource.availability !== "disabled")
        .length,
      fixedDeskCount: desks.filter(
        (resource) => resource.availability === "fixed",
      ).length,
    },
    window,
    resources: mappedResources,
    availability: {
      flexibleDeskCount: desks.filter(
        (resource) => resource.availability !== "fixed",
      ).length,
      availableDeskCount: desks.filter(
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
    fixedDeskRequest: fixedDeskRequestResult.data
      ? {
          id: (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow).id,
          resourceId: (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow)
            .resource_id,
          resourceCode:
            resourceMap.get(
              (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow)
                .resource_id,
            )?.code ?? "",
          note: (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow).note,
          status: (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow)
            .status,
          reviewNote: (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow)
            .review_note,
          reviewedAt: (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow)
            .reviewed_at,
          releasedAt: (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow)
            .released_at,
          createdAt: (fixedDeskRequestResult.data as CommunityFixedDeskRequestRow)
            .created_at,
        }
      : null,
    myFixedDesk: myFixedAssignment
      ? {
          resourceId: myFixedAssignment.resource_id,
          resourceCode: myFixedResource?.code ?? "",
          resourceName: myFixedResource?.name ?? "固定工位",
          assignedAt: myFixedAssignment.assigned_at,
        }
      : null,
  };
}
