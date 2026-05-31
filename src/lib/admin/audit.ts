import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AdminAuditLogInput = {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordAdminAuditLog(
  supabase: SupabaseServerClient,
  {
    actorId,
    action,
    resourceType,
    resourceId = null,
    beforeSnapshot = null,
    afterSnapshot = null,
    metadata = null,
  }: AdminAuditLogInput,
) {
  const { error } = await supabase.from("admin_audit_logs").insert({
    actor_id: actorId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    before_snapshot: beforeSnapshot,
    after_snapshot: afterSnapshot,
    metadata,
  });

  if (error) {
    console.warn("Failed to record admin audit log.", {
      action,
      resourceType,
      resourceId,
      error,
    });
  }
}
