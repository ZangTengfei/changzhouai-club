import { miniappJson, requireMiniappSession } from "@/lib/miniapp-api";

export const runtime = "nodejs";

function mapAccessRequest(row: {
  id: string;
  contact: string;
  note: string | null;
  status: "submitted" | "processed";
  processed_at: string | null;
  created_at: string;
}) {
  return {
    id: row.id,
    contact: row.contact,
    note: row.note,
    status: row.status,
    processedAt: row.processed_at,
    createdAt: row.created_at,
  };
}

export async function POST(request: Request) {
  const auth = await requireMiniappSession(request);
  if (auth.response) return auth.response;

  const payload = (await request.json().catch(() => null)) as
    | { contact?: unknown; note?: unknown }
    | null;
  const contact =
    typeof payload?.contact === "string" ? payload.contact.trim() : "";
  const note = typeof payload?.note === "string" ? payload.note.trim() : "";

  if (contact.length < 2 || contact.length > 100 || note.length > 300) {
    return miniappJson({ error: "invalid_access_request" }, 400);
  }

  const [
    { data: member, error: memberError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    auth.supabase
      .from("members")
      .select("status")
      .eq("id", auth.session.user_id)
      .maybeSingle(),
    auth.supabase
      .from("profiles")
      .select("display_name")
      .eq("id", auth.session.user_id)
      .maybeSingle(),
  ]);
  if (memberError || profileError) {
    return miniappJson({ error: "access_request_save_failed" }, 500);
  }
  if (!member || !["active", "organizer", "admin"].includes(member.status)) {
    return miniappJson({ error: "community_membership_required" }, 409);
  }
  if (
    !profile?.display_name?.trim() ||
    profile.display_name.trim() === "微信用户"
  ) {
    return miniappJson({ error: "community_profile_required" }, 409);
  }

  const { data, error } = await auth.supabase
    .from("community_access_requests")
    .insert({
      user_id: auth.session.user_id,
      contact,
      note: note || null,
    })
    .select("id, contact, note, status, processed_at, created_at")
    .single();

  if (error?.code === "23505") {
    const { data: existing, error: existingError } = await auth.supabase
      .from("community_access_requests")
      .select("id, contact, note, status, processed_at, created_at")
      .eq("user_id", auth.session.user_id)
      .eq("status", "submitted")
      .single();
    if (!existingError && existing) {
      return miniappJson({ accessRequest: mapAccessRequest(existing) });
    }
  }

  if (error || !data) {
    return miniappJson({ error: "access_request_save_failed" }, 500);
  }

  return miniappJson({ accessRequest: mapAccessRequest(data) }, 201);
}
