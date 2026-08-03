import { getAvatarImageUrl } from "@/lib/public-image-url";
import { hasAdminPermission } from "@/lib/admin/permissions";
import {
  getAdminContextResult,
  requireAdminPermission,
} from "@/lib/supabase/guards";

type AdminContext = Awaited<ReturnType<typeof getAdminContextResult>>;

type FixedDeskRequestRow = {
  id: string;
  resource_id: string;
  user_id: string;
  note: string | null;
  status: "submitted" | "approved" | "rejected" | "withdrawn" | "released";
  review_note: string | null;
  reviewed_at: string | null;
  released_at: string | null;
  created_at: string;
};

type FixedDeskAssignmentRow = {
  resource_id: string;
  user_id: string | null;
  opc_name: string;
  assigned_at: string;
};

type SpaceResourceRow = {
  id: string;
  code: string;
  name: string;
  resource_type: "desk" | "meeting_room";
  desk_mode: "flexible" | "fixed" | null;
  capacity: number;
  area_label: string;
  status: "active" | "disabled" | "retired";
  sort_order: number;
};

type SpaceBookingRow = {
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

type AccessRequestRow = {
  id: string;
  user_id: string;
  contact: string;
  note: string | null;
  status: "submitted" | "processed";
  review_note: string | null;
  access_identifier: string | null;
  processed_at: string | null;
  created_at: string;
};

type SpacePhotoRow = {
  id: string;
  title: string;
  image_url: string;
  sort_order: number;
  is_hero: boolean;
  status: "active" | "archived";
  created_at: string;
};

type ApplicantProfileRow = {
  id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role_label: string | null;
  organization: string | null;
};

export type AdminFixedDeskRequest = {
  id: string;
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  shareHandle: string;
  roleSummary: string;
  note: string | null;
  status: FixedDeskRequestRow["status"];
  reviewNote: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
};

export type AdminFixedDeskAssignment = {
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  userId: string | null;
  displayName: string;
  avatarUrl: string | null;
  shareHandle: string | null;
  assignedAt: string;
};

export type AdminSpaceResource = {
  id: string;
  code: string;
  name: string;
  resourceType: SpaceResourceRow["resource_type"];
  deskMode: SpaceResourceRow["desk_mode"];
  capacity: number;
  areaLabel: string;
  status: SpaceResourceRow["status"];
  assignedTo: string | null;
};

export type AdminSpaceBooking = {
  id: string;
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  userId: string;
  displayName: string;
  startsAt: string;
  endsAt: string;
  purpose: string | null;
  attendeeCount: number;
  status: SpaceBookingRow["status"];
  createdAt: string;
};

export type AdminAccessRequest = {
  id: string;
  userId: string;
  displayName: string;
  contact: string;
  note: string | null;
  status: AccessRequestRow["status"];
  reviewNote: string | null;
  accessIdentifier: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type AdminSpacePhoto = {
  id: string;
  title: string;
  imageUrl: string;
  sortOrder: number;
  isHero: boolean;
  status: SpacePhotoRow["status"];
  createdAt: string;
};

export type AdminSpacesData = {
  metrics: {
    deskCount: number;
    assignedCount: number;
    availableCount: number;
    submittedCount: number;
    accessSubmittedCount: number;
    upcomingBookingCount: number;
  };
  capabilities: {
    manageFixedDesks: boolean;
    manageResources: boolean;
    manageBookings: boolean;
    manageAccess: boolean;
    managePhotos: boolean;
  };
  requests: AdminFixedDeskRequest[];
  assignments: AdminFixedDeskAssignment[];
  resources: AdminSpaceResource[];
  bookings: AdminSpaceBooking[];
  accessRequests: AdminAccessRequest[];
  photos: AdminSpacePhoto[];
};

export async function loadAdminSpacesData(context?: AdminContext) {
  const adminContext = context ?? (await requireAdminPermission("spaces.read"));
  const { supabase } = adminContext;
  const canManageAccess = hasAdminPermission(
    adminContext.permissions,
    "spaces.manage_access",
  );
  const [
    requestsResult,
    assignmentsResult,
    resourcesResult,
    bookingsResult,
    accessResult,
    photosResult,
  ] = await Promise.all([
    supabase
      .from("community_fixed_desk_requests")
      .select("id, resource_id, user_id, note, status, review_note, reviewed_at, released_at, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("community_fixed_desk_assignments")
      .select("resource_id, user_id, opc_name, assigned_at")
      .order("assigned_at", { ascending: false }),
    supabase
      .from("community_space_resources")
      .select("id, code, name, resource_type, desk_mode, capacity, area_label, status, sort_order")
      .neq("status", "retired")
      .order("sort_order", { ascending: true }),
    supabase
      .from("community_space_bookings")
      .select("id, resource_id, user_id, starts_at, ends_at, purpose, attendee_count, status, created_at")
      .order("starts_at", { ascending: false })
      .limit(300),
    canManageAccess
      ? supabase
          .from("community_access_requests")
          .select("id, user_id, contact, note, status, review_note, access_identifier, processed_at, created_at")
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("community_space_photos")
      .select("id, title, image_url, sort_order, is_hero, status, created_at")
      .order("status", { ascending: true })
      .order("sort_order", { ascending: true }),
  ]);

  if (
    requestsResult.error || assignmentsResult.error || resourcesResult.error ||
    bookingsResult.error || accessResult.error || photosResult.error
  ) {
    throw new Error("admin_spaces_load_failed");
  }

  const requests = (requestsResult.data ?? []) as FixedDeskRequestRow[];
  const assignments = (assignmentsResult.data ?? []) as FixedDeskAssignmentRow[];
  const resources = (resourcesResult.data ?? []) as SpaceResourceRow[];
  const bookings = (bookingsResult.data ?? []) as SpaceBookingRow[];
  const accessRequests = (accessResult.data ?? []) as AccessRequestRow[];
  const photos = (photosResult.data ?? []) as SpacePhotoRow[];
  const userIds = Array.from(new Set([
    ...requests.map((item) => item.user_id),
    ...assignments.map((item) => item.user_id),
    ...bookings.map((item) => item.user_id),
    ...accessRequests.map((item) => item.user_id),
  ].filter((userId): userId is string => Boolean(userId))));
  const profilesResult = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, public_slug, display_name, avatar_url, role_label, organization")
        .in("id", userIds)
    : { data: [], error: null };
  if (profilesResult.error) throw new Error("admin_spaces_load_failed");

  const resourceMap = new Map(resources.map((item) => [item.id, item]));
  const profileMap = new Map(
    ((profilesResult.data ?? []) as ApplicantProfileRow[]).map((item) => [item.id, item]),
  );
  const assignmentMap = new Map(assignments.map((item) => [item.resource_id, item]));
  const displayNameFor = (userId: string) =>
    profileMap.get(userId)?.display_name?.trim() || "未填写显示名";

  const mappedRequests = requests.map((request) => {
    const resource = resourceMap.get(request.resource_id);
    const profile = profileMap.get(request.user_id);
    return {
      id: request.id,
      resourceId: request.resource_id,
      resourceCode: resource?.code ?? "",
      resourceName: resource?.name ?? "固定工位",
      userId: request.user_id,
      displayName: displayNameFor(request.user_id),
      avatarUrl: getAvatarImageUrl(profile?.avatar_url),
      shareHandle: profile?.public_slug?.trim() || request.user_id,
      roleSummary: [profile?.role_label?.trim(), profile?.organization?.trim()].filter(Boolean).join(" · "),
      note: request.note,
      status: request.status,
      reviewNote: request.review_note,
      reviewedAt: request.reviewed_at,
      releasedAt: request.released_at,
      createdAt: request.created_at,
    } satisfies AdminFixedDeskRequest;
  });

  const mappedAssignments = assignments.map((assignment) => {
    const resource = resourceMap.get(assignment.resource_id);
    const profile = assignment.user_id ? profileMap.get(assignment.user_id) : undefined;
    return {
      resourceId: assignment.resource_id,
      resourceCode: resource?.code ?? "",
      resourceName: resource?.name ?? "固定工位",
      userId: assignment.user_id,
      displayName: profile?.display_name?.trim() || assignment.opc_name,
      avatarUrl: getAvatarImageUrl(profile?.avatar_url),
      shareHandle: assignment.user_id ? profile?.public_slug?.trim() || assignment.user_id : null,
      assignedAt: assignment.assigned_at,
    } satisfies AdminFixedDeskAssignment;
  });

  const now = Date.now();
  return {
    metrics: {
      deskCount: resources.filter((item) => item.resource_type === "desk" && item.status === "active").length,
      assignedCount: mappedAssignments.length,
      availableCount: Math.max(0, resources.filter((item) => item.resource_type === "desk" && item.status === "active").length - mappedAssignments.length),
      submittedCount: mappedRequests.filter((item) => item.status === "submitted").length,
      accessSubmittedCount: accessRequests.filter((item) => item.status === "submitted").length,
      upcomingBookingCount: bookings.filter((item) => item.status === "confirmed" && Date.parse(item.ends_at) > now).length,
    },
    capabilities: {
      manageFixedDesks: hasAdminPermission(adminContext.permissions, "spaces.manage_fixed_desks"),
      manageResources: hasAdminPermission(adminContext.permissions, "spaces.manage_resources"),
      manageBookings: hasAdminPermission(adminContext.permissions, "spaces.manage_bookings"),
      manageAccess: canManageAccess,
      managePhotos: hasAdminPermission(adminContext.permissions, "spaces.manage_photos"),
    },
    requests: mappedRequests,
    assignments: mappedAssignments,
    resources: resources.map((resource) => ({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      resourceType: resource.resource_type,
      deskMode: resource.desk_mode,
      capacity: resource.capacity,
      areaLabel: resource.area_label,
      status: resource.status,
      assignedTo: assignmentMap.has(resource.id)
        ? mappedAssignments.find((item) => item.resourceId === resource.id)?.displayName ?? "已固定"
        : null,
    })),
    bookings: bookings.map((booking) => ({
      id: booking.id,
      resourceId: booking.resource_id,
      resourceCode: resourceMap.get(booking.resource_id)?.code ?? "",
      resourceName: resourceMap.get(booking.resource_id)?.name ?? "空间资源",
      userId: booking.user_id,
      displayName: displayNameFor(booking.user_id),
      startsAt: booking.starts_at,
      endsAt: booking.ends_at,
      purpose: booking.purpose,
      attendeeCount: booking.attendee_count,
      status: booking.status,
      createdAt: booking.created_at,
    })),
    accessRequests: accessRequests.map((item) => ({
      id: item.id,
      userId: item.user_id,
      displayName: displayNameFor(item.user_id),
      contact: item.contact,
      note: item.note,
      status: item.status,
      reviewNote: item.review_note,
      accessIdentifier: item.access_identifier,
      processedAt: item.processed_at,
      createdAt: item.created_at,
    })),
    photos: photos.map((photo) => ({
      id: photo.id,
      title: photo.title,
      imageUrl: photo.image_url,
      sortOrder: photo.sort_order,
      isHero: photo.is_hero,
      status: photo.status,
      createdAt: photo.created_at,
    })),
  } satisfies AdminSpacesData;
}
