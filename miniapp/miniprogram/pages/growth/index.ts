import { ensureSession } from "../../services/auth";
import {
  getGrowthSteps,
  getHonorBadges,
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
    honorBadges: [] as MiniappUser["badges"],
    loading: true,
    loadFailed: false,
  },

  onShow() {
    void this.loadGrowth();
  },

  async loadGrowth() {
    this.setData({ loading: true, loadFailed: false });
    try {
      const user = await ensureSession();
      const currentLevel = getMembershipLevel(user);
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        user,
        currentLevelAsset: membershipLevels[currentLevel].asset,
        currentLevelLabel: membershipLevels[currentLevel].label,
        nextLevelLabel:
          membershipLevels[currentLevel + 1]?.label ?? "已到达当前最高等级",
        joinedLabel: formatJoinedAt(user.joinedAt),
        growthSteps: getGrowthSteps(currentLevel),
        honorBadges: getHonorBadges(user),
        loading: false,
      });
    } catch {
      this.setData({ loading: false, loadFailed: true });
    }
  },
});
