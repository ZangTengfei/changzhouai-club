import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createPublicServerClient } from "@/lib/supabase/public-server";

const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 6;

export async function POST(
  _request: Request,
  context: { params: Promise<{ updateId: string }> },
) {
  const { updateId } = await context.params;

  if (!updateId || !hasSupabaseEnv()) {
    return NextResponse.json({ recorded: false });
  }

  const cookieStore = await cookies();
  const cookieName = `czai_update_view_${updateId}`;

  if (cookieStore.get(cookieName)) {
    return NextResponse.json({ recorded: false });
  }

  const supabase = createPublicServerClient();
  const { data, error } = await supabase.rpc("increment_community_update_view", {
    target_update_id: updateId,
  });

  if (error) {
    console.error("Failed to record community update view.", {
      error,
      updateId,
    });
    return NextResponse.json({ recorded: false });
  }

  if (!data) {
    return NextResponse.json({ recorded: false });
  }

  cookieStore.set(cookieName, "1", {
    httpOnly: true,
    maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/updates");
  revalidatePath(`/updates/${updateId}`);

  return NextResponse.json({ recorded: true, viewCount: data });
}
