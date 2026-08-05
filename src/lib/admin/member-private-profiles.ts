import type { getAdminContextResult } from "@/lib/supabase/guards";

type AdminContext = Awaited<ReturnType<typeof getAdminContextResult>>;

type PrivateProfileRow = {
  id: string;
  display_name: string;
  aliases: string[] | null;
  identity_status: "named" | "partial" | "anonymous";
  linked_user_id: string | null;
  profile_summary: string | null;
  roles: string[] | null;
  organizations: string[] | null;
  industry_tags: string[] | null;
  capability_tags: string[] | null;
  interest_tags: string[] | null;
  needs: string[] | null;
  offers: string[] | null;
  review_status: "pending" | "reviewed" | "needs_confirmation";
  sharing_consent_status: "not_requested" | "pending" | "granted" | "revoked";
  sharing_consent_scope: string | null;
  sharing_consent_at: string | null;
  linked_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type EvidenceRow = {
  id: string;
  profile_id: string;
  event_id: string | null;
  event_date: string;
  event_match_status: "matched_by_date" | "ambiguous_date" | "unmatched";
  source_title: string;
  summary_filename: string;
  transcript_filename: string | null;
  source_locator: string | null;
  observation_kind: string;
  observation: string;
  confidence: number | string;
};

type AccountProfileRow = {
  id: string;
  display_name: string | null;
};

type EventRow = {
  id: string;
  title: string;
};

export type AdminPrivateProfileEvidence = {
  id: string;
  eventId: string | null;
  eventDate: string;
  eventTitle: string | null;
  eventMatchStatus: EvidenceRow["event_match_status"];
  sourceTitle: string;
  summaryFilename: string;
  transcriptFilename: string | null;
  sourceLocator: string | null;
  observationKind: string;
  observation: string;
  confidence: number;
};

export type AdminPrivateMemberProfile = {
  id: string;
  displayName: string;
  aliases: string[];
  identityStatus: PrivateProfileRow["identity_status"];
  linkedUserId: string | null;
  linkedDisplayName: string | null;
  profileSummary: string | null;
  roles: string[];
  organizations: string[];
  industryTags: string[];
  capabilityTags: string[];
  interestTags: string[];
  needs: string[];
  offers: string[];
  reviewStatus: PrivateProfileRow["review_status"];
  sharingConsentStatus: PrivateProfileRow["sharing_consent_status"];
  sharingConsentScope: string | null;
  sharingConsentAt: string | null;
  linkedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activityCount: number;
  matchedEventCount: number;
  firstEventDate: string | null;
  lastEventDate: string | null;
  evidence: AdminPrivateProfileEvidence[];
};

export type AdminPrivateProfileAccountOption = {
  id: string;
  displayName: string;
  linkedProfileId: string | null;
};

export type AdminPrivateProfilesData = {
  profiles: AdminPrivateMemberProfile[];
  accountOptions: AdminPrivateProfileAccountOption[];
  canWrite: boolean;
  stats: {
    totalProfiles: number;
    linkedProfiles: number;
    pendingReview: number;
    distinctEvents: number;
    evidenceCount: number;
  };
  queryErrors: string[];
};

export async function loadAdminPrivateProfilesData(
  context: AdminContext,
  canWrite: boolean,
): Promise<AdminPrivateProfilesData> {
  const [
    { data: profilesData, error: profilesError },
    { data: evidenceData, error: evidenceError },
    { data: accountData, error: accountError },
    { data: eventData, error: eventError },
  ] = await Promise.all([
    context.supabase
      .from("member_private_profiles")
      .select(
        "id, display_name, aliases, identity_status, linked_user_id, profile_summary, roles, organizations, industry_tags, capability_tags, interest_tags, needs, offers, review_status, sharing_consent_status, sharing_consent_scope, sharing_consent_at, linked_at, reviewed_at, created_at, updated_at",
      )
      .order("display_name"),
    context.supabase
      .from("member_private_profile_evidence")
      .select(
        "id, profile_id, event_id, event_date, event_match_status, source_title, summary_filename, transcript_filename, source_locator, observation_kind, observation, confidence",
      )
      .order("event_date", { ascending: false }),
    context.supabase.from("profiles").select("id, display_name").order("display_name"),
    context.supabase.from("events").select("id, title"),
  ]);

  const profileRows = (profilesData ?? []) as PrivateProfileRow[];
  const evidenceRows = (evidenceData ?? []) as EvidenceRow[];
  const accountRows = (accountData ?? []) as AccountProfileRow[];
  const eventRows = (eventData ?? []) as EventRow[];
  const accountsById = new Map(accountRows.map((account) => [account.id, account]));
  const eventsById = new Map(eventRows.map((event) => [event.id, event]));
  const evidenceByProfileId = new Map<string, AdminPrivateProfileEvidence[]>();

  evidenceRows.forEach((row) => {
    const items = evidenceByProfileId.get(row.profile_id) ?? [];
    items.push({
      id: row.id,
      eventId: row.event_id,
      eventDate: row.event_date,
      eventTitle: row.event_id ? eventsById.get(row.event_id)?.title ?? null : null,
      eventMatchStatus: row.event_match_status,
      sourceTitle: row.source_title,
      summaryFilename: row.summary_filename,
      transcriptFilename: row.transcript_filename,
      sourceLocator: row.source_locator,
      observationKind: row.observation_kind,
      observation: row.observation,
      confidence: Number(row.confidence),
    });
    evidenceByProfileId.set(row.profile_id, items);
  });

  const profiles = profileRows.map((row) => {
    const evidence = evidenceByProfileId.get(row.id) ?? [];
    const eventDates = Array.from(new Set(evidence.map((item) => item.eventDate))).sort();

    return {
      id: row.id,
      displayName: row.display_name,
      aliases: row.aliases ?? [],
      identityStatus: row.identity_status,
      linkedUserId: row.linked_user_id,
      linkedDisplayName: row.linked_user_id
        ? accountsById.get(row.linked_user_id)?.display_name?.trim() || "未填写显示名"
        : null,
      profileSummary: row.profile_summary,
      roles: row.roles ?? [],
      organizations: row.organizations ?? [],
      industryTags: row.industry_tags ?? [],
      capabilityTags: row.capability_tags ?? [],
      interestTags: row.interest_tags ?? [],
      needs: row.needs ?? [],
      offers: row.offers ?? [],
      reviewStatus: row.review_status,
      sharingConsentStatus: row.sharing_consent_status,
      sharingConsentScope: row.sharing_consent_scope,
      sharingConsentAt: row.sharing_consent_at,
      linkedAt: row.linked_at,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      activityCount: eventDates.length,
      matchedEventCount: evidence.filter((item) => item.eventId).length,
      firstEventDate: eventDates.at(0) ?? null,
      lastEventDate: eventDates.at(-1) ?? null,
      evidence,
    } satisfies AdminPrivateMemberProfile;
  });

  const linkedProfileByUserId = new Map(
    profiles
      .filter((profile) => profile.linkedUserId)
      .map((profile) => [profile.linkedUserId as string, profile.id]),
  );
  const distinctEventDates = new Set(evidenceRows.map((row) => row.event_date));

  return {
    profiles,
    accountOptions: accountRows.map((account) => ({
      id: account.id,
      displayName: account.display_name?.trim() || "未填写显示名",
      linkedProfileId: linkedProfileByUserId.get(account.id) ?? null,
    })),
    canWrite,
    stats: {
      totalProfiles: profiles.length,
      linkedProfiles: profiles.filter((profile) => profile.linkedUserId).length,
      pendingReview: profiles.filter((profile) => profile.reviewStatus !== "reviewed").length,
      distinctEvents: distinctEventDates.size,
      evidenceCount: evidenceRows.length,
    },
    queryErrors: [
      profilesError ? `member_private_profiles: ${profilesError.message}` : null,
      evidenceError ? `member_private_profile_evidence: ${evidenceError.message}` : null,
      accountError ? `profiles: ${accountError.message}` : null,
      eventError ? `events: ${eventError.message}` : null,
    ].filter(Boolean) as string[],
  };
}
