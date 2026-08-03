import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

const fixedDeskRequestErrorCodes = [
  "fixed_desk_public_profile_consent_required",
  "fixed_desk_request_note_too_long",
  "community_membership_required",
  "community_profile_required",
  "fixed_desk_not_applicable",
  "fixed_desk_already_assigned",
  "fixed_desk_user_already_assigned",
  "fixed_desk_request_already_submitted",
] as const;

function getErrorCode(message: string) {
  return fixedDeskRequestErrorCodes.find((code) => message.includes(code)) ?? null;
}

function mapRequest(row: {
  id: string;
  resource_id: string;
  note: string | null;
  status: "submitted" | "approved" | "rejected" | "withdrawn" | "released";
  review_note: string | null;
  reviewed_at: string | null;
  released_at: string | null;
  created_at: string;
}, resourceCode = "") {
  return {
    id: row.id,
    resourceId: row.resource_id,
    resourceCode,
    note: row.note,
    status: row.status,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    releasedAt: row.released_at,
    createdAt: row.created_at,
  };
}

export async function POST(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const payload = (await request.json().catch(() => null)) as
    | {
        resourceId?: unknown;
        note?: unknown;
        publicProfileConsent?: unknown;
      }
    | null;
  const resourceId =
    typeof payload?.resourceId === "string" ? payload.resourceId.trim() : "";
  const note = typeof payload?.note === "string" ? payload.note.trim() : "";
  const publicProfileConsent = payload?.publicProfileConsent === true;

  if (!/^[0-9a-f-]{36}$/i.test(resourceId) || note.length > 500) {
    return miniappJson({ error: "invalid_fixed_desk_request" }, 400);
  }

  const { data, error } = await auth.supabase
    .rpc("submit_community_fixed_desk_request", {
      p_resource_id: resourceId,
      p_user_id: auth.session.user_id,
      p_note: note || null,
      p_public_profile_consent: publicProfileConsent,
    })
    .single();

  if (error || !data) {
    const errorCode = getErrorCode(error?.message ?? "");
    return miniappJson(
      { error: errorCode ?? "fixed_desk_request_save_failed" },
      errorCode ? 409 : 500,
    );
  }

  const requestRow = data as Parameters<typeof mapRequest>[0];
  const { data: resource } = await auth.supabase
    .from("community_space_resources")
    .select("code")
    .eq("id", requestRow.resource_id)
    .maybeSingle();

  return miniappJson(
    {
      fixedDeskRequest: mapRequest(requestRow, resource?.code ?? ""),
    },
    201,
  );
}
