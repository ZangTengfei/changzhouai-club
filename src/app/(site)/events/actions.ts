"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendAdminEventRegistrationNotification } from "@/lib/email";
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

  const [{ data: existingRegistration }, { data: eventData }, { data: profileData }] =
    await Promise.all([
      supabase
        .from("event_registrations")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("events")
        .select("title, slug, event_at, venue, city")
        .eq("id", eventId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("display_name, email, wechat, city")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  const shouldNotifyAdmin = existingRegistration?.status !== "registered";

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

  if (shouldNotifyAdmin && eventData) {
    try {
      await sendAdminEventRegistrationNotification({
        eventTitle: eventData.title,
        eventSlug: eventData.slug,
        eventAt: eventData.event_at,
        venue: eventData.venue,
        city: eventData.city,
        registrantDisplayName:
          profileData?.display_name?.trim() || user.email || "未填写显示名",
        registrantEmail: profileData?.email ?? user.email ?? null,
        registrantWechat: profileData?.wechat?.trim() || null,
        registrantCity: profileData?.city?.trim() || "常州",
        note: note || null,
      });
    } catch (notificationError) {
      console.error("Failed to send event registration notification.", {
        notificationError,
        eventId,
        userId: user.id,
      });
    }
  }

  revalidatePath("/events");
  revalidatePath(redirectTo);
  revalidatePath("/account");
  redirect(withQuery(redirectTo, { registered: "1" }));
}
