interface MiniappUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  memberStatus: string;
  profileComplete: boolean;
  channels: string[];
}

interface IAppOption {
  globalData: {
    currentUser: MiniappUser | null;
  };
}
