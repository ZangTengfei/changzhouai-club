import { notFound } from "next/navigation";

import { getStaffContextResult, requireStaffContext } from "@/lib/supabase/guards";

export type AdminEventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  agenda: string | null;
  speaker_lineup: string | null;
  registration_note: string | null;
  recap: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
  status: string;
};

export type AdminRegistrationRow = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
  user_id: string;
  event_id: string;
};

export type AdminEventPhotoRow = {
  id: string;
  event_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

export type AdminProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  city: string | null;
};

export type AdminRegistration = AdminRegistrationRow & {
  profile: AdminProfileRow | null;
};

export type AdminEvent = AdminEventRow & {
  photos: AdminEventPhotoRow[];
  registrations: AdminRegistration[];
};

export type AdminDebugSnapshot = {
  userId: string;
  memberStatus: string;
  isStaff: boolean;
  eventsCount: number;
  photosCount: number;
  registrationsCount: number;
  profilesCount: number;
  queryErrors: string[];
};

export type AdminEventsData = {
  events: AdminEvent[];
  queryErrors: string[];
  debugSnapshot: AdminDebugSnapshot;
};

type StaffContext = Awaited<ReturnType<typeof getStaffContextResult>>;

function sortPhotos(photos: AdminEventPhotoRow[]) {
  return photos.slice().sort((a, b) => a.sort_order - b.sort_order);
}

export async function loadAdminEventsData(
  context?: StaffContext,
): Promise<AdminEventsData> {
  const { supabase, user, member, isStaff } = context ?? (await requireStaffContext());

  if (!user) {
    throw new Error("Admin events data requires an authenticated staff user.");
  }

  const [
    { data: eventsData, error: eventsError },
    { data: photosData, error: photosError },
    { data: registrationsData, error: registrationsError },
    { data: profilesData, error: profilesError },
  ] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, title, summary, description, agenda, speaker_lineup, registration_note, recap, event_at, venue, city, cover_image_url, status",
      )
      .order("event_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("event_photos")
      .select("id, event_id, image_url, caption, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("event_registrations")
      .select("id, event_id, status, note, created_at, user_id")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name, email, city"),
  ]);

  const events = (eventsData ?? []) as AdminEventRow[];
  const photos = (photosData ?? []) as AdminEventPhotoRow[];
  const registrations = (registrationsData ?? []) as AdminRegistrationRow[];
  const profiles = (profilesData ?? []) as AdminProfileRow[];
  const queryErrors = [
    eventsError?.message,
    photosError?.message,
    registrationsError?.message,
    profilesError?.message,
  ].filter(Boolean) as string[];

  const profilesByUserId = new Map(profiles.map((profile) => [profile.id, profile]));
  const photosByEventId = new Map<string, AdminEventPhotoRow[]>();
  const registrationsByEventId = new Map<string, AdminRegistration[]>();

  photos.forEach((photo) => {
    const eventPhotos = photosByEventId.get(photo.event_id) ?? [];
    eventPhotos.push(photo);
    photosByEventId.set(photo.event_id, eventPhotos);
  });

  registrations.forEach((registration) => {
    const eventRegistrations = registrationsByEventId.get(registration.event_id) ?? [];
    eventRegistrations.push({
      ...registration,
      profile: profilesByUserId.get(registration.user_id) ?? null,
    });
    registrationsByEventId.set(registration.event_id, eventRegistrations);
  });

  return {
    events: events.map((event) => ({
      ...event,
      photos: sortPhotos(photosByEventId.get(event.id) ?? []),
      registrations: registrationsByEventId.get(event.id) ?? [],
    })),
    queryErrors,
    debugSnapshot: {
      userId: user.id,
      memberStatus: member?.status ?? "pending",
      isStaff,
      eventsCount: events.length,
      photosCount: photos.length,
      registrationsCount: registrations.length,
      profilesCount: profiles.length,
      queryErrors,
    },
  };
}

export async function loadAdminEventOrThrow(eventId: string) {
  const { events, queryErrors, debugSnapshot } = await loadAdminEventsData();
  const event = events.find((item) => item.id === eventId);

  if (!event) {
    notFound();
  }

  return {
    event,
    queryErrors,
    debugSnapshot,
  };
}
