import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase server configuration.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000).toISOString();
const eventNames = [
  "login_success",
  "home_view",
  "event_list_view",
  "event_detail_view",
  "profile_saved",
  "registration_created",
  "registration_cancelled",
  "reminder_accepted",
  "reminder_rejected",
  "share_event",
];

const counts = {};
await Promise.all(
  eventNames.map(async (eventName) => {
    const { count, error } = await supabase
      .from("miniapp_analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_name", eventName)
      .gte("created_at", since);
    if (error) throw error;
    counts[eventName] = count ?? 0;
  }),
);

function ratio(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

console.log(
  JSON.stringify(
    {
      window: { days: 30, since },
      counts,
      rates: {
        eventDetailToRegistration: ratio(
          counts.registration_created,
          counts.event_detail_view,
        ),
        registrationToReminderAcceptance: ratio(
          counts.reminder_accepted,
          counts.registration_created,
        ),
      },
    },
    null,
    2,
  ),
);
