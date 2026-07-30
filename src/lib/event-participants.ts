import { getAvatarImageUrl } from "@/lib/public-image-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type EventParticipantPreview = {
  shareHandle: string;
  displayName: string;
  avatarUrl: string | null;
  avatarInitial: string;
};

export type EventParticipantSummary = {
  confirmedCount: number;
  participants: EventParticipantPreview[];
};

type RegistrationRow = {
  event_id: string;
  user_id: string;
};

type ProfileRow = {
  id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export async function getEventParticipantSummaries(
  eventIds: string[],
  previewLimit: number,
) {
  const uniqueEventIds = Array.from(new Set(eventIds.filter(Boolean)));
  const summaries = new Map<string, EventParticipantSummary>();

  for (const eventId of uniqueEventIds) {
    summaries.set(eventId, { confirmedCount: 0, participants: [] });
  }
  if (uniqueEventIds.length === 0) return summaries;

  const supabase = createSupabaseAdminClient();
  if (!supabase) return summaries;

  const { data: registrations, error: registrationsError } = await supabase
    .from("event_registrations")
    .select("event_id, user_id")
    .in("event_id", uniqueEventIds)
    .eq("status", "registered")
    .order("created_at", { ascending: true });
  if (registrationsError) throw new Error("event_participants_load_failed");

  const registrationRows = (registrations ?? []) as RegistrationRow[];
  for (const registration of registrationRows) {
    const summary = summaries.get(registration.event_id);
    if (summary) summary.confirmedCount += 1;
  }

  const userIds = Array.from(
    new Set(registrationRows.map((registration) => registration.user_id)),
  );
  if (userIds.length === 0) return summaries;

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, public_slug, display_name, avatar_url")
    .in("id", userIds);
  if (profilesError) throw new Error("event_participant_profiles_load_failed");

  const profilesById = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
  );
  const safePreviewLimit = Math.max(0, previewLimit);

  for (const registration of registrationRows) {
    const summary = summaries.get(registration.event_id);
    const profile = profilesById.get(registration.user_id);
    if (!summary || !profile || summary.participants.length >= safePreviewLimit) {
      continue;
    }

    const displayName = profile.display_name?.trim() || "社区成员";
    summary.participants.push({
      shareHandle: profile.public_slug?.trim() || profile.id,
      displayName,
      avatarUrl: getAvatarImageUrl(profile.avatar_url),
      avatarInitial: displayName.slice(0, 1) || "微",
    });
  }

  return summaries;
}
