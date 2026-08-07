interface MiniappUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  roleLabel: string | null;
  organization: string | null;
  memberStatus: string;
  identityLabel: string;
  joinedAt: string | null;
  isCoBuilder: boolean;
  basicProfileReady: boolean;
  registrationReady: boolean;
  profileComplete: boolean;
  capabilityProfileComplete: boolean;
  profileCompletion: MiniappProfileCompletion;
  channels: string[];
  privacyAccepted: boolean;
  privacyPolicyVersion: string;
  phoneBound: boolean;
  phoneMasked: string | null;
  accountRecoveryAvailable: boolean;
  stats: {
    registrationCount: number;
    attendanceCount: number;
    badgeCount: number;
  };
  badges: Array<{
    code: string;
    label: string;
    description: string;
    source: string;
    awardedAt: string | null;
  }>;
  footprints: Array<{
    id: string;
    slug: string;
    title: string;
    event_at: string | null;
    venue: string | null;
    city: string | null;
    cover_image_url: string | null;
    status: string;
    participationLabel: string;
    participationTone: "active" | "attended" | "completed";
    participationAt: string;
  }>;
}

interface MiniappProfileCompletion {
  completed: boolean;
  percent: number;
  completedCount: number;
  totalCount: number;
  missingItems: string[];
}

interface MiniappProfileOptions {
  cities: string[];
  roles: string[];
  monthlyTimes: string[];
  industries: string[];
  skills: string[];
}

interface MiniappProfile {
  shareHandle: string;
  displayName: string;
  avatarUrl: string | null;
  wechat: string;
  city: string;
  roleLabel: string;
  organization: string;
  monthlyTime: string;
  bio: string;
  industryTags: string[];
  skills: string[];
  interests: string[];
  capabilitySummary: string;
  seekingSummary: string;
  willingToAttend: boolean;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  isPubliclyVisible: boolean;
  privacyAccepted: boolean;
  privacyPolicyVersion: string;
  completion: MiniappProfileCompletion;
}

interface MiniappSharedProfile {
  shareHandle: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  roleLabel: string;
  organization: string;
  bio: string;
  industryTags: string[];
  skills: string[];
  interests: string[];
  capabilitySummary: string;
  seekingSummary: string;
  willingToAttend: boolean;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  identityLabel: string;
}

interface MiniappMemberPoolItem {
  id: string;
  shareHandle: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  roleLabel: string;
  organization: string;
  skills: string[];
  capabilitySummary: string;
  seekingSummary: string;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  identityLabel: string;
  communityTags: string[];
}

interface MiniappMemberPoolResponse {
  members: MiniappMemberPoolItem[];
  filters: {
    cities: string[];
    industries: string[];
    skills: string[];
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  authenticated: boolean;
  guestPreview: boolean;
}

interface MiniappProfileUpdate {
  displayName: string;
  wechat: string;
  city: string;
  roleLabel: string;
  organization: string;
  monthlyTime?: string;
  bio: string;
  industryTags: string[];
  skills: string[];
  interests: string[];
  capabilitySummary: string;
  seekingSummary: string;
  willingToAttend?: boolean;
  willingToShare?: boolean;
  willingToJoinProjects?: boolean;
  isPubliclyVisible?: boolean;
  privacyAccepted: boolean;
}

interface MiniappAccountRecoveryAccount {
  avatarUrl: string | null;
  displayName: string | null;
  registrationCount: number;
  wechat: string | null;
  workCount: number;
}

interface MiniappAccountRecoveryPreview {
  targetEmail: string;
  currentAccount: MiniappAccountRecoveryAccount;
  oldAccount: MiniappAccountRecoveryAccount;
}

type MiniappNewsMode = "selected" | "all";

interface MiniappNewsCategory {
  id: string;
  label: string;
}

interface MiniappContentInteraction {
  isFavorited: boolean;
  lastReadAt: string | null;
}

interface MiniappNewsItem extends MiniappContentInteraction {
  id: string;
  title: string;
  summary: string | null;
  recommendationReason: string | null;
  sourceName: string;
  sourceUrl: string;
  category: string;
  categoryLabel: string;
  publishedAt: string | null;
}

interface MiniappHotTopic {
  id: string;
  title: string;
  sourceName: string;
  sourceCount: number;
  sourceNames: string[];
  sourceUrl: string;
  latestAt: string | null;
}

interface MiniappGroupDigest extends MiniappContentInteraction {
  id: string;
  date: string;
  title: string;
  overview: string | null;
  highlightCount: number;
  resourceCount: number;
  tags: string[];
}

interface MiniappGroupDigestDetail extends MiniappGroupDigest {
  highlights: Array<{ title: string; summary: string }>;
  discussions: Array<{ title: string; conclusion: string }>;
  resources: Array<{ title: string; body: string; url: string | null }>;
}

interface MiniappDailyBrief {
  date: string;
  generatedAt: string;
  lead: { title: string; leadParagraph: string } | null;
  sections: Array<{
    label: string;
    items: Array<{
      sourceName: string;
      sourceUrl: string;
      summary: string;
      title: string;
    }>;
  }>;
  flashes: Array<{
    publishedAt: string | null;
    sourceName: string;
    sourceUrl: string;
    title: string;
  }>;
}

type MiniappCommunityResourceType = "desk" | "meeting_room";
type MiniappCommunityAvailability =
  | "available"
  | "booked"
  | "fixed"
  | "disabled";

interface MiniappCommunityFixedDeskAssignee {
  displayName: string;
  avatarUrl: string | null;
  shareHandle: string | null;
  assignedAt: string;
  isMine: boolean;
}

interface MiniappCommunitySpaceResource {
  id: string;
  code: string;
  name: string;
  resourceType: MiniappCommunityResourceType;
  deskMode: "flexible" | "fixed" | null;
  capacity: number;
  areaLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  availability: MiniappCommunityAvailability;
  fixedApplicable: boolean;
  isMine: boolean;
  fixedAssignment: MiniappCommunityFixedDeskAssignee | null;
}

interface MiniappCommunitySpaceBooking {
  id: string;
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  resourceType: MiniappCommunityResourceType;
  startsAt: string;
  endsAt: string;
  purpose: string | null;
  attendeeCount: number;
  status: "confirmed" | "cancelled" | "completed" | "no_show";
  createdAt: string;
}

interface MiniappCommunityAccessRequest {
  id: string;
  contact: string;
  note: string | null;
  status: "submitted" | "processed";
  processedAt: string | null;
  createdAt: string;
}

interface MiniappCommunityFixedDeskRequest {
  id: string;
  resourceId: string;
  resourceCode: string;
  note: string | null;
  status: "submitted" | "approved" | "rejected" | "withdrawn" | "released";
  reviewNote: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
}

interface MiniappCommunityMyFixedDesk {
  resourceId: string;
  resourceCode: string;
  resourceName: string;
  assignedAt: string;
}

interface MiniappCommunitySpacePhoto {
  id: string;
  title: string;
  src: string;
  sortOrder: number;
  isHero: boolean;
}

interface MiniappCommunitySpaceSnapshot {
  community: {
    title: string;
    summary: string;
    location: string;
    openHours: string;
    pricing: string;
    eligibility: string;
    deskCount: number;
    flexibleDeskMinimum: number;
    fixedDeskCount: number;
    meetingRoomCount: number;
  };
  window: { startsAt: string; endsAt: string };
  spacePhotos: MiniappCommunitySpacePhoto[];
  resources: MiniappCommunitySpaceResource[];
  availability: {
    flexibleDeskCount: number;
    availableDeskCount: number;
    availableMeetingRoomCount: number;
  };
  myBookings: MiniappCommunitySpaceBooking[];
  accessRequest: MiniappCommunityAccessRequest | null;
  fixedDeskRequest: MiniappCommunityFixedDeskRequest | null;
  myFixedDesk: MiniappCommunityMyFixedDesk | null;
}

interface MiniappRegistrationEvent {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  event_at: string | null;
  venue: string | null;
  city: string | null;
  cover_image_url: string | null;
  status: string;
  event_type: string;
}

interface MiniappRegistration {
  id: string;
  status: "pending" | "registered" | "waitlisted" | "cancelled";
  note: string | null;
  created_at: string;
  events?: MiniappRegistrationEvent | null;
}

interface IAppOption {
  globalData: {
    currentUser: MiniappUser | null;
  };
}
