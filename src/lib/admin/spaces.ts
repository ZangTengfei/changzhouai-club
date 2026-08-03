import { getAvatarImageUrl } from "@/lib/public-image-url";
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
  area_label: string;
  status: string;
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

export type AdminSpacesData = {
  metrics: {
    deskCount: number;
    assignedCount: number;
    availableCount: number;
    submittedCount: number;
  };
  requests: AdminFixedDeskRequest[];
  assignments: AdminFixedDeskAssignment[];
};

export async function loadAdminSpacesData(context?: AdminContext) {
  const adminContext = context ?? (await requireAdminPermission("spaces.read"));
  const { supabase } = adminContext;
  const [requestsResult, assignmentsResult, resourcesResult] = await Promise.all([
    supabase
      .from("community_fixed_desk_requests")
      .select(
        "id, resource_id, user_id, note, status, review_note, reviewed_at, released_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("community_fixed_desk_assignments")
      .select("resource_id, user_id, opc_name, assigned_at")
      .order("assigned_at", { ascending: false }),
    supabase
      .from("community_space_resources")
      .select("id, code, name, area_label, status")
      .eq("resource_type", "desk")
      .order("sort_order", { ascending: true }),
  ]);

  if (requestsResult.error || assignmentsResult.error || resourcesResult.error) {
    throw new Error("admin_spaces_load_failed");
  }

  const requests = (requestsResult.data ?? []) as FixedDeskRequestRow[];
  const assignments = (assignmentsResult.data ?? []) as FixedDeskAssignmentRow[];
  const resources = (resourcesResult.data ?? []) as SpaceResourceRow[];
  const userIds = Array.from(
    new Set(
      [
        ...requests.map((request) => request.user_id),
        ...assignments.map((assignment) => assignment.user_id),
      ].filter((userId): userId is string => Boolean(userId)),
    ),
  );
  const profilesResult = userIds.length
    ? await supabase
        .from("profiles")
        .select(
          "id, public_slug, display_name, avatar_url, role_label, organization",
        )
        .in("id", userIds)
    : { data: [], error: null };
  if (profilesResult.error) throw new Error("admin_spaces_load_failed");

  const resourceMap = new Map(resources.map((resource) => [resource.id, resource]));
  const profileMap = new Map(
    ((profilesResult.data ?? []) as ApplicantProfileRow[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  const mappedRequests = requests.map((request) => {
    const resource = resourceMap.get(request.resource_id);
    const profile = profileMap.get(request.user_id);
    return {
      id: request.id,
      resourceId: request.resource_id,
      resourceCode: resource?.code ?? "",
      resourceName: resource?.name ?? "固定工位",
      userId: request.user_id,
      displayName: profile?.display_name?.trim() || "未填写显示名",
      avatarUrl: getAvatarImageUrl(profile?.avatar_url),
      shareHandle: profile?.public_slug?.trim() || request.user_id,
      roleSummary: [profile?.role_label?.trim(), profile?.organization?.trim()]
        .filter(Boolean)
        .join(" · "),
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
    const profile = assignment.user_id
      ? profileMap.get(assignment.user_id)
      : undefined;
    return {
      resourceId: assignment.resource_id,
      resourceCode: resource?.code ?? "",
      resourceName: resource?.name ?? "固定工位",
      userId: assignment.user_id,
      displayName: profile?.display_name?.trim() || assignment.opc_name,
      avatarUrl: getAvatarImageUrl(profile?.avatar_url),
      shareHandle: assignment.user_id
        ? profile?.public_slug?.trim() || assignment.user_id
        : null,
      assignedAt: assignment.assigned_at,
    } satisfies AdminFixedDeskAssignment;
  });

  const submittedCount = mappedRequests.filter(
    (request) => request.status === "submitted",
  ).length;
  return {
    metrics: {
      deskCount: resources.filter((resource) => resource.status === "active")
        .length,
      assignedCount: mappedAssignments.length,
      availableCount: Math.max(
        0,
        resources.filter((resource) => resource.status === "active").length -
          mappedAssignments.length,
      ),
      submittedCount,
    },
    requests: mappedRequests,
    assignments: mappedAssignments,
  } satisfies AdminSpacesData;
}
