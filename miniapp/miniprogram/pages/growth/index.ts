import { getStoredSessionToken } from "../../services/api";
import { ensureSession } from "../../services/auth";
import {
  getGrowthSteps,
  getCommunityTags,
  getMembershipLevel,
  membershipLevels,
} from "../../utils/member-growth";

function formatJoinedAt(value: string | null) {
  if (!value) return "加入时间待补充";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "加入时间待补充";
  return `${date.getFullYear()}年${date.getMonth() + 1}月加入社区`;
}

Page({
  data: {
    user: null as MiniappUser | null,
    currentLevelAsset: membershipLevels[0].asset as string,
    currentLevelLabel: membershipLevels[0].label as string,
    nextLevelLabel: membershipLevels[1].label as string,
    joinedLabel: "",
    growthSteps: getGrowthSteps(0),
    communityTags: [] as MiniappUser["badges"],
    loading: true,
    loadFailed: false,
    loginRequired: false,
  },

  onShow() {
    void this.loadGrowth();
  },

  async loadGrowth() {
    if (!getStoredSessionToken()) {
      this.setData({
        loading: false,
        loadFailed: false,
        loginRequired: true,
      });
      return;
    }

    this.setData({ loading: true, loadFailed: false, loginRequired: false });
    try {
      const user = await ensureSession();
      getApp<IAppOption>().globalData.currentUser = user;
      this.showGrowth(user);
    } catch {
      const loginRequired = !getStoredSessionToken();
      this.setData({
        loading: false,
        loadFailed: !loginRequired,
        loginRequired,
      });
    }
  },

  showGrowth(user: MiniappUser) {
    const currentLevel = getMembershipLevel(user);
    this.setData({
      user,
      currentLevelAsset: membershipLevels[currentLevel].asset,
      currentLevelLabel: membershipLevels[currentLevel].label,
      nextLevelLabel:
        membershipLevels[currentLevel + 1]?.label ?? "已到达当前最高等级",
      joinedLabel: formatJoinedAt(user.joinedAt),
      growthSteps: getGrowthSteps(currentLevel),
      communityTags: getCommunityTags(user),
      loading: false,
      loadFailed: false,
      loginRequired: false,
    });
  },

  openLogin() {
    void wx.navigateTo({ url: "/pages/login/index?intent=growth" });
  },
});
