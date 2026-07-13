import { notFound } from "next/navigation";

import { redactSensitiveValue } from "@/lib/admin/permissions";
import {
  canAdmin,
  getAdminContextResult,
  requireAdminPermission,
} from "@/lib/supabase/guards";

export type AdminEventRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  agenda: string | null;
  speaker_lineup: string | null;
  registration_note: string | null;
  registration_url: string | null;
  event_type: string;
  recap: string | null;
  docs_url: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  video_provider: string | null;
  video_file_id: string | null;
  video_title: string | null;
  video_cover_url: string | null;
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

export type AdminAttendanceRow = {
  id: string;
  status: string;
  checked_in_at: string | null;
  user_id: string;
  event_id: string;
};

export type AdminEventFeedbackRow = {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  submitted_at: string;
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
  attendance: AdminAttendanceRow | null;
};

export type AdminEventFeedback = AdminEventFeedbackRow & {
  profile: AdminProfileRow | null;
};

export type AdminEvent = AdminEventRow & {
  photos: AdminEventPhotoRow[];
  registrations: AdminRegistration[];
  feedback: AdminEventFeedback[];
};

export type AdminDebugSnapshot = {
  userId: string;
  memberStatus: string;
  isStaff: boolean;
  eventsCount: number;
  photosCount: number;
  registrationsCount: number;
  attendanceCount: number;
  feedbackCount: number;
  profilesCount: number;
  queryErrors: string[];
};

export type AdminEventsData = {
  events: AdminEvent[];
  queryErrors: string[];
  debugSnapshot: AdminDebugSnapshot;
};

type AdminContext = Awaited<ReturnType<typeof getAdminContextResult>>;

function sortPhotos(photos: AdminEventPhotoRow[]) {
  return photos.slice().sort((a, b) => a.sort_order - b.sort_order);
}

export async function loadAdminEventsData(
  context?: AdminContext,
): Promise<AdminEventsData> {
  const adminContext = context ?? (await requireAdminPermission("events.read"));
  const { supabase, user, member, isStaff } = adminContext;

  if (!user) {
    throw new Error("Admin events data requires an authenticated staff user.");
  }

  const canReadRegistrations = canAdmin(adminContext, "events.read_registrations");
  const canReadRegistrationContact = canAdmin(adminContext, "events.read_registration_contact");
  const [
    { data: eventsData, error: eventsError },
    { data: photosData, error: photosError },
    { data: registrationsData, error: registrationsError },
    { data: feedbackData, error: feedbackError },
    { data: attendanceData, error: attendanceError },
    { data: profilesData, error: profilesError },
  ] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, slug, title, summary, description, agenda, speaker_lineup, registration_note, registration_url, event_type, recap, docs_url, event_at, venue, city, cover_image_url, video_url, video_provider, video_file_id, video_title, video_cover_url, status",
      )
      .order("event_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("event_photos")
      .select("id, event_id, image_url, caption, sort_order")
      .order("sort_order", { ascending: true }),
    canReadRegistrations
      ? supabase
          .from("event_registrations")
          .select("id, event_id, status, note, created_at, user_id")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    canReadRegistrations
      ? supabase
          .from("event_feedback")
          .select("id, event_id, user_id, rating, comment, submitted_at")
          .order("submitted_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    canReadRegistrations
      ? supabase
          .from("event_attendance")
          .select("id, event_id, user_id, status, checked_in_at")
      : Promise.resolve({ data: [], error: null }),
    canReadRegistrations
      ? supabase.from("profiles").select("id, display_name, email, city")
      : Promise.resolve({ data: [], error: null }),
  ]);

  const events = (eventsData ?? []) as AdminEventRow[];
  const photos = (photosData ?? []) as AdminEventPhotoRow[];
  const registrations = (registrationsData ?? []) as AdminRegistrationRow[];
  const attendance = (attendanceData ?? []) as AdminAttendanceRow[];
  const feedback = (feedbackData ?? []) as AdminEventFeedbackRow[];
  const profiles = (profilesData ?? []) as AdminProfileRow[];
  const queryErrors = [
    eventsError?.message,
    photosError?.message,
    registrationsError?.message,
    attendanceError?.message,
    feedbackError?.message,
    profilesError?.message,
  ].filter(Boolean) as string[];

  const profilesByUserId = new Map(profiles.map((profile) => [profile.id, profile]));
  const photosByEventId = new Map<string, AdminEventPhotoRow[]>();
  const registrationsByEventId = new Map<string, AdminRegistration[]>();
  const attendanceByEventAndUser = new Map(
    attendance.map((record) => [
      `${record.event_id}:${record.user_id}`,
      record,
    ]),
  );
  const feedbackByEventId = new Map<string, AdminEventFeedback[]>();

  feedback.forEach((item) => {
    const eventFeedback = feedbackByEventId.get(item.event_id) ?? [];
    eventFeedback.push({
      ...item,
      profile: profilesByUserId.get(item.user_id) ?? null,
    });
    feedbackByEventId.set(item.event_id, eventFeedback);
  });

  photos.forEach((photo) => {
    const eventPhotos = photosByEventId.get(photo.event_id) ?? [];
    eventPhotos.push(photo);
    photosByEventId.set(photo.event_id, eventPhotos);
  });

  registrations.forEach((registration) => {
    const eventRegistrations = registrationsByEventId.get(registration.event_id) ?? [];
    const profile = profilesByUserId.get(registration.user_id) ?? null;

    eventRegistrations.push({
      ...registration,
      note: canReadRegistrationContact ? registration.note : redactSensitiveValue(registration.note),
      profile: profile
        ? {
            ...profile,
            email: canReadRegistrationContact ? profile.email : redactSensitiveValue(profile.email),
          }
        : null,
      attendance:
        attendanceByEventAndUser.get(
          `${registration.event_id}:${registration.user_id}`,
        ) ?? null,
    });
    registrationsByEventId.set(registration.event_id, eventRegistrations);
  });

  return {
    events: events.map((event) => ({
      ...event,
      photos: sortPhotos(photosByEventId.get(event.id) ?? []),
      registrations: registrationsByEventId.get(event.id) ?? [],
      feedback: feedbackByEventId.get(event.id) ?? [],
    })),
    queryErrors,
    debugSnapshot: {
      userId: user.id,
      memberStatus: member?.status ?? "pending",
      isStaff,
      eventsCount: events.length,
      photosCount: photos.length,
      registrationsCount: registrations.length,
      attendanceCount: attendance.length,
      feedbackCount: feedback.length,
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
