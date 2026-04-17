"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function resolveRedirectPath(raw: string | null, fallback: string) {
  if (!raw?.startsWith("/")) {
    return fallback;
  }

  return raw;
}

function withQuery(path: string, params: Record<string, string>) {
  const [pathname, query = ""] = path.split("?");
  const searchParams = new URLSearchParams(query);

  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  const nextQuery = searchParams.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export async function registerForEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const redirectTo = resolveRedirectPath(
    String(formData.get("redirect_to") ?? "").trim() || null,
    "/events",
  );

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(redirectTo)}`);
  }

  const eventId = String(formData.get("event_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!eventId) {
    redirect(withQuery(redirectTo, { error: "missing_event" }));
  }

  await supabase.from("event_registrations").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      note: note || null,
      status: "registered",
    },
    {
      onConflict: "event_id,user_id",
      ignoreDuplicates: false,
    },
  );

  revalidatePath("/events");
  revalidatePath(redirectTo);
  revalidatePath("/account");
  redirect(withQuery(redirectTo, { registered: "1" }));
}
