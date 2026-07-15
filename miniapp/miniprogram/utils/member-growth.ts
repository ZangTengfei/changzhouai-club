export type GrowthStep = {
  label: string;
  description: string;
  stateClass: string;
  stateLabel: string;
};

export const membershipLevels = [
  {
    label: "社区成员",
    description: "完成社区注册",
    asset: "/assets/badges/level-1-member-128.png",
  },
  {
    label: "共建伙伴",
    description: "参与社区共建并获得认证",
    asset: "/assets/badges/level-2-cocreator-128.png",
  },
  {
    label: "核心共建",
    description: "持续承担社区核心工作",
    asset: "/assets/badges/level-3-core-builder-128.png",
  },
  {
    label: "荣誉共建",
    description: "长期贡献并获得社区授予",
    asset: "/assets/badges/level-4-honor-builder-128.png",
  },
] as const;

const membershipBadgeCodes = new Set([
  "co_builder",
  "core_builder",
  "honor_builder",
]);

export function getMembershipLevel(user: MiniappUser) {
  const badgeCodes = new Set(user.badges.map((badge) => badge.code));
  if (badgeCodes.has("honor_builder")) return 3;
  if (badgeCodes.has("core_builder")) return 2;
  if (user.isCoBuilder || badgeCodes.has("co_builder")) return 1;
  return 0;
}

export function getGrowthSteps(currentLevel: number): GrowthStep[] {
  return membershipLevels.map((level, index) => ({
    label: level.label,
    description: level.description,
    stateClass:
      index === currentLevel
        ? "growth-step-current"
        : index < currentLevel
          ? "growth-step-complete"
          : "",
    stateLabel:
      index === currentLevel ? "当前" : index < currentLevel ? "已达成" : "未解锁",
  }));
}

export function getHonorBadges(user: MiniappUser) {
  return user.badges.filter(
    (badge) => !membershipBadgeCodes.has(badge.code),
  );
}
