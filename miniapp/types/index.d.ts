interface MiniappUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  memberStatus: string;
  profileComplete: boolean;
  channels: string[];
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
  skills: string[];
  interests: string[];
  willingToAttend: boolean;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
  privacyAccepted: boolean;
  privacyPolicyVersion: string;
}

interface MiniappProfileUpdate {
  displayName: string;
  wechat: string;
  city: string;
  roleLabel: string;
  organization: string;
  monthlyTime: string;
  bio: string;
  skills: string[];
  interests: string[];
  willingToAttend: boolean;
  willingToShare: boolean;
  willingToJoinProjects: boolean;
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
