import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";

const uuidPattern = /^[0-9a-f-]{36}$/i;

async function promoteFirstActivePhoto(
  supabase: SupabaseClient,
) {
  const { data } = await supabase
    .from("community_space_photos")
    .select("id")
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (data?.id) {
    await supabase.from("community_space_photos").update({ is_hero: true }).eq("id", data.id);
  }
}

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ photoId: string }> },
) {
  const { context, response } = await requireAdminApiPermission("spaces.manage_photos");
  if (response) return response;
  const { photoId } = await routeContext.params;
  const payload = (await request.json().catch(() => null)) as {
    title?: unknown;
    sortOrder?: unknown;
    isHero?: unknown;
    status?: unknown;
  } | null;
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const sortOrder = Number(payload?.sortOrder);
  const isHero = payload?.isHero === true;
  const status = payload?.status;
  if (!uuidPattern.test(photoId) || !title || title.length > 80 || !Number.isInteger(sortOrder) || (status !== "active" && status !== "archived")) {
    return NextResponse.json({ error: "invalid_space_photo" }, { status: 400 });
  }
  const { data: before } = await context.supabase
    .from("community_space_photos")
    .select("*")
    .eq("id", photoId)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "space_photo_not_found" }, { status: 404 });

  if (isHero && status === "active") {
    await context.supabase.from("community_space_photos").update({ is_hero: false }).eq("is_hero", true);
  }
  const { data, error } = await context.supabase
    .from("community_space_photos")
    .update({ title, sort_order: sortOrder, status, is_hero: status === "active" && isHero })
    .eq("id", photoId)
    .select("*")
    .single();
  if (error || !data) return NextResponse.json({ error: "space_photo_save_failed" }, { status: 500 });
  if (before.is_hero && (!isHero || status === "archived")) {
    await promoteFirstActivePhoto(context.supabase);
  }
  await recordAdminAuditLog(context.supabase, {
    actorId: context.user.id,
    action: "space_photo.update",
    resourceType: "community_space_photo",
    resourceId: photoId,
    beforeSnapshot: before as Record<string, unknown>,
    afterSnapshot: data as Record<string, unknown>,
  });
  return NextResponse.json({ photo: data });
}

export async function DELETE(
  _request: Request,
  routeContext: { params: Promise<{ photoId: string }> },
) {
  const { context, response } = await requireAdminApiPermission("spaces.manage_photos");
  if (response) return response;
  const { photoId } = await routeContext.params;
  if (!uuidPattern.test(photoId)) return NextResponse.json({ error: "invalid_space_photo" }, { status: 400 });
  const { data: before } = await context.supabase
    .from("community_space_photos")
    .select("*")
    .eq("id", photoId)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "space_photo_not_found" }, { status: 404 });
  const { error } = await context.supabase
    .from("community_space_photos")
    .update({ status: "archived", is_hero: false })
    .eq("id", photoId);
  if (error) return NextResponse.json({ error: "space_photo_archive_failed" }, { status: 500 });
  if (before.is_hero) await promoteFirstActivePhoto(context.supabase);
  await recordAdminAuditLog(context.supabase, {
    actorId: context.user.id,
    action: "space_photo.archive",
    resourceType: "community_space_photo",
    resourceId: photoId,
    beforeSnapshot: before as Record<string, unknown>,
  });
  return NextResponse.json({ archived: photoId });
}
