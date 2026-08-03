import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { recordAdminAuditLog } from "@/lib/admin/audit";
import { uploadPublicAsset } from "@/lib/public-asset-storage";
import { buildCommunitySpacePhotoPath, EVENT_ASSETS_BUCKET } from "@/lib/supabase/storage";

export async function POST(request: Request) {
  const { context, response } = await requireAdminApiPermission("spaces.manage_photos");
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const requestedHero = String(formData.get("isHero") ?? "") === "true";
  if (!(file instanceof File) || !title || title.length > 80 || !Number.isInteger(sortOrder)) {
    return NextResponse.json({ error: "invalid_space_photo" }, { status: 400 });
  }

  try {
    const { publicUrl } = await uploadPublicAsset({
      bucket: EVENT_ASSETS_BUCKET,
      path: buildCommunitySpacePhotoPath(file.name),
      file,
    });
    const { count } = await context.supabase
      .from("community_space_photos")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    const isHero = requestedHero || !count;
    if (isHero) {
      await context.supabase
        .from("community_space_photos")
        .update({ is_hero: false })
        .eq("is_hero", true);
    }
    const { data, error } = await context.supabase
      .from("community_space_photos")
      .insert({ title, image_url: publicUrl, sort_order: sortOrder, is_hero: isHero })
      .select("id, title, image_url, sort_order, is_hero, status, created_at")
      .single();
    if (error || !data) throw error ?? new Error("space_photo_save_failed");

    await recordAdminAuditLog(context.supabase, {
      actorId: context.user.id,
      action: "space_photo.create",
      resourceType: "community_space_photo",
      resourceId: data.id,
      afterSnapshot: data as Record<string, unknown>,
    });
    return NextResponse.json({ photo: data }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload community space photo.", error);
    return NextResponse.json({ error: "space_photo_save_failed" }, { status: 500 });
  }
}
