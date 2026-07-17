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
  registrationReady: boolean;
  profileComplete: boolean;
  capabilityProfileComplete: boolean;
  profileCompletion: MiniappProfileCompletion;
  channels: string[];
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
  industries: string[];
  skills: string[];
}

interface MiniappProfile {
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

interface MiniappProfileUpdate {
  displayName: string;
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
  status: "registered" | "waitlisted" | "cancelled";
  note: string | null;
  created_at: string;
  events?: MiniappRegistrationEvent | null;
}

interface IAppOption {
  globalData: {
    currentUser: MiniappUser | null;
  };
}
