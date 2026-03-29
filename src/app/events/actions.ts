"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function registerForEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/events");
  }

  const eventId = String(formData.get("event_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!eventId) {
    redirect("/events?error=missing_event");
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
  revalidatePath("/account");
  redirect("/events?registered=1");
}
