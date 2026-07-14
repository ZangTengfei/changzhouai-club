import { ensureSession } from "../../services/auth";
import { formatEventDate } from "../../services/events";

type FootprintItem = MiniappUser["footprints"][number] & {
  dateLabel: string;
  locationLabel: string;
};

type NextActionType = "events" | "profile" | "registrations";

type GrowthStep = {
  label: string;
  stateClass: string;
};

const membershipLevels = [
  { label: "社区成员", asset: "/assets/badges/level-1-member-128.png" },
  { label: "共建伙伴", asset: "/assets/badges/level-2-cocreator-128.png" },
  { label: "核心共建", asset: "/assets/badges/level-3-core-builder-128.png" },
  { label: "荣誉共建", asset: "/assets/badges/level-4-honor-builder-128.png" },
] as const;

const membershipBadgeCodes = new Set([
  "co_builder",
  "core_builder",
  "honor_builder",
]);

function getMembershipLevel(user: MiniappUser) {
  const badgeCodes = new Set(user.badges.map((badge) => badge.code));
  if (badgeCodes.has("honor_builder")) return 3;
  if (badgeCodes.has("core_builder")) return 2;
  if (user.isCoBuilder || badgeCodes.has("co_builder")) return 1;
  return 0;
}

function getGrowthSteps(currentLevel: number): GrowthStep[] {
  return membershipLevels.map((level, index) => ({
    label: level.label,
    stateClass:
      index === currentLevel
        ? "growth-step-current"
        : index < currentLevel
          ? "growth-step-complete"
          : "",
  }));
}

function getNextAction(user: MiniappUser) {
  if (!user.profileComplete) {
    return {
      title: "完善社区资料",
      copy: "补充昵称和微信号，之后报名活动会更顺畅。",
      type: "profile" as NextActionType,
    };
  }
  if (user.stats.registrationCount === 0) {
    return {
      title: "报名参加第一场活动",
      copy: "从一次真实见面开始留下你的社区足迹。",
      type: "events" as NextActionType,
    };
  }
  if (user.stats.attendanceCount === 0) {
    return {
      title: "完成首次活动签到",
      copy: "实际到场并签到后会点亮第一枚参与徽章。",
      type: "registrations" as NextActionType,
    };
  }
  return {
    title: "继续记录下一次参与",
    copy: "看看最近的社区活动，继续积累真实参与记录。",
    type: "events" as NextActionType,
  };
}

function formatJoinedAt(value: string | null) {
  if (!value) return "加入时间待补充";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "加入时间待补充";
  return `${date.getFullYear()}年${date.getMonth() + 1}月加入`;
}

Page({
  data: {
    user: null as MiniappUser | null,
    avatarInitial: "微",
    honorBadges: [] as MiniappUser["badges"],
    joinedLabel: "",
    footprints: [] as FootprintItem[],
    currentLevelAsset: membershipLevels[0].asset as string,
    currentLevelLabel: membershipLevels[0].label as string,
    nextLevelLabel: membershipLevels[1].label as string,
    growthSteps: getGrowthSteps(0),
    nextActionTitle: "",
    nextActionCopy: "",
    nextActionType: "events" as NextActionType,
    loading: true,
    loginFailed: false,
    loggedOut: false,
    suppressAutoLogin: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    if (options.loggedOut === "1") {
      this.setData({
        loading: false,
        loggedOut: true,
        suppressAutoLogin: true,
      });
    }
  },

  onShow() {
    if (this.data.suppressAutoLogin) {
      this.setData({ suppressAutoLogin: false });
      return;
    }
    void this.loadAccount();
  },

  async loadAccount() {
    this.setData({ loading: true, loginFailed: false, loggedOut: false });

    try {
      const user = await ensureSession();
      const currentLevel = getMembershipLevel(user);
      const nextAction = getNextAction(user);
      getApp<IAppOption>().globalData.currentUser = user;
      this.setData({
        user,
        avatarInitial: user.displayName.slice(0, 1) || "微",
        honorBadges: user.badges.filter(
          (badge) => !membershipBadgeCodes.has(badge.code),
        ),
        joinedLabel: formatJoinedAt(user.joinedAt),
        footprints: user.footprints.slice(0, 2).map((footprint) => ({
          ...footprint,
          dateLabel: formatEventDate(footprint.event_at),
          locationLabel: footprint.venue || footprint.city || "常州",
        })),
        currentLevelAsset: membershipLevels[currentLevel].asset,
        currentLevelLabel: membershipLevels[currentLevel].label,
        nextLevelLabel: membershipLevels[currentLevel + 1]?.label ?? "已到达当前最高等级",
        growthSteps: getGrowthSteps(currentLevel),
        nextActionTitle: nextAction.title,
        nextActionCopy: nextAction.copy,
        nextActionType: nextAction.type,
        loading: false,
      });
    } catch {
      this.setData({ user: null, loading: false, loginFailed: true });
    }
  },

  openProfile() {
    void wx.navigateTo({ url: "/pages/profile/edit/index" });
  },

  openRegistrations() {
    void wx.navigateTo({ url: "/pages/registrations/index" });
  },

  openSettings() {
    void wx.navigateTo({ url: "/pages/settings/index" });
  },

  openEvents() {
    void wx.switchTab({ url: "/pages/events/index" });
  },

  handleNextAction() {
    if (this.data.nextActionType === "profile") {
      this.openProfile();
      return;
    }
    if (this.data.nextActionType === "registrations") {
      this.openRegistrations();
      return;
    }
    this.openEvents();
  },

  openEvent(event: WechatMiniprogram.TouchEvent) {
    const slug = String(event.currentTarget.dataset.slug ?? "");
    if (!slug) return;
    void wx.navigateTo({
      url: `/pages/events/detail/index?slug=${encodeURIComponent(slug)}`,
    });
  },
});
