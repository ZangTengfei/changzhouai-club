import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const STAFF_STATUSES = new Set(["organizer", "admin"]);

export async function getStaffContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    member,
    isStaff: STAFF_STATUSES.has(member?.status ?? ""),
  };
}

export async function requireStaffContext() {
  const context = await getStaffContext();

  if (!context.isStaff) {
    redirect("/account?updated=staff_required");
  }

  return context;
}
