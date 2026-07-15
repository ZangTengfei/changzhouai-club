import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { normalizeWechatSocialMaterialInput } from "@/lib/admin/social";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ materialId: string }> },
) {
  const { context, response } = await requireAdminApiPermission("social.write");
  if (response) return response;

  const input = normalizeWechatSocialMaterialInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "invalid_social_material" }, { status: 400 });
  }

  const { materialId } = await params;
  const { data, error } = await context.supabase
    .from("social_materials")
    .update({
      title: input.title,
      content_markdown: input.contentMarkdown,
      settings: input.settings,
    })
    .eq("id", materialId)
    .eq("platform", "wechat")
    .select("id, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "social_material_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    material: { id: data.id, updatedAt: data.updated_at },
  });
}
