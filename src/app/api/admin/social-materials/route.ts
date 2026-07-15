import { NextResponse } from "next/server";

import { requireAdminApiPermission } from "@/lib/admin/api-auth";
import { normalizeWechatSocialMaterialInput } from "@/lib/admin/social";

export async function POST(request: Request) {
  const { context, response } = await requireAdminApiPermission("social.write");
  if (response) return response;

  const input = normalizeWechatSocialMaterialInput(await request.json().catch(() => null));
  if (!input) {
    return NextResponse.json({ error: "invalid_social_material" }, { status: 400 });
  }

  const { data, error } = await context.supabase
    .from("social_materials")
    .insert({
      platform: "wechat",
      title: input.title,
      content_markdown: input.contentMarkdown,
      settings: input.settings,
      created_by: context.user.id,
    })
    .select("id, updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "social_material_create_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    material: { id: data.id, updatedAt: data.updated_at },
  });
}
