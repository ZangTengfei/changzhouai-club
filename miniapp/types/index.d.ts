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
