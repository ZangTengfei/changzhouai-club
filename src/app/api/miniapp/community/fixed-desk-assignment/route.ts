import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const payload = (await request.json().catch(() => null)) as
    | { resourceId?: unknown }
    | null;
  const resourceId =
    typeof payload?.resourceId === "string" ? payload.resourceId.trim() : "";
  if (!/^[0-9a-f-]{36}$/i.test(resourceId)) {
    return miniappJson({ error: "invalid_fixed_desk_assignment" }, 400);
  }

  const { data, error } = await auth.supabase.rpc(
    "release_community_fixed_desk_assignment",
    {
      p_resource_id: resourceId,
      p_actor_id: auth.session.user_id,
      p_allow_staff: false,
    },
  );

  if (error || !data) {
    const message = error?.message ?? "";
    const errorCode = message.includes("fixed_desk_release_forbidden")
      ? "fixed_desk_release_forbidden"
      : message.includes("fixed_desk_assignment_not_found")
        ? "fixed_desk_assignment_not_found"
        : "fixed_desk_release_failed";
    return miniappJson(
      { error: errorCode },
      errorCode === "fixed_desk_release_failed" ? 500 : 409,
    );
  }

  return miniappJson({ releasedResourceId: data });
}
